'use client';

import { useEffect } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { formatAddress } from '@/lib/stellar';
import { Activity, User, Award, Shield, ShieldCheck, RefreshCw, HelpCircle } from 'lucide-react';

export default function ActivityFeedPage() {
  const contractId = process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_ID || '';
  const { events, isFetching, error, fetchEvents } = useEvents();

  useEffect(() => {
    if (!contractId) return;

    // Initial fetch
    fetchEvents(contractId);

    // Setup polling interval every 5 seconds
    const interval = setInterval(() => {
      fetchEvents(contractId);
    }, 5000);

    return () => clearInterval(interval);
  }, [contractId, fetchEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PROFILE_UPDATED':
        return (
          <div className="p-2 bg-blue-950/40 text-blue-400 border border-blue-900/30 rounded-lg shrink-0">
            <User className="h-5 w-5" />
          </div>
        );
      case 'RATING_SUBMITTED':
        return (
          <div className="p-2 bg-cyan-950/40 text-cyan-400 border border-cyan-900/30 rounded-lg shrink-0">
            <Award className="h-5 w-5" />
          </div>
        );
      case 'USER_VERIFIED':
        return (
          <div className="p-2 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 rounded-lg shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-slate-900 text-slate-400 border border-slate-800 rounded-lg shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
        );
    }
  };

  const formatEventMessage = (event: any) => {
    const { type, data } = event;
    switch (type) {
      case 'PROFILE_UPDATED':
        return (
          <div className="space-y-1">
            <p className="text-sm text-slate-300">
              Address <span className="font-mono font-semibold text-white">{formatAddress(data.user)}</span> initialized/updated their profile.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-2">
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Name: {data.name}</span>
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Category: {data.category}</span>
              {data.metadataUri && (
                <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 overflow-hidden text-ellipsis max-w-xs whitespace-nowrap">
                  URI: {data.metadataUri}
                </span>
              )}
            </div>
          </div>
        );
      case 'RATING_SUBMITTED':
        return (
          <div className="space-y-1">
            <p className="text-sm text-slate-300">
              Rater <span className="font-mono font-semibold text-white">{formatAddress(data.rater)}</span> submitted a{' '}
              <span className="text-cyan-400 font-bold">{data.score} / 5 Star</span> rating for{' '}
              <span className="font-mono font-semibold text-white">{formatAddress(data.ratee)}</span>.
            </p>
            <p className="text-xs text-slate-400 mt-1 italic bg-slate-950 p-2.5 rounded border border-slate-900/60 leading-relaxed max-w-xl">
              &ldquo;{data.comment || 'No comment provided'}&rdquo;
            </p>
            <div className="flex gap-2 text-xs text-slate-500 mt-2">
              <span>Applied Weight: <span className="text-indigo-400 font-semibold">{data.weight}</span></span>
            </div>
          </div>
        );
      case 'USER_VERIFIED':
        return (
          <div className="space-y-1">
            <p className="text-sm text-slate-300">
              Admin verified status for <span className="font-mono font-semibold text-white">{formatAddress(data.user)}</span> has been updated to{' '}
              <span className={`font-semibold ${data.verified ? 'text-emerald-400' : 'text-slate-400'}`}>
                {data.verified ? 'Verified' : 'Unverified'}
              </span>.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {data.verified 
                ? 'This user now has a 3x weight multiplier on any ratings they submit.' 
                : 'This user has returned to base rating weight.'}
            </p>
          </div>
        );
      default:
        return <p className="text-sm text-slate-400">Unknown contract event received.</p>;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Activity Feed</h1>
            {isFetching && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950/20 text-cyan-400 border border-cyan-900/20 animate-pulse">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                Syncing
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">
            Real-time feed of protocol operations directly from the Stellar Testnet ledger.
          </p>
        </div>
      </div>

      {!contractId && (
        <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-400 text-sm flex gap-3">
          <Shield className="h-5 w-5 shrink-0" />
          <div>
            <h5 className="font-semibold">Contract Not Deployed</h5>
            <p className="text-xs text-amber-500/80 mt-1">
              Please deploy the smart contract using the deployment script to enable real-time event tracking.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-400 text-sm">
          Error syncing events: {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-full animate-pulse">
            <Activity className="h-8 w-8 text-cyan-500" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-bold text-slate-300">Listening for events</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              No events found in the recent ledger sequences. Events will populate here automatically as reviews are posted and profiles are updated.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative border-l border-slate-900 ml-4 space-y-8 py-2">
          {events.map((event) => (
            <div key={event.id} className="relative pl-8 group animate-slide-in-up">
              {/* Event node */}
              <div className="absolute -left-[17px] top-1">
                {getEventIcon(event.type)}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Ledger {event.ledger} • {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl backdrop-blur-sm group-hover:border-slate-800/80 transition-colors">
                  {formatEventMessage(event)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
