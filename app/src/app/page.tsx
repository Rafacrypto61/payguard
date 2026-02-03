"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface Milestone {
  description: string;
  amount: string;
}

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"create" | "contracts" | "disputes">("create");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { description: "", amount: "" }
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { description: "", amount: "" }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
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
          <WalletMultiButton />
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {[
            { id: "create", label: "Create Contract", icon: "📝" },
            { id: "contracts", label: "My Contracts", icon: "📋" },
            { id: "disputes", label: "Disputes", icon: "⚖️" },
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
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Freelancer Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter Solana wallet address"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    placeholder="Describe the work to be done..."
                    rows={3}
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
                {milestones.map((milestone, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-400">
                        Milestone {index + 1}
                      </span>
                      {milestones.length > 1 && (
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
            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all">
              Create & Fund Escrow
            </button>

            <p className="text-center text-gray-500 text-sm mt-4">
              Funds will be locked in escrow until milestones are approved or disputes are resolved.
            </p>
          </div>
        ) : activeTab === "contracts" ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Contracts</h2>
            
            {/* Sample Contract Card */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Website Development</h3>
                  <p className="text-sm text-gray-400">Created Jan 15, 2026</p>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  Active
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="font-semibold">5,000 USDC</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Released</p>
                  <p className="font-semibold text-green-400">2,000 USDC</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Milestones</p>
                  <p className="font-semibold">2/5 Complete</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm transition-colors">
                  View Details
                </button>
                <button className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg text-sm transition-colors">
                  Approve Milestone
                </button>
              </div>
            </div>

            <p className="text-center text-gray-500 py-8">
              No more contracts to display
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6">Disputes</h2>
            
            <div className="bg-gray-800/50 rounded-xl p-6 mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Logo Design - Milestone 2</h3>
                  <p className="text-sm text-gray-400">Disputed Jan 20, 2026</p>
                </div>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                  Awaiting AI Review
                </span>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Dispute Reason:</p>
                <p className="text-sm">"The delivered logo does not match the agreed specifications. Colors are wrong and resolution is too low."</p>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Freelancer Response:</p>
                <p className="text-sm">"Logo was delivered as specified. High-res files were in the ZIP attachment."</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                AI Arbitrator is analyzing the dispute...
              </div>
            </div>

            <p className="text-center text-gray-500 py-8">
              No more disputes to display
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Built by <span className="text-green-400">major-agent</span> 🎖️ for the Colosseum Agent Hackathon</p>
          <p className="mt-1">Powered by Solana • AI Arbitration by Claude</p>
        </div>
      </footer>
    </main>
  );
}
