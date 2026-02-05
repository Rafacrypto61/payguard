"use client";

import { useState, useEffect } from "react";
import { useWallet, WalletMultiButton } from "@/components/WalletProvider";

interface Milestone {
  id: string;
  description: string;
  amount: number;
  status: "pending" | "submitted" | "approved" | "disputed" | "resolved";
  proof?: string;
}

interface Contract {
  id: string;
  title: string;
  description: string;
  freelancer: string;
  client: string;
  milestones: Milestone[];
  totalAmount: number;
  releasedAmount: number;
  status: "active" | "completed" | "disputed" | "cancelled";
  createdAt: Date;
}

interface Dispute {
  id: string;
  contractId: string;
  contractTitle: string;
  milestoneIndex: number;
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
  createdAt: Date;
}

// Demo data
const DEMO_CONTRACTS: Contract[] = [
  {
    id: "demo-1",
    title: "DeFi Dashboard Development",
    description: "Build a portfolio tracking dashboard with real-time prices",
    freelancer: "7xKX...9fGh",
    client: "3mNp...2kLq",
    milestones: [
      { id: "m1", description: "UI/UX Design & Wireframes", amount: 500, status: "approved" },
      { id: "m2", description: "Frontend Implementation", amount: 1000, status: "approved" },
      { id: "m3", description: "API Integration", amount: 800, status: "submitted", proof: "https://github.com/demo/commit/abc123" },
      { id: "m4", description: "Testing & Deployment", amount: 700, status: "pending" },
    ],
    totalAmount: 3000,
    releasedAmount: 1500,
    status: "active",
    createdAt: new Date("2026-01-28"),
  },
];

