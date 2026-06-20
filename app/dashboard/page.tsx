'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStellar } from '@/hooks/useStellar';
import { useTransactions } from '@/hooks/useTransactions';
import { useEvents } from '@/hooks/useEvents';
import { useToast } from '@/hooks/useToast';
import { callReadMethod, executeWriteMethod, scValAddress, scValString } from '@/lib/stellar-contract';
import { formatAddress } from '@/lib/stellar';
import { User, Award, Shield, Settings, Info, RefreshCw, Star, MessageSquare } from 'lucide-react';

interface ProfileData {
  name: string;
  category: string;
  metadata_uri: string;
  reputation_score: number;
  weighted_sum: bigint;
  total_weight: bigint;
  ratings_count: number;
  is_verified: boolean;
}

export default function DashboardPage() {
  const { isConnected, address, balance, network, connectWallet, refreshBalance } = useStellar();
  const { addTransaction, updateTransactionStatus } = useTransactions();
  const { events } = useEvents();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Developer');
  const [metadataUri, setMetadataUri] = useState('');

  // 1. Query Profile from Contract
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery<ProfileData | null>({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) return null;
      try {
        const rawProfile = await callReadMethod<any>('get_profile', [scValAddress(address)]);
        if (!rawProfile) return null;

        // Map raw ScVal fields to typed object
        const mapped: ProfileData = {
          name: rawProfile.name?.toString() || '',
          category: rawProfile.category?.toString() || '',
          metadata_uri: rawProfile.metadata_uri?.toString() || '',
          reputation_score: Number(rawProfile.reputation_score || 0),
          weighted_sum: BigInt(rawProfile.weighted_sum || 0),
          total_weight: BigInt(rawProfile.total_weight || 0),
          ratings_count: Number(rawProfile.ratings_count || 0),
          is_verified: !!rawProfile.is_verified,
        };

        // Sync form fields
        setName(mapped.name);
        setCategory(mapped.category);
        setMetadataUri(mapped.metadata_uri);

        return mapped;
      } catch (e) {
        console.error("Error reading profile:", e);
        return null;
      }
    },
    enabled: !!address,
  });

  // 2. Mutation for Upserting Profile
  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected");
      if (!name.trim()) throw new Error("Profile name is required");

      toast("Building Transaction", "Preparing to submit your profile data...", "info");

      let hash = '';
      try {
        // Build, simulate, sign and submit
        hash = await executeWriteMethod(
          address,
          'upsert_profile',
          [
            scValAddress(address),
            scValString(name),
            scValString(category),
            scValString(metadataUri)
          ]
        );

        // Add to transaction tracker
        addTransaction(hash, 'Update Profile');
        toast("Transaction Pending", "Your profile update has been submitted to the network.", "info");

        // We check confirmation (executeWriteMethod does polling and only resolves on success)
        updateTransactionStatus(hash, 'SUCCESS');
        toast("Profile Updated", "Your reputation profile has been updated on-chain!", "success");

        // Refresh details
        refetchProfile();
        refreshBalance();
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } catch (err: any) {
        console.error("Transaction Error:", err);
        const errMsg = err?.message || String(err);
        
        if (hash) {
          updateTransactionStatus(hash, 'FAILED', errMsg);
        }
        
        toast("Transaction Failed", errMsg, "error");
        throw err;
      }
    }
  });

  // Filter reviews received by this address from events list
  const receivedReviews = events.filter(
    (e) => e.type === 'RATING_SUBMITTED' && e.data.ratee.toLowerCase() === address?.toLowerCase()
  );

  const getReputationLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' };
    if (score >= 60) return { label: 'Good', color: 'text-cyan-400 border-cyan-900/40 bg-cyan-950/20' };
    if (score >= 40) return { label: 'Neutral', color: 'text-amber-400 border-amber-900/40 bg-amber-950/20' };
    return { label: 'Poor', color: 'text-rose-400 border-rose-900/40 bg-rose-950/20' };
  };

  const getStars = (score: number) => {
    // Converts 0-100 rating score to 1-5 star decimal
    const stars = (score / 20).toFixed(1);
    return `${stars} ★`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in-up">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-white">User Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your on-chain reputation profile, view trust scores, and inspect your received feedback.
        </p>
      </div>

      {!isConnected ? (
        // Disconnected State
        <div className="flex flex-col items-center justify-center p-16 bg-slate-900/10 border border-slate-900 rounded-2xl space-y-6 max-w-xl mx-auto">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-full">
            <User className="h-10 w-10 text-slate-500" />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-bold text-white">Wallet Connection Required</h3>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              Connect your Stellar wallet to create your profile and view your trust stats.
            </p>
          </div>
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg shadow-md hover:shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        // Connected State
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Identity & Stats */}
          <div className="space-y-6">
            {/* Account Card */}
            <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-4 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-400" />
                Stellar Account
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Wallet Address</span>
                  <span className="font-mono text-slate-300 break-all select-all">{address}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-xs">Balance</span>
                    <span className="font-semibold text-slate-300">{balance} XLM</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Network</span>
                    <span className="font-semibold text-slate-300">{network}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Card */}
            {profile ? (
              <div className={`bg-slate-900/30 border p-6 rounded-2xl space-y-5 relative overflow-hidden transition-all duration-300 ${
                profile.is_verified ? 'border-cyan-500/25 animate-border-glow shadow-lg' : 'border-slate-800/80'
              }`}>
                
                <div className="flex justify-between items-start relative">
                  <h3 className="text-lg font-bold text-slate-200">Trust Reputation</h3>
                  {profile.is_verified && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                      <Shield className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 relative">
                  <div className="h-20 w-20 rounded-full border-4 border-cyan-500/30 flex items-center justify-center bg-slate-950 relative">
                    <span className="text-2xl font-black text-white">{profile.reputation_score}</span>
                    <span className="text-[10px] text-slate-500 absolute bottom-1.5">%</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getReputationLabel(profile.reputation_score).color}`}>
                        {getReputationLabel(profile.reputation_score).label}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">
                        {getStars(profile.reputation_score)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block">
                      Based on {profile.ratings_count} ratings
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-4 grid grid-cols-2 gap-4 text-xs relative">
                  <div>
                    <span className="text-slate-500 block">Total Rating Weight</span>
                    <span className="font-semibold text-slate-300">{profile.total_weight.toString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Category</span>
                    <span className="font-semibold text-slate-300">{profile.category}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl text-center space-y-3">
                <Info className="h-6 w-6 text-slate-500 mx-auto" />
                <h4 className="font-bold text-slate-300">No profile detected</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You haven&apos;t created an on-chain profile for this address yet. Complete the form to establish your identity.
                </p>
              </div>
            )}
          </div>

          {/* Column 2: Edit Profile */}
          <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-400" />
              Profile Settings
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                upsertMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alice Developer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={upsertMutation.isPending}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={upsertMutation.isPending}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="Developer">Developer</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Merchant">Merchant</option>
                  <option value="Validator">Validator</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Metadata URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. ipfs://..., https://github/..."
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  disabled={upsertMutation.isPending}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Link to external documentation, portfolio, or profile avatar.
                </span>
              </div>

              <button
                type="submit"
                disabled={upsertMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm shadow-md hover:shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {upsertMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Updating Contract...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </form>
          </div>

          {/* Column 3: Received Ratings */}
          <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-6 backdrop-blur-sm lg:col-span-3">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              Received Ratings & Reviews
            </h3>

            {receivedReviews.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/20 border border-slate-800 rounded-xl space-y-2">
                <Star className="h-6 w-6 text-slate-500 mx-auto" />
                <h4 className="font-semibold text-slate-400">No reviews yet</h4>
                <p className="text-xs text-slate-500">
                  Ratings given to you by other addresses will be indexed and shown here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 hover:border-cyan-500/25 hover:scale-[1.02] hover:shadow-md hover:shadow-cyan-950/5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-300">
                          From: {formatAddress(rev.data.rater)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-cyan-950/30 border border-cyan-900/30 px-2 py-0.5 rounded text-xs text-cyan-400 font-bold">
                        <Star className="h-3 w-3 fill-cyan-400 text-cyan-400" />
                        <span>{rev.data.score} Stars</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-300 italic py-1 leading-relaxed">
                      &ldquo;{rev.data.comment || 'No comment provided'}&rdquo;
                    </p>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900/60 pt-2">
                      <span>Rater Weight: {rev.data.weight}</span>
                      <span>{new Date(rev.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
