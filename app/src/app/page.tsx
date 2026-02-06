"use client";

import { useState } from "react";
import { useWallet, WalletMultiButton } from "@/components/WalletProvider";

interface Milestone {
  id: string;
  description: string;
  amount: number;
  status: "pending" | "submitted" | "approved" | "disputed";
}

interface Contract {
  id: string;
  title: string;
  freelancer: string;
  milestones: Milestone[];
  totalAmount: number;
  releasedAmount: number;
  status: "active" | "completed" | "disputed";
  createdAt: Date;
}

interface Dispute {
  id: string;
  contractTitle: string;
  milestoneDescription: string;
  amount: number;
  clientReason: string;
  freelancerResponse?: string;
  status: "pending" | "analyzing" | "resolved";
  aiDecision?: {
    type: "favor_freelancer" | "favor_client" | "split";
    splitPercentage?: number;
    reasoning: string;
    confidence: number;
  };
}

const DEMO_CONTRACTS: Contract[] = [
  {
    id: "1",
    title: "DeFi Dashboard Development",
    freelancer: "7xKX...9fGh",
    milestones: [
      { id: "m1", description: "UI/UX Design", amount: 500, status: "approved" },
      { id: "m2", description: "Frontend Dev", amount: 1000, status: "approved" },
      { id: "m3", description: "API Integration", amount: 800, status: "submitted" },
      { id: "m4", description: "Testing & Deploy", amount: 700, status: "pending" },
    ],
    totalAmount: 3000,
    releasedAmount: 1500,
    status: "active",
    createdAt: new Date("2026-01-28"),
  },
];

const DEMO_DISPUTES: Dispute[] = [
  {
    id: "d1",
    contractTitle: "NFT Marketplace",
    milestoneDescription: "Smart Contract Development",
    amount: 2000,
    clientReason: "Contract has security vulnerability in withdraw function.",
    freelancerResponse: "Vulnerability is in test file only, production is secure.",
    status: "resolved",
    aiDecision: {
      type: "split",
      splitPercentage: 70,
      reasoning: `## Analysis

**Evidence Reviewed:**
- Client's security report
- Production contract audit
- Test file analysis

**Findings:**
The reentrancy pattern exists only in test/MockVault.sol (NOT production). Main contract uses proper checks-effects-interactions.

**Decision:** 70/30 split. Core deliverable is secure, but test code quality concerns warrant reduction.`,
      confidence: 0.87,
    },
  },
];

