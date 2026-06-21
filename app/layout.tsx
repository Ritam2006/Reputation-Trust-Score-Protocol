import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "TrustNet | Stellar Reputation & Trust Score Protocol",
  description:
    "A graph-weighted decentralized reputation and trust score registry powered by Stellar Soroban smart contracts.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true} className="antialiased min-h-screen flex flex-col animate-flicker">
        <Providers>
          {/* ── Retro Terminal Background ──────────────────────────── */}
          <div
            className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
            style={{ background: "var(--bg)" }}
          >
            {/* Base dark green gradient */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,20,5,0.9) 0%, #020802 70%)",
              }}
            />

            {/* Phosphor green dot grid */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  radial-gradient(circle, rgba(0,255,65,0.18) 1px, transparent 1px)
                `,
                backgroundSize: "32px 32px",
              }}
            />

            {/* Faint horizontal scan lines baked in */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
              }}
            />

            {/* Glowing green orbs (phosphor bloom) */}
            <div
              style={{
                position: "absolute",
                top: "-10%",
                left: "30%",
                width: 600,
                height: 600,
                borderRadius: "50%",
                background: "rgba(0,255,65,0.04)",
                filter: "blur(100px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "5%",
                right: "20%",
                width: 400,
                height: 400,
                borderRadius: "50%",
                background: "rgba(0,180,40,0.05)",
                filter: "blur(120px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "5%",
                width: 300,
                height: 300,
                borderRadius: "50%",
                background: "rgba(0,255,65,0.03)",
                filter: "blur(80px)",
              }}
            />

            {/* Edge vignette */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)",
              }}
            />
          </div>

          {/* Scanlines overlay (thin repeating lines on top of everything) */}
          <div className="scanlines" />

          {/* CRT Vignette */}
          <div className="crt-vignette" />

          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {children}
          </main>
          <footer
            className="relative z-10 py-5 text-center"
            style={{
              borderTop: "1px solid var(--border-bright)",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              background: "var(--bg-panel)",
            }}
          >
            <div className="max-w-7xl mx-auto px-4">
              <p>
                <span style={{ color: "var(--green)", marginRight: 8 }}>▶</span>
                TRUSTNET PROTOCOL v1.0 &nbsp;|&nbsp; STELLAR TESTNET &nbsp;|&nbsp;{" "}
                {new Date().getFullYear()}
                <span style={{ color: "var(--green)", marginLeft: 8 }}>█</span>
              </p>
            </div>
          </footer>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
