'use client';

import { useToast, ToastMessage } from '@/hooks/useToast';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        return <ToastItem key={toast.id} toast={toast} onClose={removeToast} />;
      })}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-cyan-400 shrink-0" />,
  };

  const themeClasses = {
    success: 'border-emerald-500/30 bg-slate-900/90 shadow-emerald-950/10 text-slate-100',
    error: 'border-rose-500/30 bg-slate-900/90 shadow-rose-950/10 text-slate-100',
    warning: 'border-amber-500/30 bg-slate-900/90 shadow-amber-950/10 text-slate-100',
    info: 'border-cyan-500/30 bg-slate-900/90 shadow-cyan-950/10 text-slate-100',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-2 duration-300 ${themeClasses[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1">
        <h4 className="text-sm font-semibold">{toast.title}</h4>
        {toast.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.description}</p>}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 hover:bg-slate-800 rounded cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
