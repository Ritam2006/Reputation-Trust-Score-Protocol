'use client';

import Link from 'next/link';
import { useStellar } from '@/hooks/useStellar';
import { Award, Shield, Users, Activity, ChevronRight, Zap, Code, BarChart2 } from 'lucide-react';

const S = {
  panel: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-bright)',
    outline: '1px solid var(--border)',
    outlineOffset: -3,
    padding: '1.5rem',
    position: 'relative' as const,
  },
  sectionBorder: {
    borderTop: '1px solid var(--border-bright)',
    borderBottom: '1px solid var(--border-bright)',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'var(--fg-muted)',
  },
};

export default function Home() {
  const { isConnected, connectWallet } = useStellar();

  const stats = [
    { name: 'Profiles Registered', value: '142',   icon: Users,    color: 'var(--green)' },
    { name: 'On-chain Ratings',    value: '487',   icon: Award,    color: 'var(--amber)' },
    { name: 'Avg Trust Score',     value: '84.6%', icon: Shield,   color: 'var(--green)' },
    { name: 'Events Indexed',      value: '1,290', icon: Activity, color: 'var(--amber)' },
  ];

  const features = [
    {
      title: 'Graph-Weighted Influence',
      description: "Review weight is based on the rater's own reputation score. A rating from a highly trusted entity carries more influence, establishing a resilient Web-of-Trust.",
      icon: Users,
      tag: 'ALGO.01',
    },
    {
      title: 'Admin-Verified Certifiers',
      description: 'Protocol administrators can grant verified status to expert auditors or certifiers, applying a 3× weight multiplier to their review scores.',
      icon: Shield,
      tag: 'ALGO.02',
    },
    {
      title: 'On-Chain Event Streaming',
      description: 'Every profile creation, verification, and rating emits a native Soroban event. The app indexes these directly from the Stellar Testnet ledger.',
      icon: Zap,
      tag: 'ALGO.03',
    },
    {
      title: 'O(1) On-Chain Computation',
      description: 'Reputation calculations are stored cumulatively, allowing constant-time lookups and keeping contract invocations within safe Soroban resource limits.',
      icon: Code,
      tag: 'ALGO.04',
    },
  ];

  return (
    <div className="space-y-12 animate-fade-in-up">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16" style={{ borderBottom: '1px solid var(--border-bright)' }}>
        {/* System boot header */}
        <div
          className="mb-8"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--fg-muted)', letterSpacing: '0.1em' }}
        >
          <p>TRUSTNET OS v1.0.0 — STELLAR TESTNET</p>
          <p>SOROBAN RUNTIME: READY &nbsp;|&nbsp; CONTRACT: INITIALIZED</p>
          <p style={{ color: 'var(--green)' }}>{'>'} SYSTEM ONLINE ▋</p>
        </div>

        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2"
            style={{
              border: '1px solid var(--green-dark)',
              padding: '3px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--green)',
              background: 'rgba(0,255,65,0.04)',
            }}
          >
            <span
              className="animate-retro-pulse"
              style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px var(--green)' }}
            />
            Live · Stellar Testnet
          </div>

          <h1
            className="glow-green cursor-blink"
            style={{
              fontFamily: 'var(--font-retro)',
              fontSize: 'clamp(2rem, 6vw, 3.8rem)',
              lineHeight: 1.1,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--green)',
            }}
          >
            Decentralized Trust &amp;<br />Reputation Protocol
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              color: 'var(--fg-dim)',
              lineHeight: 1.7,
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            Establish trust on Stellar. Query, rate, and verify profiles using a
            Soroban-powered, graph-weighted reputation scoring network.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {isConnected ? (
              <Link href="/reputation" className="retro-btn-solid" style={{ fontSize: '1rem', padding: '8px 24px' }}>
                Browse Registry <ChevronRight style={{ width: 16, height: 16 }} />
              </Link>
            ) : (
              <button onClick={connectWallet} className="retro-btn-solid" style={{ fontSize: '1rem', padding: '8px 24px' }}>
                Initialize Connection <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            )}
            <Link href="/activity" className="retro-btn" style={{ fontSize: '1rem', padding: '8px 20px' }}>
              View Activity Log
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="retro-panel animate-fade-in-up"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              {/* Corner label */}
              <div style={{ ...S.label, marginBottom: '0.75rem' }}>{stat.name}</div>

              <div className="flex items-end justify-between">
                <span
                  className="glow-green"
                  style={{
                    fontFamily: 'var(--font-retro)',
                    fontSize: '2.4rem',
                    lineHeight: 1,
                    color: stat.color,
                    textShadow: `0 0 12px ${stat.color}`,
                  }}
                >
                  {stat.value}
                </span>
                <Icon
                  className="animate-float"
                  style={{ width: 20, height: 20, color: stat.color, filter: `drop-shadow(0 0 4px ${stat.color})` }}
                />
              </div>

              {/* Retro progress bar */}
              <div style={{ marginTop: '0.75rem', height: 2, background: 'var(--border)' }}>
                <div
                  style={{
                    height: '100%',
                    width: '70%',
                    background: stat.color,
                    boxShadow: `0 0 6px ${stat.color}`,
                    transition: 'width 1s',
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="py-10" style={S.sectionBorder}>
        {/* Section header */}
        <div className="text-center mb-10 space-y-2">
          <p style={{ ...S.label }}>{'// SYSTEM MODULES'}</p>
          <h2
            style={{
              fontFamily: 'var(--font-retro)',
              fontSize: '2rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--fg)',
              textShadow: '0 0 6px rgba(192,240,192,0.3)',
            }}
          >
            How TrustNet Works
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--fg-muted)', maxWidth: 500, margin: '0 auto' }}>
            Cumulative graph-weighted scoring. All computation is O(1) on-chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="retro-panel animate-slide-in-up"
                style={{
                  animationDelay: `${idx * 0.08}s`,
                  display: 'flex',
                  gap: '1rem',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 16px rgba(0,255,65,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {/* Icon block */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    border: '1px solid var(--border-bright)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'var(--bg)',
                  }}
                >
                  <Icon style={{ width: 18, height: 18, color: 'var(--green)' }} />
                </div>

                <div>
                  <div style={{ ...S.label, marginBottom: '0.25rem' }}>
                    [{feature.tag}]
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-retro)',
                      fontSize: '1.15rem',
                      letterSpacing: '0.06em',
                      color: 'var(--fg)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      color: 'var(--fg-dim)',
                      lineHeight: 1.65,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section
        className="retro-panel animate-border-glow"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}
      >
        {/* Terminal prompt feel */}
        <div style={{ maxWidth: 520 }}>
          <p style={{ ...S.label, marginBottom: '0.5rem' }}>{'>'} NEXT ACTION</p>
          <h2
            style={{
              fontFamily: 'var(--font-retro)',
              fontSize: '1.6rem',
              letterSpacing: '0.06em',
              color: 'var(--green)',
              textShadow: '0 0 8px rgba(0,255,65,0.3)',
              marginBottom: '0.5rem',
            }}
          >
            Initialize Your On-Chain Profile
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--fg-dim)', lineHeight: 1.65 }}>
            Create your decentralized identity, set your category (Developer · Auditor · Merchant), and start receiving verifiable on-chain reviews.
          </p>
        </div>

        <Link href="/dashboard" className="retro-btn-solid" style={{ fontSize: '1rem', padding: '10px 28px', flexShrink: 0 }}>
          Launch Dashboard <ChevronRight style={{ width: 16, height: 16 }} />
        </Link>
      </section>
    </div>
  );
}
