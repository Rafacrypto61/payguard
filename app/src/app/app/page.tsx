"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LocalContract {
  id: number;
  title: string;
  freelancer: string;
  arbitrator: string;
  milestones: { description: string; amount: number; status: string }[];
  totalAmount: number;
  releasedAmount: number;
  status: string;
  createdAt: Date;
  pda: string;
}

const PAYGUARD_PROGRAM_ID = "7xGH3qHVx..."; // Placeholder

export default function AppPage() {
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "contracts" | "disputes">("create");
  const [contracts, setContracts] = useState<LocalContract[]>([]);
  const [milestones, setMilestones] = useState([{ description: "", amount: "" }]);
  const [formData, setFormData] = useState({ title: "", freelancer: "", arbitrator: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextContractId, setNextContractId] = useState(1);

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  // Load contracts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("payguard_contracts");
    if (saved) {
      const parsed = JSON.parse(saved);
      setContracts(parsed);
      if (parsed.length > 0) {
        setNextContractId(Math.max(...parsed.map((c: LocalContract) => c.id)) + 1);
      }
    }
  }, []);

  // Save contracts to localStorage
  useEffect(() => {
    if (contracts.length > 0) {
      localStorage.setItem("payguard_contracts", JSON.stringify(contracts));
    }
  }, [contracts]);

  const handleConnect = () => {
    // Simulated wallet connect
    setConnected(true);
  };

  const handleCreateContract = async () => {
    if (!connected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!formData.title || !formData.freelancer) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Simulate contract creation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newContract: LocalContract = {
        id: nextContractId,
        title: formData.title,
        freelancer: formData.freelancer,
        arbitrator: formData.arbitrator || "Self",
        milestones: milestones.map((m) => ({
          description: m.description,
          amount: parseFloat(m.amount) || 0,
          status: "pending",
        })),
        totalAmount: totalAmount,
        releasedAmount: 0,
        status: "active",
        createdAt: new Date(),
        pda: `${Math.random().toString(36).substring(2, 15)}...`,
      };

      setContracts([...contracts, newContract]);
      setNextContractId(nextContractId + 1);

      // Reset form
      setFormData({ title: "", freelancer: "", arbitrator: "", description: "" });
      setMilestones([{ description: "", amount: "" }]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error creating contract:", err);
      setError(err.message || "Failed to create contract");
    } finally {
      setIsCreating(false);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { description: "", amount: "" }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: "description" | "amount", value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">PayGuard</span>
              <p className="text-xs text-gray-500">Devnet • Demo Mode</p>
            </div>
          </Link>
          <button
            onClick={handleConnect}
            className={`px-6 py-2.5 rounded-xl font-semibold transition ${
              connected 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
            }`}
          >
            {connected ? "✓ Connected" : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Connection Warning */}
        {!connected && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200">
            ⚠️ Connect your wallet to create and manage contracts
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
            ❌ {error}
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-200">
            ✅ Contract created successfully! (Demo Mode)
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["create", "contracts", "disputes"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {tab === "create" && "➕ Create Contract"}
              {tab === "contracts" && `📄 Contracts (${contracts.length})`}
              {tab === "disputes" && "⚖️ Disputes"}
            </button>
          ))}
        </div>

        {/* Create Contract Tab */}
        {activeTab === "create" && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Create New Escrow Contract</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Contract Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Website Development"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Freelancer Wallet Address *</label>
                <input
                  type="text"
                  value={formData.freelancer}
                  onChange={(e) => setFormData({ ...formData, freelancer: e.target.value })}
                  placeholder="Solana wallet address"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Arbitrator Wallet (optional)</label>
                <input
                  type="text"
                  value={formData.arbitrator}
                  onChange={(e) => setFormData({ ...formData, arbitrator: e.target.value })}
                  placeholder="Leave empty to use your wallet"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 outline-none font-mono text-sm"
                />
              </div>

              {/* Milestones */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Milestones</label>
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={m.description}
                      onChange={(e) => updateMilestone(i, "description", e.target.value)}
                      placeholder="Milestone description"
                      className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                    />
                    <input
                      type="number"
                      value={m.amount}
                      onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                      placeholder="SOL"
                      className="w-24 px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                    />
                    {milestones.length > 1 && (
                      <button
                        onClick={() => removeMilestone(i)}
                        className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addMilestone}
                  className="mt-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10"
                >
                  + Add Milestone
                </button>
              </div>

              {/* Total */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <div className="flex justify-between text-lg">
                  <span className="text-purple-200">Total Amount:</span>
                  <span className="text-white font-bold">{totalAmount} SOL</span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleCreateContract}
                disabled={!connected || isCreating || !formData.title || !formData.freelancer}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {isCreating ? "Creating Contract..." : "🛡️ Create Contract"}
              </button>
            </div>
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === "contracts" && (
          <div className="space-y-4">
            {contracts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-4">📄</p>
                <p>No contracts yet. Create your first one!</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <div key={contract.id} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{contract.title}</h3>
                      <p className="text-sm text-gray-400">
                        Freelancer: {contract.freelancer.slice(0, 8)}...{contract.freelancer.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        PDA: {contract.pda}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      contract.status === "completed" ? "bg-green-500/20 text-green-400" :
                      contract.status === "funded" ? "bg-blue-500/20 text-blue-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {contract.status}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{contract.releasedAmount} / {contract.totalAmount} SOL</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${(contract.releasedAmount / contract.totalAmount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-2">
                    {contract.milestones.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            m.status === "approved" ? "bg-green-500" :
                            m.status === "submitted" ? "bg-blue-500" :
                            "bg-gray-600"
                          }`}>
                            {m.status === "approved" ? "✓" : i + 1}
                          </span>
                          <span className="text-white">{m.description || `Milestone ${i + 1}`}</span>
                        </div>
                        <span className="text-gray-400">{m.amount} SOL</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === "disputes" && (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <div className="text-6xl mb-6">⚖️</div>
            <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Dispute Resolution</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              When disputes arise, Claude AI analyzes the evidence and provides fair, reasoned arbitration. 
              All decisions are committed on-chain via SOLPRISM.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-black/30">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold text-white mb-1">Evidence Analysis</div>
                <div className="text-sm text-gray-500">AI reviews all submitted proofs</div>
              </div>
              <div className="p-4 rounded-xl bg-black/30">
                <div className="text-2xl mb-2">🤖</div>
                <div className="font-semibold text-white mb-1">Fair Resolution</div>
                <div className="text-sm text-gray-500">Percentage-based fund splits</div>
              </div>
              <div className="p-4 rounded-xl bg-black/30">
                <div className="text-2xl mb-2">🔗</div>
                <div className="font-semibold text-white mb-1">On-Chain Proof</div>
                <div className="text-sm text-gray-500">Verifiable reasoning via SOLPRISM</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>Built on Solana • PayGuard v1.0</p>
          <p className="font-mono text-xs">{PAYGUARD_PROGRAM_ID}</p>
        </div>
      </footer>
    </main>
  );
}
