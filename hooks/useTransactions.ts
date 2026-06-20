import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TransactionRecord {
  hash: string;
  type: string;
  timestamp: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error?: string;
  explorerUrl: string;
}

interface TransactionState {
  transactions: TransactionRecord[];
  addTransaction: (hash: string, type: string) => void;
  updateTransactionStatus: (hash: string, status: 'SUCCESS' | 'FAILED', error?: string) => void;
  clearHistory: () => void;
}

export const useTransactions = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (hash, type) => {
        const newRecord: TransactionRecord = {
          hash,
          type,
          timestamp: Date.now(),
          status: 'PENDING',
          explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
        };
        set((state) => ({
          transactions: [newRecord, ...state.transactions],
        }));
      },
      updateTransactionStatus: (hash, status, error) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, status, error } : tx
          ),
        }));
      },
      clearHistory: () => set({ transactions: [] }),
    }),
    {
      name: 'stellar-reputation-tx-history',
    }
  )
);
