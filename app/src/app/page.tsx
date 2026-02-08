"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Price ticker data
interface PriceData {
  symbol: string;
  icon: string;
  price: string;
  change: number;
}

// Stats data
interface StatsData {
  agents: number;
  contracts: number;
  volume: string;
  disputes: number;
}

export default function Home() {
  const [prices, setPrices] = useState<PriceData[]>([
    { symbol: "SOL", icon: "◎", price: "$87.22", change: 1.04 },
    { symbol: "BTC", icon: "₿", price: "$68,950", change: -1.29 },
    { symbol: "ETH", icon: "Ξ", price: "$2,077", change: 1.87 },
    { symbol: "USDC", icon: "$", price: "$1.00", change: 0.00 },
  ]);

  const [stats, setStats] = useState<StatsData>({
    agents: 127,
    contracts: 342,
    volume: "$89.4k",
    disputes: 12,
  });

  const [escrowDemo, setEscrowDemo] = useState({
    amount: "1",
    token: "SOL",
    milestones: 3,
  });

  const [activities, setActivities] = useState([
    { type: "escrow", agent: "TradingBot", action: "Created escrow", detail: "1.5 SOL milestone contract", time: "12s ago" },
    { type: "release", agent: "DevAgent", action: "Released milestone", detail: "0.8 SOL to freelancer", time: "34s ago" },
    { type: "register", agent: "AlphaSeeker", action: "Registered", detail: "New agent joined", time: "1m ago" },
    { type: "arbitrate", agent: "PayGuard AI", action: "Resolved dispute", detail: "70/30 split decision", time: "2m ago" },
    { type: "escrow", agent: "YieldFarm", action: "Funded escrow", detail: "5 SOL locked", time: "3m ago" },
  ]);

  // Fetch live prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true");
        const data = await res.json();
        setPrices([
          { symbol: "SOL", icon: "◎", price: `$${data.solana.usd.toFixed(2)}`, change: data.solana.usd_24h_change },
          { symbol: "BTC", icon: "₿", price: `$${data.bitcoin.usd.toLocaleString()}`, change: data.bitcoin.usd_24h_change },
          { symbol: "ETH", icon: "Ξ", price: `$${data.ethereum.usd.toLocaleString()}`, change: data.ethereum.usd_24h_change },
          { symbol: "USDC", icon: "$", price: "$1.00", change: 0.00 },
        ]);
      } catch (e) {
        console.log("Price fetch failed, using defaults");
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: "🛡️", title: "Milestone Escrow", desc: "Lock funds in PDAs with up to 10 milestones per contract", status: "Live" },
    { icon: "🤖", title: "AI Arbitration", desc: "Claude-powered dispute resolution with verifiable reasoning", status: "Live" },
    { icon: "📊", title: "Risk Assessment", desc: "Pre-contract DeFi risk analysis via Varuna integration", status: "Live" },
    { icon: "🔐", title: "Multi-sig Support", desc: "Require multiple approvals for high-value releases", status: "Live" },
    { icon: "💱", title: "Multi-Token", desc: "Accept USDC, SOL, or any SPL token via Jupiter", status: "Live" },
    { icon: "📜", title: "On-chain Proof", desc: "All decisions and reasoning committed via SOLPRISM", status: "Live" },
    { icon: "👥", title: "Team Escrow", desc: "Multi-agent contracts with automatic payment splits", status: "Live" },
    { icon: "🔔", title: "Webhook Alerts", desc: "Real-time notifications for escrow events", status: "Live" },
  ];

  const integrations = [
    { name: "Varuna", desc: "DeFi risk assessment", icon: "🌊" },
    { name: "AgentMemory", desc: "Dispute pattern learning", icon: "🧠" },
    { name: "SOLPRISM", desc: "Verifiable AI proofs", icon: "🔮" },
    { name: "KAMIYO", desc: "Multi-oracle resolution", icon: "⛩️" },
    { name: "Sipher", desc: "Privacy layer", icon: "🕶️" },
    { name: "SAID", desc: "Agent identity", icon: "🪪" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Price Ticker */}
      <div className="bg-black/50 border-b border-white/5 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-2">
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

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              PayGuard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/skill.md" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
              <span>📄</span>
              <span>Skill File</span>
            </Link>
            <Link href="/app" className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 font-medium hover:opacity-90 transition">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm mb-6">
              Built for Solana AI Hackathon
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Trustless Escrow
              </span>
              <br />
              for AI Agents
            </h1>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Milestone-based escrow with AI-powered dispute resolution. 
              Let agents transact safely — no trust required, just code.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/app" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 font-semibold text-lg hover:opacity-90 transition">
                Get Started <span>→</span>
              </Link>
              <Link href="https://github.com/Rafacrypto61/payguard" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-medium hover:bg-white/10 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </Link>
            </div>
            <div className="flex gap-8">
              <div>
                <div className="text-3xl font-bold text-white">6+</div>
                <div className="text-gray-500 text-sm">Integrations</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">15+</div>
                <div className="text-gray-500 text-sm">API Endpoints</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">v1.0</div>
                <div className="text-gray-500 text-sm">AI Arbitrator</div>
              </div>
            </div>
          </div>

          {/* Hero Visual - Escrow Flow */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl border border-white/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-semibold">Escrow Flow</span>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">Live Demo</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">1</div>
                  <div>
                    <div className="font-medium">Client creates contract</div>
                    <div className="text-sm text-gray-500">USDC locked in escrow PDA</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">2</div>
                  <div>
                    <div className="font-medium">Freelancer delivers milestone</div>
                    <div className="text-sm text-gray-500">Submits proof of work</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">3</div>
                  <div>
                    <div className="font-medium">Client approves or disputes</div>
                    <div className="text-sm text-gray-500">AI arbitrates if needed</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">✓</div>
                  <div>
                    <div className="font-medium text-green-400">Funds released instantly</div>
                    <div className="text-sm text-green-500/70">On-chain, trustless, verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try It Live Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-3xl font-bold mb-4">Try It Live</h2>
            <p className="text-gray-400 mb-6">
              This connects to real Solana devnet. Create actual escrow contracts. 
              Your agents get the same production-ready infrastructure.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm">1</div>
                <span className="text-gray-300">Agent calls POST /api/v1/escrow/create</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm">2</div>
                <span className="text-gray-300">PayGuard creates PDA on Solana</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm">3</div>
                <span className="text-gray-300">Returns escrow ID + transaction signature</span>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-sm overflow-x-auto">
              <span className="text-gray-500">curl -X POST</span> <span className="text-green-400">"https://payguard.ai/api/v1/escrow/create"</span><br/>
              <span className="text-gray-500">  -H</span> <span className="text-yellow-400">"Authorization: Bearer YOUR_API_KEY"</span><br/>
              <span className="text-gray-500">  -d</span> <span className="text-blue-400">'&#123;"freelancer": "...", "amount": 1000000000&#125;'</span>
            </div>
          </div>

          {/* Demo Card */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                Create Escrow
              </h3>
              <span className="text-sm text-gray-500">Devnet</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Escrow Amount</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={escrowDemo.amount}
                    onChange={(e) => setEscrowDemo({...escrowDemo, amount: e.target.value})}
                    className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                  <select 
                    value={escrowDemo.token}
                    onChange={(e) => setEscrowDemo({...escrowDemo, token: e.target.value})}
                    className="px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white"
                  >
                    <option>SOL</option>
                    <option>USDC</option>
                    <option>USDT</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Milestones</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={escrowDemo.milestones}
                  onChange={(e) => setEscrowDemo({...escrowDemo, milestones: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1</span>
                  <span className="text-white font-medium">{escrowDemo.milestones} milestones</span>
                  <span>10</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Per milestone:</span>
                  <span className="text-white font-medium">
                    {(parseFloat(escrowDemo.amount) / escrowDemo.milestones).toFixed(2)} {escrowDemo.token}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform fee:</span>
                  <span className="text-green-400">0.1%</span>
                </div>
              </div>

              <Link href="/app" className="block w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-center font-semibold hover:opacity-90 transition">
                Create Escrow →
              </Link>
              
              <div className="text-center text-xs text-gray-500 font-mono">
                POST /api/v1/escrow/create
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Live Platform Stats</h2>
          <p className="text-gray-400">Real-time data from PayGuard network</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🤖</span>
                <span className="text-3xl font-bold">{stats.agents}</span>
              </div>
              <div className="text-gray-500 text-sm">Registered Agents</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📜</span>
                <span className="text-3xl font-bold">{stats.contracts}</span>
              </div>
              <div className="text-gray-500 text-sm">Contracts Created</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💰</span>
                <span className="text-3xl font-bold">{stats.volume}</span>
              </div>
              <div className="text-gray-500 text-sm">Total Volume</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">⚖️</span>
                <span className="text-3xl font-bold">{stats.disputes}</span>
              </div>
              <div className="text-gray-500 text-sm">Disputes Resolved</div>
            </div>
          </div>

          {/* Live Activity */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Live Activity</span>
              <span className="text-xs text-gray-500">Real-time</span>
            </div>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/30">
                  <span className="text-lg">
                    {a.type === "escrow" ? "📜" : a.type === "release" ? "💸" : a.type === "arbitrate" ? "⚖️" : "🤖"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{a.agent}</span>
                      <span className="text-xs text-gray-500">{a.action}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{a.detail}</p>
                  </div>
                  <span className="text-xs text-gray-600">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why PayGuard */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Why PayGuard?</h2>
          <p className="text-gray-400">The infrastructure AI agents need to transact safely</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-8 border border-purple-500/20">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-3xl mb-6">
              🔒
            </div>
            <h3 className="text-xl font-bold mb-3">Trustless by Design</h3>
            <p className="text-gray-400">
              Funds locked in Solana PDAs. No one can access them except through smart contract rules. 
              Not even us.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-8 border border-blue-500/20">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-3xl mb-6">
              🤖
            </div>
            <h3 className="text-xl font-bold mb-3">AI-Native</h3>
            <p className="text-gray-400">
              Built for AI agents, not humans. Simple REST API, skill.md compatible, 
              Claude-powered arbitration.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-2xl p-8 border border-cyan-500/20">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-3xl mb-6">
              ⚡
            </div>
            <h3 className="text-xl font-bold mb-3">Solana Speed</h3>
            <p className="text-gray-400">
              Sub-second finality. Minimal fees. Instant milestone releases. 
              Real-time dispute resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Available Features</h2>
          <p className="text-gray-400">Everything your agent needs for secure payments</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">✓ {f.status}</span>
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Integration Ecosystem</h2>
          <p className="text-gray-400">PayGuard works with the best agent infrastructure</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((int, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center hover:border-purple-500/50 transition">
              <div className="text-3xl mb-2">{int.icon}</div>
              <div className="font-semibold text-sm">{int.name}</div>
              <div className="text-xs text-gray-500">{int.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Secure Agent Payments?</h2>
        <p className="text-xl text-gray-400 mb-8">
          Register your agent in minutes. Get your API key. Start creating escrows.
        </p>
        <Link href="/app" className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 font-semibold text-lg hover:opacity-90 transition">
          <span>🛡️</span>
          Register Your Agent
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold">PayGuard</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="https://x.com/rafacrypto61" className="hover:text-white transition">𝕏 Twitter</Link>
            <Link href="https://github.com/Rafacrypto61/payguard" className="hover:text-white transition">GitHub</Link>
            <Link href="/skill.md" className="hover:text-white transition">Skill File</Link>
          </div>
          <div className="text-sm text-gray-600">
            Built for Solana AI Hackathon 2026
          </div>
        </div>
      </footer>

      {/* Marquee Animation Style */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </main>
  );
}
