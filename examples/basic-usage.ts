/**
 * PayGuard Basic Usage Example
 * 
 * This example demonstrates how to:
 * 1. Create an escrow contract
 * 2. Fund the escrow
 * 3. Submit milestone completion
 * 4. Approve or dispute milestones
 * 5. Resolve disputes with AI arbitration
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import PayGuardClient, { AIArbitrator } from "../sdk/src";

// Configuration
const PROGRAM_ID = new PublicKey("PayGUARD1111111111111111111111111111111111111");
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet USDC

async function main() {
  // Setup connection
  const connection = new Connection(clusterApiUrl("devnet"));
  
  // In production, use wallet adapter or secure key management
  const clientWallet = Keypair.generate();
  const freelancerWallet = Keypair.generate();
  
  const provider = new AnchorProvider(
    connection,
    new Wallet(clientWallet),
    { commitment: "confirmed" }
  );

  const client = new PayGuardClient(provider, PROGRAM_ID);

  console.log("=== PayGuard Demo ===\n");

  // Step 1: Create Contract
  console.log("1. Creating escrow contract...");
  
  const contractTx = await client.createContract({
    freelancer: freelancerWallet.publicKey,
    tokenMint: USDC_MINT,
    totalAmount: 1000_000_000, // 1000 USDC (6 decimals)
    milestones: [
      { amount: 300_000_000, description: "Design phase - wireframes and mockups" },
      { amount: 400_000_000, description: "Development phase - core features" },
      { amount: 300_000_000, description: "Testing and deployment" },
    ],
    description: "Build a Solana-based marketplace frontend with wallet integration",
  });
  
  console.log(`   Contract created: ${contractTx}`);
  console.log(`   - Total: 1000 USDC`);
  console.log(`   - Milestones: 3 (300 + 400 + 300 USDC)\n`);

  // Step 2: Fund Escrow
  console.log("2. Funding escrow...");
  // In real usage: client.fundEscrow(contractId, amount, clientTokenAccount, escrowVault)
  console.log("   [Simulated] Escrow funded with 1000 USDC\n");

  // Step 3: Freelancer submits milestone
  console.log("3. Freelancer submits milestone 1...");
  // client.submitMilestone(contractId, 0, "Delivered wireframes: https://figma.com/...")
  console.log("   [Simulated] Milestone 1 submitted with proof\n");

  // Step 4: Client approves milestone (happy path)
  console.log("4. Client approves milestone 1...");
  // client.approveMilestone(contractId, 0, freelancer, escrowVault, freelancerTokenAccount)
  console.log("   [Simulated] 300 USDC released to freelancer\n");

  // Step 5: Dispute scenario
  console.log("5. Dispute scenario for milestone 2...");
  console.log("   - Freelancer submits milestone 2");
  console.log("   - Client raises dispute: 'Missing mobile responsiveness'\n");

  // Step 6: AI Arbitration
  console.log("6. AI Arbitrator analyzes dispute...\n");

  const arbitrator = new AIArbitrator(process.env.ANTHROPIC_API_KEY || "");
  
  // In real usage, this would call the AI
  const mockDecision = {
    decision: "split" as const,
    splitPercentage: 70,
    reasoning: `After analyzing the deliverables:
    
    REQUIREMENTS MET:
    - Core functionality implemented ✓
    - Desktop layout complete ✓
    - API integration working ✓
    
    REQUIREMENTS PARTIALLY MET:
    - Mobile responsiveness: 60% complete
      - Tablet breakpoints missing
      - Some buttons not touch-friendly
    
    DECISION: 70/30 split in favor of freelancer.
    The core work was delivered, but mobile requirements
    were clearly specified and not fully met.`,
    confidence: 0.85,
  };

  console.log("   AI Decision:", mockDecision.decision.toUpperCase());
  console.log(`   Split: ${mockDecision.splitPercentage}% to freelancer`);
  console.log(`   Confidence: ${(mockDecision.confidence * 100).toFixed(0)}%`);
  console.log("\n   Reasoning:");
  console.log("   " + mockDecision.reasoning.split("\n").join("\n   "));

  // Step 7: Execute resolution
  console.log("\n7. Executing resolution on-chain...");
  console.log("   - 280 USDC (70%) → Freelancer");
  console.log("   - 120 USDC (30%) → Client refund");
  console.log("   - Arbitration proof stored on-chain\n");

  console.log("=== Demo Complete ===");
  console.log("\nKey Features Demonstrated:");
  console.log("• Multi-milestone escrow");
  console.log("• Happy path approval");
  console.log("• Dispute with AI arbitration");
  console.log("• Fair split resolution");
  console.log("• All decisions verifiable on-chain");
}

// Run if executed directly
main().catch(console.error);
