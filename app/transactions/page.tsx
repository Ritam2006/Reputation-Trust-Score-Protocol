'use client';

import { useTransactions } from '@/hooks/useTransactions';
import { formatAddress } from '@/lib/stellar';
import { ExternalLink, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TransactionsPage() {
  const { transactions, clearHistory } = useTransactions();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-amber-950/20 text-amber-400 border border-amber-900/30 animate-pulse">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-900/30">
            <CheckCircle2 className="h-3 w-3" />
            Success
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-rose-950/20 text-rose-400 border border-rose-900/30">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Recent Transactions</h1>
          <p className="text-slate-400 text-sm">
            Track recent interactions and deployments on Stellar Testnet.
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg text-sm border border-slate-800 hover:border-rose-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-full">
            <FileText className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-bold text-slate-300">No transactions recorded</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              When you submit profile updates, ratings, or verification toggles to the contract, they will appear here in real time.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-900 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="divide-y divide-slate-900">
            {transactions.map((tx) => (
              <div key={tx.hash} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/10 transition-colors animate-slide-in-up">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-200">{tx.type}</span>
                    {getStatusBadge(tx.status)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <span>Hash:</span>
                    <span className="text-slate-400">{formatAddress(tx.hash)}</span>
                  </div>
                  <span className="block text-xs text-slate-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                  {tx.error && (
                    <p className="text-xs text-rose-400 mt-2 flex items-start gap-1 font-medium bg-rose-950/10 p-2 rounded border border-rose-900/20 max-w-xl">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Error: {tx.error}</span>
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center">
                  <Link
                    href={tx.explorerUrl}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-cyan-400 rounded-md border border-slate-800 text-xs font-semibold transition-colors"
                  >
                    <span>View Explorer</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
