import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';

if (typeof window !== 'undefined') {
  StellarWalletsKit.init({
    modules: defaultModules(),
  });
  StellarWalletsKit.setNetwork(Networks.TESTNET);
}

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET;

export const rpcServer = new StellarSdk.rpc.Server(RPC_URL);
export const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Reads contract state by simulating a transaction (read-only, no auth required).
 */
export async function callReadMethod<T = any>(
  functionName: string,
  args: any[] = []
): Promise<T | null> {
  const contractId = process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_ID;
  if (!contractId) {
    console.warn('Contract ID not configured.');
    return null;
  }

  try {
    // Build a deterministic dummy address using the SDK's own encoder.
    // This avoids crypto.getRandomValues() issues in SSR/Turbopack environments
    // and guarantees the address passes all internal SDK checksum validation.
    const dummyAddress = StellarSdk.StrKey.encodeEd25519PublicKey(Buffer.alloc(32));
    const dummyAccount = new StellarSdk.Account(dummyAddress, '0');
    const contract = new StellarSdk.Contract(contractId);

    const tx = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(30)
      .build();

    const simulated = await rpcServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
      console.error(`Read method ${functionName} simulation error:`, simulated.error);
      return null;
    }

    const retval = (simulated as any).results?.[0]?.retval;
    if (!retval) return null;

    return StellarSdk.scValToNative(retval) as T;
  } catch (error) {
    console.error(`Error invoking read method ${functionName}:`, error);
    return null;
  }
}

/**
 * Builds, simulates, requests wallet signature, and submits a write transaction.
 */
export async function executeWriteMethod(
  signerAddress: string,
  functionName: string,
  args: any[] = []
): Promise<string> {
  const contractId = process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_ID;
  if (!contractId) {
    throw new Error('Contract ID is not configured.');
  }

  // 1. Verify account is funded and fetch the current sequence number
  let sourceAccount: StellarSdk.Account;
  try {
    const accountDetails = await horizonServer.loadAccount(signerAddress);
    sourceAccount = accountDetails;

    const nativeBal = accountDetails.balances.find((b) => b.asset_type === 'native');
    const xlmAmount = parseFloat(nativeBal?.balance || '0');
    if (xlmAmount < 2.0) {
      throw new Error(
        'Insufficient balance. You need at least 2 XLM to cover transaction and gas fees.'
      );
    }
  } catch (e: any) {
    if (e?.response?.status === 404) {
      throw new Error('Account not funded. Please fund your account with Friendbot first.');
    }
    throw e;
  }

  // 2. Build the base transaction
  const contract = new StellarSdk.Contract(contractId);
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100000', // 0.01 XLM generous baseline for Soroban; simulation will refine it
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(120)
    .build();

  // 3. Simulate to compute precise resource fees and ledger footprint
  const simulated = await rpcServer.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
    const simError =
      typeof simulated.error === 'string'
        ? simulated.error
        : JSON.stringify(simulated.error, null, 2);
    console.error(`Simulation error for ${functionName}:`, simError);
    throw new Error(`Simulation failed: ${simError}`);
  }

  // 4. Assemble final transaction with auth entries + updated fees from simulation.
  //    In stellar-sdk v13, assembleTransaction() returns a TransactionBuilder.
  //    Call .build() to get the final Transaction with all footprints applied.
  const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulated).build();

  // 5. Ask the connected wallet to sign the transaction.
  //    MUST pass networkPassphrase — Freighter and others use it to validate the network.
  let signedXdr: string;
  try {
    const signed = await StellarWalletsKit.signTransaction(assembledTx.toXDR(), {
      address: signerAddress,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    signedXdr = signed.signedTxXdr;
  } catch (walletError: any) {
    console.error('Wallet signature error:', walletError);
    const msg = walletError?.message || String(walletError);
    if (
      msg.toLowerCase().includes('reject') ||
      msg.toLowerCase().includes('cancel') ||
      msg.toLowerCase().includes('denied')
    ) {
      throw new Error('Transaction was rejected or cancelled by the user.');
    }
    throw new Error(`Wallet error: ${msg}`);
  }

  if (!signedXdr) {
    throw new Error('No signature returned from the wallet.');
  }

  // 6. Submit the signed envelope to Soroban RPC
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  ) as StellarSdk.Transaction;
  const response = await rpcServer.sendTransaction(signedTx);

  if (response.status === 'ERROR') {
    const sendError =
      typeof (response as any).errorResult === 'object'
        ? JSON.stringify((response as any).errorResult)
        : String((response as any).errorResult || 'unknown RPC error');
    throw new Error(`Transaction rejected by RPC: ${sendError}`);
  }

  const txHash = response.hash;

  // 7. Poll until the transaction is confirmed (NOT_FOUND → SUCCESS | FAILED)
  let statusResponse = await rpcServer.getTransaction(txHash);
  let attempts = 0;

  while (statusResponse.status === 'NOT_FOUND') {
    if (attempts >= 30) {
      throw new Error('Transaction confirmation timed out after 30 seconds.');
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    statusResponse = await rpcServer.getTransaction(txHash);
    attempts++;
  }

  if (statusResponse.status === 'FAILED') {
    throw new Error('Transaction execution failed on-chain. Check the explorer for details.');
  }

  // status === 'SUCCESS'
  return txHash;
}

/**
 * Helpers to create typed Soroban ScVal arguments
 */
export function scValAddress(address: string) {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address: address must be a non-empty string.');
  }
  const trimmed = address.trim();
  if (!trimmed.startsWith('G') || trimmed.length !== 56) {
    throw new Error(
      `Invalid Stellar address: "${trimmed}". Must be a 56-character public key starting with 'G'.`
    );
  }
  try {
    return StellarSdk.Address.fromString(trimmed).toScVal();
  } catch (e: any) {
    throw new Error(`Invalid Stellar address: ${e?.message || trimmed}`);
  }
}

export function scValString(str: string) {
  // Soroban SDK v13 requires Buffer/Uint8Array encoding for scvString ScVals
  return StellarSdk.xdr.ScVal.scvString(Buffer.from(str, 'utf8'));
}

export function scValU32(val: number) {
  return StellarSdk.xdr.ScVal.scvU32(val);
}

export function scValBool(val: boolean) {
  return StellarSdk.xdr.ScVal.scvBool(val);
}
