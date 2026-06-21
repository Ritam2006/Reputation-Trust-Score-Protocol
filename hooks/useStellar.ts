import { create } from 'zustand';
import { getXLMBalance } from '@/lib/stellar';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';

if (typeof window !== 'undefined') {
  try {
    StellarWalletsKit.init({
      modules: defaultModules(),
    });
    StellarWalletsKit.setNetwork(Networks.TESTNET);
    console.log('✓ StellarWalletsKit initialized successfully');
  } catch (err) {
    console.error('Failed to initialize StellarWalletsKit:', err);
  }
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
      // Check if wallet kit is properly initialized
      if (!StellarWalletsKit) {
        throw new Error('Wallet kit not initialized. Please refresh the page and try again.');
      }

      // Prompt wallet connection modal statically
      let authResult;
      try {
        authResult = await StellarWalletsKit.authModal();
      } catch (authError: any) {
        console.error('Auth modal error:', authError);
        throw authError;
      }
      
      const address = authResult?.address;
      
      if (!address) {
        throw new Error("No address returned from wallet. Please try again.");
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
      console.error('Wallet connection error details:', {
        error: walletError,
        message: walletError?.message,
        name: walletError?.name,
        stack: walletError?.stack,
      });
      
      let userFriendlyMsg = 'Could not connect wallet. Please try again.';
      
      const errMsg = (walletError?.message || String(walletError) || '').toLowerCase();
      
      if (
        errMsg.includes('closed') || 
        errMsg.includes('user closed') ||
        errMsg.includes('dismissed') ||
        errMsg.includes('cancelled')
      ) {
        userFriendlyMsg = 'Wallet connection was cancelled. Please try again.';
      } else if (
        errMsg.includes('not installed') || 
        errMsg.includes('install') || 
        errMsg.includes('extension')
      ) {
        userFriendlyMsg = 'Wallet extension not found. Please install Freighter, Albedo, or Hana.';
      } else if (errMsg.includes('network') || errMsg.includes('testnet')) {
        userFriendlyMsg = 'Make sure your wallet is set to Testnet network.';
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
