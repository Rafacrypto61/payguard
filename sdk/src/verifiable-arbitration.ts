/**
 * Verifiable Arbitration Module — SOLPRISM Integration
 *
 * Every AI arbitration decision is cryptographically committed onchain
 * via the SOLPRISM protocol BEFORE funds move. After resolution, the
 * full reasoning is revealed onchain so both parties can verify the
 * decision was fair, consistent, and untampered.
 *
 * Flow:
 *   1. AI analyzes the dispute (evidence, requirements, deliverables)
 *   2. Reasoning trace is hashed and COMMITTED to SOLPRISM onchain
 *   3. PayGuard executes the dispute resolution (fund transfer)
 *   4. Full reasoning is REVEALED onchain for public verification
 *   5. Anyone can VERIFY the reasoning matches the original commitment
 *
 * @see https://www.solprism.app/
 * @see https://github.com/basedmereum/axiom-protocol
 */

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { createHash } from "crypto";
import {
  SolprismClient,
  SOLPRISM_PROGRAM_ID,
} from "@solprism/sdk";
import { createReasoningTrace } from "@solprism/sdk/schema";
import type { ReasoningTrace } from "@solprism/sdk/types";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ArbitrationReasoning {
  contractId: string;
  milestoneIndex: number;
  contractDescription: string;
  milestoneDescription: string;
  freelancerProof: string;
  clientDisputeReason: string;
  analysis: {
    requirementsMet: string[];
    requirementsPartiallyMet: string[];
    requirementsNotMet: string[];
    evidenceReviewed: string[];
  };
  decision: {
    type: "favor_freelancer" | "favor_client" | "split";
    splitPercentage?: number;
    reasoning: string;
    confidence: number;
  };
  timestamp: number;
  agentId: string;
}

export interface CommitResult {
  /** SHA-256 hash of the canonical reasoning JSON */
  hash: string;
  /** SOLPRISM onchain commitment transaction signature */
  commitTx: string;
  /** SOLPRISM commitment PDA address */
  commitmentAddress: string;
  /** Solana slot at which the commitment was anchored */
  slot: number;
  /** The full arbitration reasoning (kept offchain until reveal) */
  reasoning: ArbitrationReasoning;
}

export interface RevealResult {
  /** Transaction signature for the onchain reveal */
  revealTx: string;
  /** URI where the full reasoning is stored */
  reasoningUri: string;
}

export interface VerifyResult {
  /** Whether the reasoning matches the onchain commitment */
  valid: boolean;
  /** Human-readable verification message */
  message: string;
  /** The hash computed from the provided reasoning */
  computedHash: string;
  /** The hash stored onchain in the SOLPRISM commitment */
  storedHash: string;
  /** The reasoning that was verified (if provided) */
  reasoning?: ArbitrationReasoning;
  /** SOLPRISM explorer link for public verification */
  explorerUrl?: string;
}

