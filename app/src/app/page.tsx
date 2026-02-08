"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Price data interface
interface PriceData {
  symbol: string;
  icon: string;
  price: string;
  change: number;
}

// Floating particles background
function ParticleField() {
  const [particles, setParticles] = useState<Array<{left: string, top: string, delay: string, duration: string}>>([]);
  
  useEffect(() => {
    setParticles(
      [...Array(30)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${5 + Math.random() * 10}s`,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-purple-500/30 rounded-full animate-float"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

// Glowing orb component
function GlowingOrb({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 ${className}`} />
  );
}

// Terminal-style code block
function TerminalBlock({ children, title = "terminal" }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="bg-black/80 rounded-xl border border-white/10 overflow-hidden backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-gray-500 font-mono ml-2">{title}</span>
      </div>
      <div className="p-4 font-mono text-sm text-green-400 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

// Price Ticker Component
function PriceTicker({ prices }: { prices: PriceData[] }) {
  return (
    <div className="bg-black/50 border-b border-white/5 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {[...prices, ...prices].map((p, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-6 text-sm">
            <span className="text-lg">{p.icon}</span>
            <span className="text-gray-400">{p.symbol}</span>
            <span className="text-white font-medium">{p.price}</span>
            <span className={p.change >= 0 ? "text-green-400" : "text-red-400"}>
              {p.change >= 0 ? "↑" : "↓"} {Math.abs(p.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [prices, setPrices] = useState<PriceData[]>([
    { symbol: "SOL", icon: "◎", price: "$0", change: 0 },
    { symbol: "BTC", icon: "₿", price: "$0", change: 0 },
    { symbol: "ETH", icon: "Ξ", price: "$0", change: 0 },
  ]);

  useEffect(() => {
    setMounted(true);
    
    // Fetch real prices from CoinGecko
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
        );
        const data = await res.json();
        setPrices([
          { 
            symbol: "SOL", 
            icon: "◎", 
            price: `$${data.solana?.usd?.toFixed(2) || '0'}`, 
            change: data.solana?.usd_24h_change || 0 
          },
          { 
            symbol: "BTC", 
            icon: "₿", 
            price: `$${data.bitcoin?.usd?.toLocaleString() || '0'}`, 
            change: data.bitcoin?.usd_24h_change || 0 
          },
          { 
            symbol: "ETH", 
            icon: "Ξ", 
            price: `$${data.ethereum?.usd?.toLocaleString() || '0'}`, 
            change: data.ethereum?.usd_24h_change || 0 
          },
        ]);
      } catch (e) {
        console.log("Price fetch failed");
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: "⚡", title: "Milestone Escrow", desc: "Up to 10 milestones per PDA", color: "from-yellow-500 to-orange-500" },
    { icon: "🧠", title: "AI Arbitration", desc: "Claude-powered dispute resolution", color: "from-purple-500 to-pink-500" },
    { icon: "🔮", title: "Risk Oracle", desc: "Varuna DeFi risk assessment", color: "from-blue-500 to-cyan-500" },
    { icon: "🔐", title: "Multi-sig", desc: "Require N-of-M approvals", color: "from-green-500 to-emerald-500" },
    { icon: "💎", title: "Multi-Token", desc: "SOL, USDC, any SPL token", color: "from-indigo-500 to-purple-500" },
    { icon: "📜", title: "On-chain Proof", desc: "SOLPRISM verifiable reasoning", color: "from-pink-500 to-rose-500" },
  ];

  const techStack = [
    { name: "Solana", desc: "Sub-second finality" },
    { name: "Anchor", desc: "Secure PDAs" },
    { name: "Claude AI", desc: "Intelligent arbitration" },
    { name: "TypeScript", desc: "Type-safe SDK" },
  ];

  return (
    <main className="min-h-screen bg-[#030014] text-white overflow-hidden">
      {/* Price Ticker */}
      {mounted && <PriceTicker prices={prices} />}

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        <GlowingOrb className="w-96 h-96 bg-purple-600 -top-48 -left-48" />
        <GlowingOrb className="w-96 h-96 bg-blue-600 -bottom-48 -right-48" />
        <GlowingOrb className="w-64 h-64 bg-cyan-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        {mounted && <ParticleField />}
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-xl">🛡️</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 blur-lg opacity-50" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                PayGuard
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="https://github.com/Rafacrypto61/payguard" 
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition font-mono text-sm"
            >
              {'</>'}
            </Link>
            <Link 
              href="/app" 
              className="relative group px-5 py-2.5 rounded-xl font-semibold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-all group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-xl opacity-50 group-hover:opacity-75 transition" />
              <span className="relative">Launch App →</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-32">
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-gray-300">Solana AI Hackathon 2026</span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="block text-white">Trustless Escrow</span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              for AI Agents
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Milestone-based payments with AI-powered dispute resolution.
            <br />
            <span className="text-white">No trust required. Just code.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link 
              href="/app" 
              className="group relative px-8 py-4 rounded-xl font-semibold text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-x" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-2xl opacity-50" />
              <span className="relative flex items-center gap-2">
                <span>Start Building</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>
            <Link 
              href="https://github.com/Rafacrypto61/payguard"
              className="px-8 py-4 rounded-xl font-semibold text-lg bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur-sm"
            >
              View on GitHub
            </Link>
          </div>

          {/* Stats - HONEST VERSION */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Beta
              </div>
              <div className="text-sm text-gray-500">Status</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Devnet
              </div>
              <div className="text-sm text-gray-500">Network</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                0.5%
              </div>
              <div className="text-sm text-gray-500">Fee</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                v1.0
              </div>
              <div className="text-sm text-gray-500">Version</div>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Demo Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-gray-500">{'// '}</span>
              Dead Simple API
            </h2>
            <p className="text-gray-400 mb-6">
              Create escrows, manage milestones, and resolve disputes with a few lines of code.
              Our SDK handles all the complexity.
            </p>
            <div className="space-y-3">
              {techStack.map((tech, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" />
                  <span className="text-white font-medium">{tech.name}</span>
                  <span className="text-gray-600">—</span>
                  <span className="text-gray-500">{tech.desc}</span>
                </div>
              ))}
            </div>
          </div>
          
          <TerminalBlock title="~/payguard">
            <div className="space-y-2">
              <div><span className="text-gray-500">$</span> npm install @payguard/sdk</div>
              <div className="text-gray-600 text-xs">+ @payguard/sdk@1.0.0</div>
              <div className="mt-4 text-purple-400">// Create escrow in 3 lines</div>
              <div><span className="text-pink-400">const</span> escrow = <span className="text-pink-400">await</span> payguard.<span className="text-cyan-400">createEscrow</span>{'({'}</div>
              <div className="pl-4">freelancer: <span className="text-yellow-400">&quot;DxG4...8kPq&quot;</span>,</div>
              <div className="pl-4">amount: <span className="text-orange-400">1_000_000_000</span>, <span className="text-gray-600">// 1 SOL</span></div>
              <div className="pl-4">milestones: [<span className="text-orange-400">3</span>]</div>
              <div>{'});'}</div>
              <div className="mt-2 text-gray-600">// TX: 4xG7kL...mNpQ ✓</div>
            </div>
          </TerminalBlock>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Built for the Future</h2>
          <p className="text-gray-500">Everything AI agents need for secure payments</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div 
              key={i} 
              className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${f.color}`} />
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Create", desc: "Client creates escrow with milestones", icon: "📝" },
            { step: "02", title: "Fund", desc: "Lock funds in Solana PDA", icon: "🔐" },
            { step: "03", title: "Deliver", desc: "Freelancer completes milestones", icon: "✅" },
            { step: "04", title: "Release", desc: "Approve or AI arbitrates", icon: "💸" },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="text-center">
                <div className="text-6xl mb-4">{item.icon}</div>
                <div className="text-xs text-purple-400 font-mono mb-2">{item.step}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden md:block absolute top-1/4 right-0 translate-x-1/2 text-gray-600">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="relative p-12 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />
          
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Test on Solana Devnet. Connect your Phantom wallet and create your first escrow.
            </p>
            <Link 
              href="/app" 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg bg-white text-black hover:bg-gray-100 transition"
            >
              <span>Launch App</span>
              <span>🚀</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>🛡️</span>
            <span>PayGuard</span>
            <span className="text-gray-800">|</span>
            <span>Solana AI Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="https://x.com/rafacrypto61" className="hover:text-white transition">Twitter</Link>
            <Link href="https://github.com/Rafacrypto61/payguard" className="hover:text-white transition">GitHub</Link>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </main>
  );
}