export default function Home() {
  const { connected, publicKey, connect } = useWallet();
  const [activeTab, setActiveTab] = useState<"create" | "contracts" | "disputes">("create");
  const [contracts, setContracts] = useState<Contract[]>(DEMO_CONTRACTS);
  const [disputes, setDisputes] = useState<Dispute[]>(DEMO_DISPUTES);
  const [milestones, setMilestones] = useState([{ description: "", amount: "" }]);
  const [formData, setFormData] = useState({ title: "", freelancer: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  const createContract = async () => {
    if (!formData.title || !formData.freelancer) return;
    setIsCreating(true);
    await new Promise(r => setTimeout(r, 2000));
    
    const newContract: Contract = {
      id: Date.now().toString(),
      title: formData.title,
      freelancer: formData.freelancer.slice(0, 4) + "..." + formData.freelancer.slice(-4),
      milestones: milestones.map((m, i) => ({
        id: `m${i}`,
        description: m.description,
        amount: parseFloat(m.amount) || 0,
        status: "pending" as const,
      })),
      totalAmount,
      releasedAmount: 0,
      status: "active",
      createdAt: new Date(),
    };
    
    setContracts([newContract, ...contracts]);
    setIsCreating(false);
    setShowSuccess(true);
    setFormData({ title: "", freelancer: "", description: "" });
    setMilestones([{ description: "", amount: "" }]);
    setTimeout(() => { setShowSuccess(false); setActiveTab("contracts"); }, 2000);
  };

  const approveMilestone = (contractId: string, milestoneId: string) => {
    setContracts(contracts.map(c => {
      if (c.id === contractId) {
        const milestone = c.milestones.find(m => m.id === milestoneId);
        return {
          ...c,
          milestones: c.milestones.map(m => m.id === milestoneId ? { ...m, status: "approved" as const } : m),
          releasedAmount: c.releasedAmount + (milestone?.amount || 0),
        };
      }
      return c;
    }));
  };

  const simulateAI = async (disputeId: string) => {
    setAnalyzingId(disputeId);
    await new Promise(r => setTimeout(r, 3000));
    setDisputes(disputes.map(d => d.id === disputeId ? {
      ...d,
      status: "resolved" as const,
      aiDecision: {
        type: "split" as const,
        splitPercentage: 65,
        reasoning: `## AI Analysis\n\n**Decision:** 65/35 split in favor of freelancer.\n\nCore requirements were met. Minor quality issues identified.`,
        confidence: 0.82,
      },
    } : d));
    setAnalyzingId(null);
  };

  return (
    <main className="min-h-screen bg-pattern">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-10 text-center animate-fade-in glow">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Contract Created!</h2>
            <p className="text-gray-400">Funds locked in escrow</p>
            <p className="text-green-400 font-mono text-sm mt-4 opacity-60">TX: 5xK2m...9fGhL</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-xl bg-black/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">PayGuard</h1>
              <p className="text-xs text-gray-500">Intelligent Escrow on Solana</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              DEMO
            </span>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: "create", label: "Create Contract", icon: "M12 4v16m8-8H4" },
              { id: "contracts", label: `Contracts (${contracts.length})`, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { id: "disputes", label: `Disputes (${disputes.filter(d => d.status !== "resolved").length})`, icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "text-green-400 border-green-400 bg-green-400/5"
                    : "text-gray-500 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {!connected ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto mb-8 border border-white/10">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Connect your Solana wallet to create escrow contracts and manage payments securely
            </p>
            <button onClick={connect} className="btn-primary text-lg px-8 py-4">
              Connect Wallet
            </button>
            <p className="text-amber-400/80 text-sm mt-6">
              This is a demo - no real transactions
            </p>
          </div>
        ) : activeTab === "create" ? (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Create Escrow Contract</h2>
              <p className="text-gray-500">Define milestones and fund your escrow securely</p>
            </div>
            
            <div className="glass-card p-8 mb-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 text-sm">1</span>
                Contract Details
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Contract Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Website Development Project"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-modern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Freelancer Wallet</label>
                  <input
                    type="text"
                    placeholder="Enter Solana wallet address"
                    value={formData.freelancer}
                    onChange={(e) => setFormData({ ...formData, freelancer: e.target.value })}
                    className="input-modern font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <textarea
                    placeholder="Describe the work to be done..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-modern resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 text-sm">2</span>
                  Milestones
                </h3>
                <button
                  onClick={() => setMilestones([...milestones, { description: "", amount: "" }])}
                  className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Milestone
                </button>
              </div>

              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-400">Milestone {index + 1}</span>
                      {milestones.length > 1 && (
                        <button
                          onClick={() => setMilestones(milestones.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="What needs to be delivered?"
                          value={milestone.description}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[index].description = e.target.value;
                            setMilestones(updated);
                          }}
                          className="input-modern text-sm"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0"
                          value={milestone.amount}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[index].amount = e.target.value;
                            setMilestones(updated);
                          }}
                          className="input-modern text-sm pr-16"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USDC</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-gray-400">Total Contract Value</span>
                <span className="text-2xl font-bold gradient-text">{totalAmount.toLocaleString()} USDC</span>
              </div>
            </div>

            <button 
              onClick={createContract}
              disabled={isCreating || !formData.title || !formData.freelancer}
              className="w-full btn-primary py-5 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Contract...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Create & Fund Escrow
                </>
              )}
            </button>
          </div>
        ) : activeTab === "contracts" ? (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">My Contracts</h2>
              <p className="text-gray-500">Manage your active escrow agreements</p>
            </div>

            {contracts.length === 0 ? (
              <div className="text-center py-20 glass-card">
                <div className="text-6xl mb-4 opacity-20">📋</div>
                <p className="text-gray-500">No contracts yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {contracts.map((contract) => (
                  <div key={contract.id} className="glass-card glass-card-hover p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{contract.title}</h3>
                        <p className="text-sm text-gray-500">
                          Freelancer: <span className="font-mono text-gray-400">{contract.freelancer}</span>
                        </p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        contract.status === "active" ? "status-active" :
                        contract.status === "disputed" ? "status-disputed" : "status-pending"
                      }`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-green-400 font-medium">
                          {contract.releasedAmount.toLocaleString()} / {contract.totalAmount.toLocaleString()} USDC
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(contract.releasedAmount / contract.totalAmount) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {contract.milestones.map((m, idx) => (
                        <div key={m.id} className="flex items-center justify-between bg-white/5 rounded-xl px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              m.status === "approved" ? "bg-green-500 text-white" :
                              m.status === "submitted" ? "bg-amber-500 text-white" :
                              "bg-gray-700 text-gray-400"
                            }`}>
                              {m.status === "approved" ? "✓" : idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">{m.description}</p>
                              <p className="text-sm text-gray-500">{m.amount.toLocaleString()} USDC</p>
                            </div>
                          </div>
                          
                          {m.status === "submitted" && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => approveMilestone(contract.id, m.id)}
                                className="btn-primary py-2 px-4 text-sm"
                              >
                                Approve
                              </button>
                              <button className="btn-secondary py-2 px-4 text-sm text-red-400 border-red-500/30 hover:bg-red-500/10">
                                Dispute
                              </button>
                            </div>
                          )}
                          
                          {m.status === "approved" && (
                            <span className="text-green-400 text-sm font-medium">Released ✓</span>
                          )}
                          
                          {m.status === "pending" && (
                            <span className="text-gray-500 text-sm">Awaiting submission</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">AI Arbitration</h2>
              <p className="text-gray-500">Disputes resolved by AI in minutes, not weeks</p>
            </div>

            {disputes.length === 0 ? (
              <div className="text-center py-20 glass-card">
                <div className="text-6xl mb-4 opacity-20">⚖️</div>
                <p className="text-gray-500">No disputes - all contracts running smoothly!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="glass-card p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{dispute.contractTitle}</h3>
                        <p className="text-sm text-gray-500">{dispute.milestoneDescription} • {dispute.amount.toLocaleString()} USDC</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        dispute.status === "resolved" ? "status-active" : "status-pending"
                      }`}>
                        {dispute.status === "resolved" ? "Resolved" : "Pending"}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                        <p className="text-xs text-red-400 mb-2 font-medium">CLIENT'S CLAIM</p>
                        <p className="text-sm text-gray-300">{dispute.clientReason}</p>
                      </div>
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
                        <p className="text-xs text-blue-400 mb-2 font-medium">FREELANCER'S RESPONSE</p>
                        <p className="text-sm text-gray-300">{dispute.freelancerResponse || "Awaiting response..."}</p>
                      </div>
                    </div>

                    {dispute.status === "pending" && (
                      <button 
                        onClick={() => simulateAI(dispute.id)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
                      >
                        <span className="text-xl">🤖</span>
                        Request AI Arbitration
                      </button>
                    )}

                    {analyzingId === dispute.id && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-purple-400 font-semibold text-lg">AI Analyzing Evidence...</p>
                        <p className="text-sm text-gray-500 mt-1">Reviewing contract terms and submissions</p>
                      </div>
                    )}

                    {dispute.status === "resolved" && dispute.aiDecision && (
                      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-xl">🤖</span>
                          </div>
                          <div>
                            <p className="font-semibold text-purple-400">AI Arbitration Decision</p>
                            <p className="text-xs text-gray-500">Confidence: {(dispute.aiDecision.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                        
                        <div className="bg-black/30 rounded-xl p-6 mb-4">
                          <p className="text-lg font-bold mb-4">
                            {dispute.aiDecision.type === "split" 
                              ? `${dispute.aiDecision.splitPercentage}% / ${100 - (dispute.aiDecision.splitPercentage || 0)}% Split`
                              : dispute.aiDecision.type === "favor_freelancer" ? "100% to Freelancer" : "100% to Client"
                            }
                          </p>
                          
                          {dispute.aiDecision.type === "split" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                                <p className="text-xs text-gray-500 mb-1">Freelancer</p>
                                <p className="text-xl font-bold text-green-400">
                                  ${((dispute.amount * (dispute.aiDecision.splitPercentage || 0)) / 100).toLocaleString()}
                                </p>
                              </div>
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                                <p className="text-xs text-gray-500 mb-1">Client Refund</p>
                                <p className="text-xl font-bold text-blue-400">
                                  ${((dispute.amount * (100 - (dispute.aiDecision.splitPercentage || 0))) / 100).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2">
                            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            View AI Reasoning
                          </summary>
                          <div className="mt-4 bg-black/30 rounded-lg p-5 text-sm text-gray-300 whitespace-pre-wrap font-mono">
                            {dispute.aiDecision.reasoning}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">PayGuard</p>
                <p className="text-xs text-gray-500">Intelligent Escrow on Solana</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://github.com/Rafacrypto61/payguard" target="_blank" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://colosseum.com/agent-hackathon/projects/payguard" target="_blank" className="hover:text-white transition-colors">Vote on Colosseum</a>
            </div>
            <p className="text-sm text-gray-600">
              Built by <span className="text-green-400">major-agent</span> for Colosseum Hackathon
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
