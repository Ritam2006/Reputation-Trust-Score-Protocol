import { create } from 'zustand';
import { getXLMBalance } from '@/lib/stellar';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';

if (typeof window !== 'undefined') {
  StellarWalletsKit.init({
    modules: defaultModules(),
  });
  StellarWalletsKit.setNetwork(Networks.TESTNET);
}

interface StellarState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  network: string;
  error: string | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
  setError: (msg: string | null) => void;
}

export const useStellar = create<StellarState>((set, get) => ({
  isConnected: false,
  address: null,
  balance: '0',
  network: 'Testnet',
  error: null,
  isLoading: false,

  connectWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      // Prompt wallet connection modal statically
      const { address } = await StellarWalletsKit.authModal();
      
      if (!address) {
        throw new Error("No address returned from wallet.");
      }

      // Fetch balance
      const balance = await getXLMBalance(address);

      set({
        address,
        isConnected: true,
        balance,
        isLoading: false,
        error: null,
      });
    } catch (walletError: any) {
      console.error('Wallet connection error:', walletError);
      let userFriendlyMsg = 'Could not retrieve address from wallet.';
      
      const errMsg = walletError?.message || String(walletError);
      if (
        errMsg.includes('closed') || 
        errMsg.includes('User closed') || 
        errMsg.includes('user closed') ||
        errMsg.includes('dismissed')
      ) {
        userFriendlyMsg = 'Wallet connection modal was closed by the user.';
      } else if (
        errMsg.includes('not installed') || 
        errMsg.includes('install') || 
        errMsg.includes('found')
      ) {
        userFriendlyMsg = 'Selected wallet is not installed. Please install Freighter, Albedo, or Hana first.';
      } else if (errMsg) {
        userFriendlyMsg = errMsg;
      }
      
      set({ error: userFriendlyMsg, isLoading: false, isConnected: false, address: null });
    }
  },

  disconnectWallet: async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (err) {
      console.error('Error during wallet disconnect:', err);
    }
    set({
      isConnected: false,
      address: null,
      balance: '0',
      error: null,
      isLoading: false,
    });
  },

  refreshBalance: async () => {
    const { address } = get();
    if (!address) return;
    try {
      const balance = await getXLMBalance(address);
      set({ balance });
    } catch (err) {
      console.error('Refresh balance failed:', err);
    }
  },

  clearError: () => set({ error: null }),
  setError: (msg: string | null) => set({ error: msg }),
}));