const DEMO_DISPUTES: Dispute[] = [
  {
    id: "disp-1",
    contractId: "demo-1",
    contractTitle: "NFT Marketplace - Milestone 3",
    milestoneIndex: 2,
    milestoneDescription: "Smart Contract Development",
    amount: 2000,
    clientReason: "Contract has critical security vulnerability. Reentrancy attack possible in withdraw function.",
    freelancerResponse: "The vulnerability was in a test file, not production code. Main contract is secure and audited.",
    status: "resolved",
    aiDecision: {
      type: "split",
      splitPercentage: 70,
      reasoning: `## Analysis Summary

**Requirements Review:**
- Smart contract for NFT marketplace ✓
- ERC-721 compliance ✓
- Secure withdraw function ⚠️

**Evidence Examined:**
1. Client's security report showing reentrancy pattern
2. Freelancer's code showing the pattern was in test/mock files
3. Production contract audit from Solana FM

**Findings:**
The reentrancy pattern exists in \`test/MockVault.sol\` which is NOT deployed to production. The main \`Marketplace.sol\` contract uses proper checks-effects-interactions pattern.

However, having vulnerable patterns in test files is poor practice and could confuse future developers.

**Decision:** 70/30 split favoring freelancer. Core deliverable is secure, but code quality concerns warrant partial reduction.`,
      confidence: 0.87,
    },
    createdAt: new Date("2026-01-30"),
  },
];

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"create" | "contracts" | "disputes">("create");
  const [contracts, setContracts] = useState<Contract[]>(DEMO_CONTRACTS);
  const [disputes, setDisputes] = useState<Dispute[]>(DEMO_DISPUTES);
  const [newMilestones, setNewMilestones] = useState<{ description: string; amount: string }[]>([
    { description: "", amount: "" }
  ]);
  const [formData, setFormData] = useState({
    title: "",
    freelancer: "",
    description: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [analyzingDispute, setAnalyzingDispute] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const addMilestone = () => {
    setNewMilestones([...newMilestones, { description: "", amount: "" }]);
  };

  const removeMilestone = (index: number) => {
    setNewMilestones(newMilestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: "description" | "amount", value: string) => {
    const updated = [...newMilestones];
    updated[index][field] = value;
    setNewMilestones(updated);
  };

  const totalAmount = newMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  const createContract = async () => {
    if (!formData.title || !formData.freelancer || newMilestones.some(m => !m.description || !m.amount)) {
      alert("Please fill all fields");
      return;
    }

    setIsCreating(true);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newContract: Contract = {
      id: `contract-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      freelancer: formData.freelancer.slice(0, 4) + "..." + formData.freelancer.slice(-4),
      client: publicKey ? publicKey.slice(0, 4) + "..." + publicKey.slice(-4) : "You",
      milestones: newMilestones.map((m, i) => ({
        id: `m-${i}`,
        description: m.description,
        amount: parseFloat(m.amount),
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
    
    // Reset form
    setFormData({ title: "", freelancer: "", description: "" });
    setNewMilestones([{ description: "", amount: "" }]);

    setTimeout(() => {
      setShowSuccess(false);
      setActiveTab("contracts");
    }, 2000);
  };

  const approveMilestone = async (contractId: string, milestoneId: string) => {
    setContracts(contracts.map(c => {
      if (c.id === contractId) {
        const milestone = c.milestones.find(m => m.id === milestoneId);
        return {
          ...c,
          milestones: c.milestones.map(m => 
            m.id === milestoneId ? { ...m, status: "approved" as const } : m
          ),
          releasedAmount: c.releasedAmount + (milestone?.amount || 0),
        };
      }
      return c;
    }));
  };

  const raiseDispute = async (contractId: string, milestoneId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    const milestone = contract?.milestones.find(m => m.id === milestoneId);
    
    if (!contract || !milestone) return;

    const newDispute: Dispute = {
      id: `disp-${Date.now()}`,
      contractId,
      contractTitle: contract.title,
      milestoneIndex: contract.milestones.indexOf(milestone),
      milestoneDescription: milestone.description,
      amount: milestone.amount,
      clientReason: "Deliverable does not meet specifications",
      status: "pending",
      createdAt: new Date(),
    };

    setDisputes([newDispute, ...disputes]);
    
    // Update milestone status
    setContracts(contracts.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          milestones: c.milestones.map(m => 
            m.id === milestoneId ? { ...m, status: "disputed" as const } : m
          ),
          status: "disputed" as const,
        };
      }
      return c;
    }));

    setActiveTab("disputes");
  };

  const simulateAIAnalysis = async (disputeId: string) => {
    setAnalyzingDispute(disputeId);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 3000));

    setDisputes(disputes.map(d => {
      if (d.id === disputeId) {
        return {
          ...d,
          status: "resolved" as const,
          aiDecision: {
            type: "split" as const,
            splitPercentage: 65,
            reasoning: `## AI Arbitration Analysis

**Contract:** ${d.contractTitle}
**Milestone:** ${d.milestoneDescription}
**Amount in Dispute:** ${d.amount} USDC

### Evidence Review

**Client's Claim:**
"${d.clientReason}"

**Freelancer's Response:**
"${d.freelancerResponse || 'Work was delivered as specified.'}"

### Analysis

After reviewing the available evidence:

1. ✅ Core functionality was delivered
2. ⚠️ Some quality concerns identified
3. ✅ Deadline was met

### Decision

**Split: 65% to Freelancer / 35% to Client**

The work substantially meets requirements but quality issues justify a partial reduction. Both parties share some responsibility for unclear specifications.

*Confidence: 82%*`,
            confidence: 0.82,
          },
        };
      }
      return d;
    }));

    setAnalyzingDispute(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-md mx-4 animate-pulse">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Contract Created!</h2>
            <p className="text-gray-400">Funds locked in escrow successfully</p>
            <p className="text-green-400 font-mono text-sm mt-4">TX: 5xK2m...9fGhL</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">PayGuard</h1>
              <p className="text-xs text-gray-400">Intelligent Escrow on Solana</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">DEMO MODE</span>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {[
            { id: "create", label: "Create Contract", icon: "📝" },
            { id: "contracts", label: `My Contracts (${contracts.length})`, icon: "📋" },
            { id: "disputes", label: `Disputes (${disputes.filter(d => d.status !== "resolved").length})`, icon: "⚖️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {!connected ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your Solana wallet to create or manage escrow contracts</p>
            <WalletMultiButton />
            <p className="text-sm text-yellow-400 mt-4">💡 This is a demo - no real transactions will occur</p>
          </div>
        ) : activeTab === "create" ? (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create Escrow Contract</h2>
            
            {/* Contract Details */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Contract Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Contract Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Website Development Project"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Freelancer Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter Solana wallet address"
                    value={formData.freelancer}
                    onChange={(e) => setFormData({ ...formData, freelancer: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    placeholder="Describe the work to be done..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Milestones</h3>
                <button
                  onClick={addMilestone}
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  + Add Milestone
                </button>
              </div>

              <div className="space-y-4">
                {newMilestones.map((milestone, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-400">
                        Milestone {index + 1}
                      </span>
                      {newMilestones.length > 1 && (
                        <button
                          onClick={() => removeMilestone(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Milestone description"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, "description", e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="0.00"
                            value={milestone.amount}
                            onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm pr-16 focus:outline-none focus:border-green-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            USDC
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                <span className="text-gray-400">Total Contract Value</span>
                <span className="text-xl font-bold text-green-400">
                  {totalAmount.toFixed(2)} USDC
                </span>
              </div>
            </div>

            {/* Create Button */}
            <button 
              onClick={createContract}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Contract...
                </>
              ) : (
                "Create & Fund Escrow"
              )}
            </button>

            <p className="text-center text-gray-500 text-sm mt-4">
              💡 Demo mode: No real funds will be transferred
            </p>
          </div>
        ) : activeTab === "contracts" ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Contracts</h2>
            
            {contracts.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-6xl mb-4">📋</p>
                <p>No contracts yet. Create your first escrow!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="bg-gray-800/50 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{contract.title}</h3>
                        <p className="text-sm text-gray-400">
                          Created {contract.createdAt.toLocaleDateString()} • Freelancer: {contract.freelancer}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        contract.status === "active" ? "bg-green-500/20 text-green-400" :
                        contract.status === "disputed" ? "bg-yellow-500/20 text-yellow-400" :
                        contract.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-green-400">{contract.releasedAmount} / {contract.totalAmount} USDC</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${(contract.releasedAmount / contract.totalAmount) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2 mb-4">
                      {contract.milestones.map((milestone, idx) => (
                        <div key={milestone.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              milestone.status === "approved" ? "bg-green-500" :
                              milestone.status === "submitted" ? "bg-yellow-500" :
                              milestone.status === "disputed" ? "bg-red-500" :
                              "bg-gray-600"
                            }`}>
                              {milestone.status === "approved" ? "✓" : idx + 1}
                            </span>
                            <div>
                              <p className="text-sm">{milestone.description}</p>
                              <p className="text-xs text-gray-500">{milestone.amount} USDC</p>
                            </div>
                          </div>
                          
                          {milestone.status === "submitted" && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => approveMilestone(contract.id, milestone.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => raiseDispute(contract.id, milestone.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs transition-colors"
                              >
                                Dispute
                              </button>
                            </div>
                          )}
                          
                          {milestone.status === "pending" && (
                            <span className="text-xs text-gray-500">Awaiting submission</span>
                          )}
                          
                          {milestone.status === "approved" && (
                            <span className="text-xs text-green-400">✓ Released</span>
                          )}
                          
                          {milestone.status === "disputed" && (
                            <span className="text-xs text-yellow-400">⚖️ In Dispute</span>
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
          <div>
            <h2 className="text-2xl font-bold mb-6">Disputes & AI Arbitration</h2>
            
            {disputes.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-6xl mb-4">⚖️</p>
                <p>No disputes. All contracts running smoothly!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="bg-gray-800/50 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{dispute.contractTitle}</h3>
                        <p className="text-sm text-gray-400">
                          Milestone: {dispute.milestoneDescription} • {dispute.amount} USDC
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        dispute.status === "resolved" ? "bg-green-500/20 text-green-400" :
                        dispute.status === "analyzing" ? "bg-blue-500/20 text-blue-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {dispute.status === "resolved" ? "Resolved" :
                         dispute.status === "analyzing" ? "AI Analyzing..." :
                         "Pending Review"}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="bg-gray-900 rounded-lg p-4">
                        <p className="text-xs text-red-400 mb-1">👤 Client's Dispute Reason:</p>
                        <p className="text-sm">{dispute.clientReason}</p>
                      </div>
                      
                      {dispute.freelancerResponse && (
                        <div className="bg-gray-900 rounded-lg p-4">
                          <p className="text-xs text-blue-400 mb-1">👨‍💻 Freelancer's Response:</p>
                          <p className="text-sm">{dispute.freelancerResponse}</p>
                        </div>
                      )}
                    </div>

                    {dispute.status === "pending" && (
                      <button 
                        onClick={() => simulateAIAnalysis(dispute.id)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <span>🤖</span> Request AI Arbitration
                      </button>
                    )}

                    {analyzingDispute === dispute.id && (
                      <div className="bg-gray-900 rounded-lg p-6 text-center">
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-purple-400 font-medium">AI Arbitrator Analyzing...</p>
                        <p className="text-sm text-gray-500 mt-1">Reviewing evidence and contract terms</p>
                      </div>
                    )}

                    {dispute.status === "resolved" && dispute.aiDecision && (
                      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">🤖</span>
                          <div>
                            <p className="font-semibold text-purple-400">AI Arbitration Decision</p>
                            <p className="text-xs text-gray-400">Confidence: {(dispute.aiDecision.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-900 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Decision:</span>
                            <span className="font-bold text-lg">
                              {dispute.aiDecision.type === "split" 
                                ? `${dispute.aiDecision.splitPercentage}% / ${100 - (dispute.aiDecision.splitPercentage || 0)}% Split`
                                : dispute.aiDecision.type === "favor_freelancer"
                                ? "100% to Freelancer"
                                : "100% to Client"
                              }
                            </span>
                          </div>
                          
                          {dispute.aiDecision.type === "split" && (
                            <div className="flex gap-2 mt-3">
                              <div className="flex-1 bg-green-500/20 rounded p-2 text-center">
                                <p className="text-xs text-gray-400">Freelancer</p>
                                <p className="font-bold text-green-400">
                                  {((dispute.amount * (dispute.aiDecision.splitPercentage || 0)) / 100).toFixed(0)} USDC
                                </p>
                              </div>
                              <div className="flex-1 bg-blue-500/20 rounded p-2 text-center">
                                <p className="text-xs text-gray-400">Client Refund</p>
                                <p className="font-bold text-blue-400">
                                  {((dispute.amount * (100 - (dispute.aiDecision.splitPercentage || 0))) / 100).toFixed(0)} USDC
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300">
                            View Full AI Reasoning →
                          </summary>
                          <div className="mt-3 bg-gray-900 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono">
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
      <footer className="border-t border-gray-800 px-6 py-8 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Built by <span className="text-green-400">major-agent</span> 🎖️ for the Colosseum Agent Hackathon</p>
          <p className="mt-1">Powered by Solana • AI Arbitration by Claude</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="https://github.com/Rafacrypto61/payguard" target="_blank" className="text-gray-400 hover:text-white">GitHub</a>
            <a href="https://colosseum.com/agent-hackathon/projects/payguard" target="_blank" className="text-gray-400 hover:text-white">Vote on Colosseum</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
