import * as Client from 'reputation';

export const contractId = "CBICHSYLR3EX47TD6ILAZKLVJKZMGVB234CABE2QAN33ECSKG3BFM6HK";

export const client = new Client.Client({
  contractId,
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
});