export interface SolprismArbitrationConfig {
  /** Solana RPC connection */
  connection: Connection;
  /** Anthropic API key for AI analysis */
  anthropicApiKey: string;
  /** SOLPRISM agent name (registered onchain) */
  agentName?: string;
  /** Claude model to use for arbitration */
  model?: string;
  /** SOLPRISM program ID (defaults to mainnet/devnet) */
  programId?: PublicKey;
  /** Base URI for storing revealed reasoning (e.g. IPFS gateway, Arweave) */
  reasoningStorageUri?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Create a deterministic SHA-256 hash of arbitration reasoning.
 * Keys are sorted for canonical representation.
 */
export function hashReasoning(reasoning: ArbitrationReasoning): string {
  const canonical = JSON.stringify(reasoning, Object.keys(reasoning).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Convert an ArbitrationReasoning into a SOLPRISM ReasoningTrace
 * for onchain commitment.
 */
function toSolprismTrace(reasoning: ArbitrationReasoning): ReasoningTrace {
  return createReasoningTrace({
    agentId: reasoning.agentId,
    action: {
      type: "arbitration",
      description: `Dispute resolution for contract ${reasoning.contractId}, milestone ${reasoning.milestoneIndex}`,
      params: {
        contractId: reasoning.contractId,
        milestoneIndex: reasoning.milestoneIndex,
        contractDescription: reasoning.contractDescription,
        milestoneDescription: reasoning.milestoneDescription,
      },
    },
    reasoning: {
      steps: [
        `Evidence reviewed: ${reasoning.analysis.evidenceReviewed.join(", ")}`,
        `Requirements met: ${reasoning.analysis.requirementsMet.join(", ") || "none"}`,
        `Requirements partially met: ${reasoning.analysis.requirementsPartiallyMet.join(", ") || "none"}`,
        `Requirements not met: ${reasoning.analysis.requirementsNotMet.join(", ") || "none"}`,
        `Decision rationale: ${reasoning.decision.reasoning}`,
      ],
      inputs: [
        `Freelancer proof: ${reasoning.freelancerProof}`,
        `Client dispute: ${reasoning.clientDisputeReason}`,
      ],
      model: "claude-3-5-sonnet",
    },
    decision: {
      outcome: reasoning.decision.type,
      confidence: Math.round(reasoning.decision.confidence * 100),
      details: reasoning.decision.splitPercentage
        ? `Split: ${reasoning.decision.splitPercentage}% to freelancer`
        : reasoning.decision.type === "favor_freelancer"
          ? "Full payment released to freelancer"
          : "Funds returned to client",
    },
  });
}

/**
 * Format arbitration result for PayGuard onchain storage.
 * Maps the decision to the program's DisputeDecision enum format.
 */
export function formatForOnChain(result: CommitResult): {
  decisionType: number;
  splitPercentage: number;
  reasoningHash: number[];
  solprismCommitment: string;
} {
  const decisionTypeMap = {
    favor_freelancer: 0,
    favor_client: 1,
    split: 2,
  };

  return {
    decisionType: decisionTypeMap[result.reasoning.decision.type],
    splitPercentage: result.reasoning.decision.splitPercentage || 0,
    reasoningHash: Array.from(Buffer.from(result.hash, "hex")),
    solprismCommitment: result.commitmentAddress,
  };
}

// ─── Verifiable Arbitrator ────────────────────────────────────────────────

/**
 * Verifiable Arbitrator — SOLPRISM-Powered
 *
 * Wraps PayGuard's AI arbitration with cryptographic commit-reveal
 * reasoning via the SOLPRISM protocol. Every dispute decision is:
 *
 * 1. **Committed** — reasoning hash anchored onchain before funds move
 * 2. **Executed** — PayGuard resolves the dispute per the decision
 * 3. **Revealed** — full reasoning published onchain for verification
 * 4. **Verifiable** — anyone can check the reasoning was not altered
 *
 * @example
 * ```typescript
 * const arbitrator = new VerifiableArbitrator({
 *   connection,
 *   anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
 *   agentName: "payguard-arbitrator",
 * });
 *
 * // Register the arbitrator agent on SOLPRISM (one-time)
 * await arbitrator.register(walletKeypair);
 *
 * // Analyze dispute and commit reasoning BEFORE resolution
 * const result = await arbitrator.analyzeAndCommit(walletKeypair, {
 *   contractId: "abc123",
 *   milestoneIndex: 1,
 *   contractDescription: "Build a DEX frontend",
 *   milestoneDescription: "Implement swap UI",
 *   freelancerProof: "Delivered responsive swap interface with...",
 *   clientDisputeReason: "Missing limit order feature",
 * });
 *
 * // ... PayGuard executes resolve_dispute with result.hash ...
 *
 * // Reveal the full reasoning onchain
 * await arbitrator.reveal(walletKeypair, result, "ipfs://Qm...");
 *
 * // Anyone can verify
 * const verification = await arbitrator.verify(
 *   result.commitmentAddress,
 *   result.reasoning
 * );
 * console.log(verification.message);
 * // ✅ Reasoning verified — the trace matches the onchain commitment
 * ```
 */
export class VerifiableArbitrator {
  private solprism: SolprismClient;
  private connection: Connection;
  private anthropicApiKey: string;
  private agentName: string;
  private model: string;
  private reasoningStorageUri: string;

  constructor(config: SolprismArbitrationConfig) {
    this.connection = config.connection;
    this.anthropicApiKey = config.anthropicApiKey;
    this.agentName = config.agentName || "payguard-arbitrator";
    this.model = config.model || "claude-3-5-sonnet-20241022";
    this.reasoningStorageUri = config.reasoningStorageUri || "";

    this.solprism = new SolprismClient(
      config.connection,
      config.programId || SOLPRISM_PROGRAM_ID
    );
  }

  // ─── Registration ───────────────────────────────────────────────────

  /**
   * Register the arbitrator agent on SOLPRISM (one-time setup).
   * Creates an onchain agent profile that tracks commitment history
   * and accountability score.
   *
   * @param wallet - Keypair that will sign arbitration commitments
   * @returns Transaction signature
   */
  async register(wallet: Keypair): Promise<string> {
    const isRegistered = await this.solprism.isAgentRegistered(wallet.publicKey);
    if (isRegistered) {
      console.log(`[PayGuard] Agent "${this.agentName}" already registered on SOLPRISM`);
      return "";
    }

    const sig = await this.solprism.registerAgent(wallet, this.agentName);
    console.log(`[PayGuard] Agent "${this.agentName}" registered on SOLPRISM`);
    console.log(`  Tx: ${sig}`);
    return sig;
  }

  // ─── Commit (Pre-Resolution) ───────────────────────────────────────

  /**
   * Analyze a dispute with AI and commit the reasoning hash onchain
   * BEFORE the dispute is resolved. This is the core trust guarantee:
   * the reasoning is locked in before funds move.
   *
   * @param wallet - Keypair for signing the SOLPRISM commitment
   * @param params - Dispute context (contract, milestone, evidence)
   * @returns CommitResult with hash, tx, and full reasoning
   */
  async analyzeAndCommit(
    wallet: Keypair,
    params: {
      contractId: string;
      milestoneIndex: number;
      contractDescription: string;
      milestoneDescription: string;
      freelancerProof: string;
      clientDisputeReason: string;
      additionalContext?: string;
    }
  ): Promise<CommitResult> {
    // Step 1: AI analyzes the dispute
    const analysis = await this.getAIAnalysis(params);

    // Step 2: Build the full reasoning object
    const reasoning: ArbitrationReasoning = {
      contractId: params.contractId,
      milestoneIndex: params.milestoneIndex,
      contractDescription: params.contractDescription,
      milestoneDescription: params.milestoneDescription,
      freelancerProof: params.freelancerProof,
      clientDisputeReason: params.clientDisputeReason,
      analysis: analysis.analysis,
      decision: analysis.decision,
      timestamp: Date.now(),
      agentId: this.agentName,
    };

    // Step 3: Convert to SOLPRISM reasoning trace
    const trace = toSolprismTrace(reasoning);

    // Step 4: Commit the hash onchain via SOLPRISM
    const commitResult = await this.solprism.commitReasoning(wallet, trace);

    const hash = hashReasoning(reasoning);

    console.log(`[PayGuard] Arbitration reasoning committed via SOLPRISM`);
    console.log(`  Hash:       ${hash}`);
    console.log(`  Commitment: ${commitResult.commitmentAddress}`);
    console.log(`  Tx:         ${commitResult.signature}`);
    console.log(`  Decision:   ${reasoning.decision.type}`);
    if (reasoning.decision.splitPercentage) {
      console.log(`  Split:      ${reasoning.decision.splitPercentage}% to freelancer`);
    }
    console.log(`  Confidence: ${(reasoning.decision.confidence * 100).toFixed(0)}%`);
    console.log(`  Explorer:   https://www.solprism.app/commitment/${commitResult.commitmentAddress}`);

    return {
      hash,
      commitTx: commitResult.signature,
      commitmentAddress: commitResult.commitmentAddress,
      slot: commitResult.slot,
      reasoning,
    };
  }

  // ─── Reveal (Post-Resolution) ──────────────────────────────────────

  /**
   * Reveal the full arbitration reasoning onchain after the dispute
   * has been resolved. This makes the reasoning publicly auditable.
   *
   * @param wallet - Keypair for signing the reveal transaction
   * @param commitResult - The result from analyzeAndCommit
   * @param reasoningUri - URI where the full reasoning JSON is stored
   * @returns RevealResult with transaction signature
   */
  async reveal(
    wallet: Keypair,
    commitResult: CommitResult,
    reasoningUri: string
  ): Promise<RevealResult> {
    const revealResult = await this.solprism.revealReasoning(
      wallet,
      commitResult.commitmentAddress,
      reasoningUri
    );

    console.log(`[PayGuard] Arbitration reasoning revealed on SOLPRISM`);
    console.log(`  Commitment: ${commitResult.commitmentAddress}`);
    console.log(`  Reveal Tx:  ${revealResult.signature}`);
    console.log(`  URI:        ${reasoningUri}`);
    console.log(`  Explorer:   https://www.solprism.app/commitment/${commitResult.commitmentAddress}`);

    return {
      revealTx: revealResult.signature,
      reasoningUri,
    };
  }

  // ─── Verify (Anyone Can Call) ──────────────────────────────────────

  /**
   * Verify that arbitration reasoning matches its onchain commitment.
   * This is the core accountability check — anyone (client, freelancer,
   * or third party) can call this to confirm the AI's reasoning was
   * not altered after the commitment was made.
   *
   * @param commitmentAddress - The SOLPRISM commitment PDA
   * @param reasoning - The arbitration reasoning to verify
   * @returns VerifyResult with validity and details
   */
  async verify(
    commitmentAddress: string,
    reasoning: ArbitrationReasoning
  ): Promise<VerifyResult> {
    const trace = toSolprismTrace(reasoning);

    const solprismResult = await this.solprism.verifyReasoning(
      commitmentAddress,
      trace
    );

    const computedHash = hashReasoning(reasoning);
    const explorerUrl = `https://www.solprism.app/commitment/${commitmentAddress}`;

    return {
      valid: solprismResult.valid,
      message: solprismResult.valid
        ? "✅ Arbitration reasoning verified — matches the onchain SOLPRISM commitment"
        : "❌ Mismatch — the provided reasoning does not match the onchain commitment",
      computedHash,
      storedHash: solprismResult.storedHash,
      reasoning,
      explorerUrl,
    };
  }

  // ─── Accountability ────────────────────────────────────────────────

  /**
   * Get the arbitrator's onchain accountability score from SOLPRISM.
   * Higher scores indicate consistent commit-reveal behavior.
   *
   * @param authority - The arbitrator's public key
   * @returns Accountability percentage (0-100) or null if not registered
   */
  async getAccountability(authority: PublicKey | string): Promise<number | null> {
    return this.solprism.getAccountability(authority);
  }

  /**
   * Get all past arbitration commitments for this arbitrator.
   *
   * @param authority - The arbitrator's public key
   * @param limit - Maximum number of commitments to return
   * @returns Array of onchain commitments
   */
  async getCommitmentHistory(
    authority: PublicKey | string,
    limit: number = 50
  ) {
    return this.solprism.getAgentCommitments(authority, limit);
  }

  // ─── AI Analysis (Private) ─────────────────────────────────────────

  /**
   * Run AI analysis on the dispute evidence.
   * Returns structured analysis and decision.
   */
  private async getAIAnalysis(params: {
    contractDescription: string;
    milestoneDescription: string;
    freelancerProof: string;
    clientDisputeReason: string;
    additionalContext?: string;
  }): Promise<{
    analysis: ArbitrationReasoning["analysis"];
    decision: ArbitrationReasoning["decision"];
  }> {
    const prompt = `You are an impartial arbitrator for a freelance contract dispute on PayGuard, an escrow platform on Solana. Your reasoning will be cryptographically committed onchain via SOLPRISM before any funds move — both parties can verify your logic was fair.

Be thorough and fair. Real funds are at stake.

CONTRACT DESCRIPTION:
${params.contractDescription}

MILESTONE BEING DISPUTED:
${params.milestoneDescription}

FREELANCER'S PROOF OF COMPLETION:
${params.freelancerProof}

CLIENT'S DISPUTE REASON:
${params.clientDisputeReason}

${params.additionalContext ? `ADDITIONAL CONTEXT:\n${params.additionalContext}` : ""}

Analyze this dispute carefully. Consider:
1. What were the explicit requirements?
2. What evidence shows the freelancer delivered?
3. What is the client's specific complaint?
4. Is this a communication issue, quality issue, or scope issue?
5. What would a fair resolution look like?

Your reasoning will be permanently recorded onchain and verifiable by both parties.

Respond in JSON format:
{
  "analysis": {
    "requirementsMet": ["list of requirements clearly met"],
    "requirementsPartiallyMet": ["list of requirements partially met with notes"],
    "requirementsNotMet": ["list of requirements not met"],
    "evidenceReviewed": ["list of evidence considered"]
  },
  "decision": {
    "type": "favor_freelancer" | "favor_client" | "split",
    "splitPercentage": <number 0-100, only if type is "split">,
    "reasoning": "<detailed explanation of the decision>",
    "confidence": <number 0-1>
  }
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const content = data.content[0].text;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI arbitration response");
    }

    return JSON.parse(jsonMatch[0]);
  }
}

export default VerifiableArbitrator;
