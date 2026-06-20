'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStellar } from '@/hooks/useStellar';
import { useTransactions } from '@/hooks/useTransactions';
import { useEvents } from '@/hooks/useEvents';
import { useToast } from '@/hooks/useToast';
import { callReadMethod, executeWriteMethod, scValAddress, scValString, scValU32, scValBool } from '@/lib/stellar-contract';
import { formatAddress } from '@/lib/stellar';
import { Search, Star, Shield, ShieldCheck, ShieldAlert, Award, User, MessageSquare, Plus, RefreshCw, X, Check } from 'lucide-react';

interface RegistryProfile {
  address: string;
  name: string;
  category: string;
  metadataUri: string;
  reputationScore: number;
  isVerified: boolean;
  ratingsCount: number;
}

export default function ReputationPage() {
  const { isConnected, address, refreshBalance } = useStellar();
  const { addTransaction, updateTransactionStatus } = useTransactions();
  const { events } = useEvents();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal / Form State
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateTarget, setRateTarget] = useState('');
  const [rateTargetError, setRateTargetError] = useState('');
  const [isAddressPreFilled, setIsAddressPreFilled] = useState(false);
  const [rateScore, setRateScore] = useState(5);
  const [rateComment, setRateComment] = useState('');

  const validateStellarAddress = (addr: string): string => {
    const trimmed = addr.trim();
    if (!trimmed) return 'Address is required.';
    if (!trimmed.startsWith('G')) return 'Stellar addresses must start with "G".';
    if (trimmed.length !== 56) return `Address must be 56 characters (currently ${trimmed.length}).`;
    return '';
  };

  // 1. Query Contract Admin
  const { data: adminAddress } = useQuery<string | null>({
    queryKey: ['contractAdmin'],
    queryFn: async () => {
      try {
        const rawAdmin = await callReadMethod<any>('get_admin');
        return rawAdmin ? rawAdmin.toString() : null;
      } catch (e) {
        console.error("Error reading admin:", e);
        return null;
      }
    }
  });

  const isAdmin = address && adminAddress && address.toLowerCase() === adminAddress.toLowerCase();

  // 2. Build Directory of Profiles from Ledger Events + Query Current Scores
  const { data: profiles = [], isLoading: isProfilesLoading, refetch: refetchProfiles } = useQuery<RegistryProfile[]>({
    queryKey: ['registryProfiles', events.length],
    queryFn: async () => {
      // Find all unique addresses that initialized profiles
      const profileEvents = events.filter((e) => e.type === 'PROFILE_UPDATED');
      const uniqueAddresses = Array.from(new Set(profileEvents.map((e) => e.data.user)));

      if (uniqueAddresses.length === 0) return [];

      // Query contract for each address in parallel
      const profileQueries = uniqueAddresses.map(async (userAddr) => {
        try {
          const rawProfile = await callReadMethod<any>('get_profile', [scValAddress(userAddr)]);
          if (!rawProfile) return null;

          return {
            address: userAddr,
            name: rawProfile.name?.toString() || 'Anonymous',
            category: rawProfile.category?.toString() || 'General',
            metadataUri: rawProfile.metadata_uri?.toString() || '',
            reputationScore: Number(rawProfile.reputation_score || 50),
            isVerified: !!rawProfile.is_verified,
            ratingsCount: Number(rawProfile.ratings_count || 0),
          };
        } catch (e) {
          console.error(`Error querying profile for ${userAddr}:`, e);
          return null;
        }
      });

      const resolved = await Promise.all(profileQueries);
      return resolved.filter((p): p is RegistryProfile => p !== null);
    },
    enabled: events.length > 0,
  });

  // 3. Rate User Mutation
  const rateMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected");
      if (!rateTarget) throw new Error("Rate target is required");
      if (address.toLowerCase() === rateTarget.toLowerCase()) {
        throw new Error("Self rating is forbidden");
      }

      toast("Preparing Review", "Simulating transaction on-chain...", "info");

      let hash = '';
      try {
        hash = await executeWriteMethod(
          address,
          'rate_user',
          [
            scValAddress(address),
            scValAddress(rateTarget),
            scValU32(rateScore),
            scValString(rateComment)
          ]
        );

        addTransaction(hash, `Rate User (${rateScore}★)`);
        toast("Transaction Pending", "Your review submission is broadcasting...", "info");

        // Wait for RPC confirmation
        updateTransactionStatus(hash, 'SUCCESS');
        toast("Review Submitted", "Your rating and feedback have been logged on-chain!", "success");

        // Cleanup & Refresh
        setIsRateModalOpen(false);
        setRateComment('');
        setRateTarget('');
        setRateTargetError('');
        setIsAddressPreFilled(false);
        refetchProfiles();
        refreshBalance();
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } catch (err: any) {
        console.error("Mutation failed:", err);
        const errMsg = err?.message || String(err);
        
        if (hash) {
          updateTransactionStatus(hash, 'FAILED', errMsg);
        }
        
        toast("Rating Failed", errMsg, "error");
        throw err;
      }
    }
  });

  // 4. Verify User Mutation (Admin Only)
  const verifyMutation = useMutation({
    mutationFn: async ({ targetUser, verifyStatus }: { targetUser: string; verifyStatus: boolean }) => {
      if (!address || !isAdmin) throw new Error("Only administrator can execute this action");

      toast("Updating Verification", "Simulating admin transaction...", "info");

      let hash = '';
      try {
        hash = await executeWriteMethod(
          address,
          'verify_user',
          [
            scValAddress(targetUser),
            scValBool(verifyStatus)
          ]
        );

        addTransaction(hash, `${verifyStatus ? 'Verify' : 'Unverify'} User`);
        toast("Transaction Pending", "Broadcasting verification change...", "info");

        updateTransactionStatus(hash, 'SUCCESS');
        toast("Verification Updated", `Address status updated to ${verifyStatus ? 'Verified' : 'Unverified'}!`, "success");

        refetchProfiles();
        refreshBalance();
      } catch (err: any) {
        console.error("Verification failed:", err);
        const errMsg = err?.message || String(err);
        
        if (hash) {
          updateTransactionStatus(hash, 'FAILED', errMsg);
        }
        
        toast("Action Failed", errMsg, "error");
        throw err;
      }
    }
  });

  const getReputationLabelColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20';
    if (score >= 60) return 'text-cyan-400 border-cyan-900/40 bg-cyan-950/20';
    if (score >= 40) return 'text-amber-400 border-amber-900/40 bg-amber-950/20';
    return 'text-rose-400 border-rose-900/40 bg-rose-950/20';
  };

  // Filter profiles based on search query and category selector
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title */}
      <div className="border-b border-slate-900 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Reputation Registry</h1>
          <p className="text-slate-400 text-sm">
            Search, rate, and verify on-chain identities and entities.
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => {
              setRateTarget('');
              setIsAddressPreFilled(false);
              setRateComment('');
              setRateScore(5);
              setIsRateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm shadow-md hover:shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Submit a Rating</span>
          </button>
        )}
      </div>

      {/* Search & Filtering Control */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or Stellar address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900/40 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
        >
          <option value="All">All Categories</option>
          <option value="Developer">Developer</option>
          <option value="Auditor">Auditor</option>
          <option value="Merchant">Merchant</option>
          <option value="Validator">Validator</option>
          <option value="Service Provider">Service Provider</option>
          <option value="General">General</option>
        </select>
      </div>

      {/* Directory Grid */}
      {isProfilesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/10 border border-slate-900/50 animate-pulse" />
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-full">
            <Search className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-bold text-slate-300">No profiles found</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              No registered profiles matched your filters. Be the first to create a profile in the Dashboard!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProfiles.map((p) => {
            return (
              <div
                key={p.address}
                className={`bg-slate-900/20 border p-6 rounded-2xl flex flex-col justify-between gap-6 transition-all duration-300 backdrop-blur-sm relative overflow-hidden hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-950/10 ${
                  p.isVerified ? 'border-cyan-500/25 animate-border-glow' : 'border-slate-900 hover:border-slate-800'
                }`}
              >
                {/* Profile detail */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-bold text-white tracking-tight">{p.name}</h3>
                        {p.isVerified && (
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block">Category: {p.category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-extrabold text-white">{p.reputationScore}%</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${getReputationLabelColor(p.reputationScore)}`}>
                          {(p.reputationScore / 20).toFixed(1)} ★
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider">Address</span>
                    <span className="font-mono text-xs text-slate-400 break-all select-all">{p.address}</span>
                  </div>

                  {p.metadataUri && (
                    <div className="text-xs">
                      <span className="text-slate-500 font-medium">Link: </span>
                      <a
                        href={p.metadataUri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline break-all"
                      >
                        {p.metadataUri}
                      </a>
                    </div>
                  )}
                </div>

                {/* Rating button & Admin actions */}
                <div className="border-t border-slate-900/60 pt-4 flex flex-wrap gap-3 items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {p.ratingsCount} ratings received
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Admin verify toggle */}
                    {isAdmin && (
                      <button
                        onClick={() =>
                          verifyMutation.mutate({ targetUser: p.address, verifyStatus: !p.isVerified })
                        }
                        disabled={verifyMutation.isPending}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          p.isVerified
                            ? 'bg-rose-950/20 text-rose-400 border-rose-900/30 hover:bg-rose-950/40'
                            : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/40'
                        }`}
                      >
                        {verifyMutation.isPending ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : p.isVerified ? (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Unverify</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-3.5 w-3.5" />
                            <span>Verify</span>
                          </>
                        )}
                      </button>
                    )}

                    {isConnected && address && address.toLowerCase() !== p.address.toLowerCase() && (
                      <button
                        onClick={() => {
                          setRateTarget(p.address);
                          setIsAddressPreFilled(true);
                          setRateScore(5);
                          setRateComment('');
                          setIsRateModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Star className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
                        <span>Rate User</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Form */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Rate Address</h3>
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1 rounded transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const err = validateStellarAddress(rateTarget);
                if (err) {
                  setRateTargetError(err);
                  return;
                }
                rateMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Target Stellar Address
                  {isAddressPreFilled && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-cyan-950/40 text-cyan-400 border border-cyan-900/30 rounded">
                      Pre-filled
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter a full Stellar address (G...)"
                    value={rateTarget}
                    onChange={(e) => {
                      setRateTarget(e.target.value);
                      setIsAddressPreFilled(false);
                      if (rateTargetError) setRateTargetError('');
                    }}
                    onBlur={(e) => {
                      if (!isAddressPreFilled && e.target.value) {
                        setRateTargetError(validateStellarAddress(e.target.value));
                      }
                    }}
                    disabled={isAddressPreFilled}
                    className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      rateTargetError
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20'
                    }`}
                    required
                  />
                  {isAddressPreFilled && (
                    <button
                      type="button"
                      onClick={() => {
                        setRateTarget('');
                        setIsAddressPreFilled(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Clear pre-filled address"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {rateTargetError && (
                  <p className="mt-1.5 text-[11px] font-medium text-rose-400 flex items-center gap-1">
                    <span>⚠</span>
                    <span>{rateTargetError}</span>
                  </p>
                )}
                {!rateTargetError && (
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    Enter the full public Stellar address (56 characters, starts with G).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Rating Score
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const isSelected = s <= rateScore;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRateScore(s)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            isSelected ? 'fill-cyan-400 text-cyan-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Review Description / Feedback
                </label>
                <textarea
                  placeholder="Write a brief comment about this address..."
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 h-24 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={rateMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm shadow-md hover:shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {rateMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Signing Transaction...</span>
                  </>
                ) : (
                  <span>Submit On-Chain Review</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
