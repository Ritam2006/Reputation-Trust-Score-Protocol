'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStellar } from '@/hooks/useStellar';
import { formatAddress } from '@/lib/stellar';
import { Wallet, LogOut, Activity, Award, User, RefreshCw, Layers } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { isConnected, address, balance, isLoading, connectWallet, disconnectWallet, refreshBalance } = useStellar();

  const navItems = [
    { name: 'Overview',    path: '/',            icon: Layers  },
    { name: 'Registry',   path: '/reputation',  icon: Award   },
    { name: 'Dashboard',  path: '/dashboard',   icon: User    },
    { name: 'Activity',   path: '/activity',    icon: Activity},
  ];

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        borderBottom: '1px solid var(--border-bright)',
        background: 'rgba(2,8,2,0.92)',
        backdropFilter: 'blur(8px)',
        fontFamily: 'var(--font-retro)',
      }}
    >
      {/* Top CRT bar */}
      <div style={{ height: 2, background: 'var(--green)', boxShadow: 'var(--glow-green)', opacity: 0.7 }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: 56 }}>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ textDecoration: 'none' }}
          >
            <Award
              style={{ width: 20, height: 20, color: 'var(--green)', filter: 'drop-shadow(0 0 6px var(--green))' }}
              className="animate-float"
            />
            <span
              style={{
                fontFamily: 'var(--font-retro)',
                fontSize: '1.5rem',
                letterSpacing: '0.12em',
                color: 'var(--green)',
                textShadow: '0 0 10px var(--green)',
                textTransform: 'uppercase',
              }}
            >
              TrustNet
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                color: 'var(--fg-muted)',
                alignSelf: 'flex-end',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              v1.0
            </span>
          </Link>

          {/* Nav items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 14px',
                    fontFamily: 'var(--font-retro)',
                    fontSize: '1rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    border: isActive ? '1px solid var(--green)' : '1px solid transparent',
                    color: isActive ? 'var(--green)' : 'var(--fg-dim)',
                    background: isActive ? 'rgba(0,255,65,0.06)' : 'transparent',
                    boxShadow: isActive ? '0 0 8px rgba(0,255,65,0.15)' : 'none',
                    transition: 'all 0.12s',
                    position: 'relative',
                  }}
                >
                  {isActive && (
                    <span style={{ color: 'var(--green)', opacity: 0.7, marginRight: -2 }}>▶</span>
                  )}
                  <Icon style={{ width: 14, height: 14 }} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet area */}
          <div className="flex items-center gap-3">
            {isConnected && address ? (
              <div className="flex items-center gap-3">
                {/* Balance + address */}
                <div
                  className="hidden sm:flex flex-col items-end"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    lineHeight: 1.4,
                  }}
                >
                  <div
                    className="flex items-center gap-1"
                    style={{ color: 'var(--fg-muted)' }}
                  >
                    <span>{balance} XLM</span>
                    <button
                      onClick={refreshBalance}
                      title="Refresh Balance"
                      style={{ cursor: 'pointer', color: 'inherit', background: 'none', border: 'none', padding: 2 }}
                    >
                      <RefreshCw style={{ width: 10, height: 10 }} />
                    </button>
                  </div>
                  <span
                    style={{ color: 'var(--green)', textShadow: '0 0 6px var(--green)' }}
                  >
                    {formatAddress(address)}
                  </span>
                </div>

                {/* Tx history link */}
                <Link
                  href="/transactions"
                  title="Transaction History"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    border: pathname === '/transactions' ? '1px solid var(--green)' : '1px solid var(--border-bright)',
                    color: pathname === '/transactions' ? 'var(--green)' : 'var(--fg-dim)',
                    textDecoration: 'none',
                    transition: 'all 0.12s',
                  }}
                >
                  <RefreshCw style={{ width: 14, height: 14 }} />
                </Link>

                {/* Disconnect */}
                <button
                  onClick={disconnectWallet}
                  className="retro-btn"
                  style={{
                    fontSize: '0.8rem',
                    padding: '4px 10px',
                    borderColor: 'var(--red-dim)',
                    color: 'var(--red)',
                    gap: 4,
                  }}
                >
                  <LogOut style={{ width: 13, height: 13 }} />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="retro-btn-solid"
                style={{ fontSize: '0.9rem' }}
              >
                <Wallet style={{ width: 14, height: 14 }} />
                <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
