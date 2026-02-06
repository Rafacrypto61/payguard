/**
 * SOLPRISM Verifiable Arbitration Example
 *
 * Demonstrates the full commit-reveal flow for PayGuard dispute resolution
 * using the SOLPRISM protocol. Every AI arbitration decision is:
 *
 *   1. Committed onchain (hash locked before funds move)
 *   2. Executed on PayGuard (dispute resolved, funds transferred)
 *   3. Revealed onchain (full reasoning published for verification)
 *   4. Verifiable by anyone (client, freelancer, or third party)
 *
 * @see https://www.solprism.app/
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import PayGuardClient, { VerifiableArbitrator } from "../sdk/src";

// ─── Configuration ────────────────────────────────────────────────────────

const PAYGUARD_PROGRAM_ID = new PublicKey("PayGUARD1111111111111111111111111111111111111");
const RPC_URL = clusterApiUrl("devnet");

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  // In production, load from secure key management
  const arbitratorWallet = Keypair.generate();
  const clientWallet = Keypair.generate();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║    PayGuard × SOLPRISM — Verifiable Arbitration Demo        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ─── Step 1: Initialize the Verifiable Arbitrator ───────────────────

  console.log("1. Initializing SOLPRISM-powered arbitrator...\n");

  const arbitrator = new VerifiableArbitrator({
    connection,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    agentName: "payguard-arbitrator",
    model: "claude-3-5-sonnet-20241022",
  });

  // Register agent on SOLPRISM (one-time)
  // await arbitrator.register(arbitratorWallet);
  console.log("   ✓ Arbitrator agent registered on SOLPRISM");
  console.log("   ✓ Onchain profile tracks commitment history & accountability\n");

  // ─── Step 2: Dispute Scenario ──────────────────────────────────────

  console.log("2. Dispute scenario...\n");
  console.log("   Contract: Build a Solana DEX frontend");
  console.log("   Milestone 2: 'Implement swap interface with limit orders'");
  console.log("   Amount: 400 USDC");
  console.log("   Freelancer submitted proof of delivery");
  console.log("   Client disputes: 'Limit order feature is completely missing'\n");

  // ─── Step 3: AI Analysis + SOLPRISM Commit ─────────────────────────

  console.log("3. AI analyzes dispute → commits reasoning hash to SOLPRISM...\n");

  // In production, this calls Claude and commits onchain:
  //
  // const result = await arbitrator.analyzeAndCommit(arbitratorWallet, {
  //   contractId: "contract-12345",
  //   milestoneIndex: 1,
  //   contractDescription: "Build a Solana DEX frontend with swap and limit order functionality",
  //   milestoneDescription: "Implement swap interface with limit orders",
  //   freelancerProof: "Delivered swap UI with market orders, responsive design, wallet integration. Limit orders listed as 'coming soon' in UI.",
  //   clientDisputeReason: "Contract explicitly required limit orders. Feature is missing entirely — only a placeholder page exists.",
  // });

  // Simulated result (what the real call returns):
  const mockResult = {
    hash: "a3f2b8c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    commitTx: "5xK9...mock...commitment-tx",
    commitmentAddress: "7YwH...mock...commitment-pda",
    slot: 284_567_890,
    reasoning: {
      contractId: "contract-12345",
      milestoneIndex: 1,
      contractDescription: "Build a Solana DEX frontend with swap and limit order functionality",
      milestoneDescription: "Implement swap interface with limit orders",
      freelancerProof: "Delivered swap UI with market orders, responsive design, wallet integration",
      clientDisputeReason: "Limit orders missing entirely",
      analysis: {
        requirementsMet: [
          "Swap interface implemented and functional",
          "Responsive design across devices",
          "Wallet integration (Phantom, Solflare)",
          "Market order execution works correctly",
        ],
        requirementsPartiallyMet: [
          "UI polish — functional but some rough edges on mobile",
        ],
        requirementsNotMet: [
          "Limit order functionality — explicitly required, only placeholder exists",
        ],
        evidenceReviewed: [
          "Contract description specifying limit orders",
          "Freelancer's deployed preview URL",
          "Screenshots of 'coming soon' placeholder",
          "Git commit history showing no limit order logic",
        ],
      },
      decision: {
        type: "split" as const,
        splitPercentage: 60,
        reasoning: "The freelancer delivered substantial work (swap UI, wallet integration, responsive design) that meets ~60% of the milestone scope. However, limit orders were explicitly required and are entirely missing. A 60/40 split fairly compensates the delivered work while acknowledging the unmet requirement.",
        confidence: 0.88,
      },
      timestamp: Date.now(),
      agentId: "payguard-arbitrator",
    },
  };

  console.log("   ┌─────────────────────────────────────────────────────────┐");
  console.log("   │ SOLPRISM COMMITMENT                                     │");
  console.log("   ├─────────────────────────────────────────────────────────┤");
  console.log(`   │ Hash:       ${mockResult.hash.slice(0, 20)}...           │`);
  console.log(`   │ Commitment: ${mockResult.commitmentAddress}              │`);
  console.log(`   │ Slot:       ${mockResult.slot.toLocaleString()}                       │`);
  console.log("   │                                                         │");
  console.log("   │ ⚡ Reasoning hash is now LOCKED onchain                 │");
  console.log("   │ ⚡ Cannot be changed after this point                   │");
  console.log("   └─────────────────────────────────────────────────────────┘\n");

  console.log("   Decision: SPLIT (60% freelancer / 40% client)");
  console.log("   Confidence: 88%\n");
  console.log("   Evidence weighed:");
  console.log("   ✓ Swap interface implemented and functional");
  console.log("   ✓ Responsive design across devices");
  console.log("   ✓ Wallet integration works");
  console.log("   ✗ Limit orders — explicitly required, missing\n");

  // ─── Step 4: PayGuard Executes Resolution ──────────────────────────

  console.log("4. PayGuard executes dispute resolution onchain...\n");
  console.log("   → 240 USDC (60%) released to freelancer");
  console.log("   → 160 USDC (40%) returned to client");
  console.log("   → Arbitration proof hash stored in milestone\n");

  // In production:
  // const onChainData = formatForOnChain(result);
  // await payguardClient.resolveDispute(contractId, 1, { split: [60] }, onChainData.reasoningHash);

  // ─── Step 5: Reveal Reasoning on SOLPRISM ──────────────────────────

  console.log("5. Revealing full reasoning onchain via SOLPRISM...\n");

  // In production:
  // const revealResult = await arbitrator.reveal(
  //   arbitratorWallet,
  //   result,
  //   "ipfs://QmXyz...full-reasoning-json"
  // );

  console.log("   ✓ Full reasoning JSON published to IPFS");
  console.log("   ✓ SOLPRISM reveal transaction confirmed");
  console.log("   ✓ Reasoning URI linked onchain to commitment\n");

  // ─── Step 6: Anyone Can Verify ─────────────────────────────────────

  console.log("6. Verification (anyone can check)...\n");

  // In production:
  // const verification = await arbitrator.verify(
  //   result.commitmentAddress,
  //   result.reasoning
  // );

  console.log("   ┌─────────────────────────────────────────────────────────┐");
  console.log("   │ ✅ VERIFICATION PASSED                                  │");
  console.log("   ├─────────────────────────────────────────────────────────┤");
  console.log("   │ The arbitration reasoning matches the onchain           │");
  console.log("   │ commitment made BEFORE funds were transferred.          │");
  console.log("   │                                                         │");
  console.log("   │ This proves:                                            │");
  console.log("   │ • The AI's reasoning was locked in before resolution    │");
  console.log("   │ • No one tampered with the decision after the fact      │");
  console.log("   │ • Both parties can independently verify fairness        │");
  console.log("   │                                                         │");
  console.log("   │ 🔗 https://www.solprism.app/commitment/7YwH...          │");
  console.log("   └─────────────────────────────────────────────────────────┘\n");

  // ─── Summary ───────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Why SOLPRISM + PayGuard?");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("  Without SOLPRISM:");
  console.log("  • AI makes decision → funds move → 'trust me bro'");
  console.log("  • No way to prove reasoning wasn't changed after the fact");
  console.log("  • Opaque AI = zero accountability");
  console.log("");
  console.log("  With SOLPRISM:");
  console.log("  • AI reasoning hash committed onchain BEFORE funds move");
  console.log("  • Full reasoning revealed and linked onchain AFTER resolution");
  console.log("  • Anyone can verify the hash matches — cryptographic proof");
  console.log("  • Arbitrator builds onchain accountability score over time");
  console.log("");
  console.log("  → Verifiable AI arbitration. Not 'trust me' — verify me.");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
