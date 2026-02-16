# SOLPRISM Integration — Verifiable Arbitration Reasoning

## Overview

PayGuard uses [SOLPRISM](https://www.solprism.app/) to make AI arbitration decisions cryptographically verifiable onchain. Every dispute resolution follows a **commit-reveal** pattern that ensures the AI's reasoning cannot be changed after the fact.

**Program ID:** `CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu`
**Explorer:** [solprism.app](https://www.solprism.app/)

## Why This Matters

PayGuard's AI arbitrator makes binding financial decisions — it decides how escrowed funds are split between clients and freelancers. Without verification, this is a "trust me" system. With SOLPRISM:

- **Before** funds move: the reasoning hash is committed onchain
- **After** resolution: the full reasoning is revealed and linked onchain
- **Anytime**: anyone can verify the reasoning matches the commitment

This creates **accountability for AI-powered dispute resolution**.

## Architecture

```
                         DISPUTE RAISED
                              │
                              ▼
                    ┌──────────────────┐
                    │  AI Arbitrator   │
                    │  (Claude API)    │
                    └────────┬─────────┘
                             │
                    Analyzes evidence,
                    generates reasoning
                             │
                             ▼
              ┌──────────────────────────┐
              │   SOLPRISM: COMMIT       │
              │   Hash(reasoning) →      │
              │   onchain commitment     │
              │   ⚡ Locked before funds  │
              │      move               │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   PayGuard: RESOLVE      │
              │   resolve_dispute()      │
              │   Funds transferred per  │
              │   the committed decision │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   SOLPRISM: REVEAL       │
              │   Full reasoning JSON    │
              │   published & linked     │
              │   onchain                │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   ANYONE: VERIFY         │
              │   Recompute hash from    │
              │   reasoning, compare to  │
              │   onchain commitment     │
              │   ✅ or ❌               │
              └──────────────────────────┘
```

## Quick Start

### Installation

```bash
cd sdk
npm install
# @solprism/sdk is included as a dependency
```

### Basic Usage

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { VerifiableArbitrator } from "@payguard/sdk";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const arbitratorWallet = Keypair.fromSecretKey(/* ... */);

// Initialize the SOLPRISM-powered arbitrator
const arbitrator = new VerifiableArbitrator({
  connection,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  agentName: "payguard-arbitrator",
});

// One-time: register agent on SOLPRISM
await arbitrator.register(arbitratorWallet);
```

### Commit-Resolve-Reveal Flow

```typescript
// Step 1: AI analyzes dispute + commits reasoning hash onchain
const result = await arbitrator.analyzeAndCommit(arbitratorWallet, {
  contractId: "contract-12345",
  milestoneIndex: 1,
  contractDescription: "Build a Solana DEX frontend",
  milestoneDescription: "Implement swap interface with limit orders",
  freelancerProof: "Delivered swap UI with market orders, responsive design...",
  clientDisputeReason: "Limit order feature is completely missing",
});

console.log(result.hash);              // SHA-256 of the reasoning
console.log(result.commitmentAddress); // SOLPRISM PDA
console.log(result.commitTx);         // Solana transaction signature
console.log(result.reasoning);        // Full AI analysis

// Step 2: Execute resolution on PayGuard
const onChainData = formatForOnChain(result);
// → { decisionType: 2, splitPercentage: 60, reasoningHash: [...], solprismCommitment: "..." }
// Call PayGuard's resolve_dispute instruction with this data

// Step 3: Reveal full reasoning onchain
const reveal = await arbitrator.reveal(
  arbitratorWallet,
  result,
  "ipfs://QmXyz...full-reasoning-json"
);

// Step 4: Anyone can verify
const verification = await arbitrator.verify(
  result.commitmentAddress,
  result.reasoning
);
console.log(verification.message);
// ✅ Arbitration reasoning verified — matches the onchain SOLPRISM commitment
console.log(verification.explorerUrl);
// https://www.solprism.app/commitment/...
```

## API Reference

### `VerifiableArbitrator`

The main class that wraps PayGuard's AI arbitration with SOLPRISM commit-reveal reasoning.

#### Constructor

```typescript
new VerifiableArbitrator(config: SolprismArbitrationConfig)
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `connection` | `Connection` | ✅ | Solana RPC connection |
| `anthropicApiKey` | `string` | ✅ | API key for Claude |
| `agentName` | `string` | | Agent name on SOLPRISM (default: `"payguard-arbitrator"`) |
| `model` | `string` | | Claude model (default: `"claude-3-5-sonnet-20241022"`) |
| `programId` | `PublicKey` | | SOLPRISM program ID (default: mainnet/devnet) |
| `reasoningStorageUri` | `string` | | Base URI for reasoning storage (IPFS, Arweave) |

#### Methods

##### `register(wallet: Keypair): Promise<string>`

Register the arbitrator agent on SOLPRISM. One-time setup that creates an onchain profile tracking commitment history and accountability score.

##### `analyzeAndCommit(wallet, params): Promise<CommitResult>`

Analyze a dispute with AI and commit the reasoning hash onchain BEFORE resolution. This is the core trust guarantee.

**Parameters:**

| Field | Type | Description |
|---|---|---|
| `contractId` | `string` | PayGuard contract identifier |
| `milestoneIndex` | `number` | Which milestone is disputed |
| `contractDescription` | `string` | Full contract description |
| `milestoneDescription` | `string` | What the milestone required |
| `freelancerProof` | `string` | Freelancer's evidence of delivery |
| `clientDisputeReason` | `string` | Client's reason for disputing |
| `additionalContext` | `string?` | Optional extra context |

**Returns:** `CommitResult` with `hash`, `commitTx`, `commitmentAddress`, `slot`, and `reasoning`.

##### `reveal(wallet, commitResult, reasoningUri): Promise<RevealResult>`

Reveal the full reasoning onchain after the dispute has been resolved.

##### `verify(commitmentAddress, reasoning): Promise<VerifyResult>`

Verify that reasoning matches its onchain commitment. Can be called by anyone — no wallet needed for read-only verification.

##### `getAccountability(authority): Promise<number | null>`

Get the arbitrator's onchain accountability score (0–100%). Higher scores indicate consistent commit-reveal behavior.

##### `getCommitmentHistory(authority, limit?): Promise<OnChainCommitment[]>`

Retrieve all past arbitration commitments for an arbitrator.

### Helper Functions

##### `hashReasoning(reasoning: ArbitrationReasoning): string`

Compute a deterministic SHA-256 hash of arbitration reasoning. Keys are sorted for canonical representation.

##### `formatForOnChain(result: CommitResult): object`

Convert a `CommitResult` into the format expected by PayGuard's `resolve_dispute` instruction.

## What Gets Committed Onchain

The SOLPRISM commitment contains:

| Field | Description |
|---|---|
| `commitment_hash` | SHA-256 of the full reasoning trace |
| `action_type` | `"arbitration"` |
| `confidence` | AI's confidence in the decision (0–100) |
| `timestamp` | When the commitment was made |
| `agent` | PDA of the arbitrator's SOLPRISM profile |
| `revealed` | Whether the reasoning has been revealed |
| `reasoning_uri` | URI to the full reasoning (after reveal) |

The full reasoning trace includes:
- Contract and milestone details
- Evidence reviewed (freelancer proof, client complaint)
- Analysis (requirements met/unmet/partially met)
- Decision (favor freelancer, favor client, or split with percentage)
- Confidence score and detailed rationale

## Security Properties

### Commit-Before-Execute Guarantee

The reasoning hash is committed onchain **before** `resolve_dispute` is called. This means:

1. The arbitrator cannot see the resolution outcome and then fabricate reasoning to match
2. The reasoning was locked in at a specific Solana slot with a timestamp
3. Anyone can verify the reasoning was committed before the fund transfer

### Tamper Evidence

If anyone tries to change the reasoning after commitment:
- The hash won't match → `verify()` returns `valid: false`
- The onchain commitment is immutable (can only be revealed, not modified)
- Both the original commitment and the reveal are separate, verifiable transactions

### Accountability Score

SOLPRISM tracks each arbitrator's commit-reveal ratio:
- Committing and revealing = accountability goes up
- Committing without revealing = accountability goes down
- Score is publicly visible at `https://www.solprism.app/agent/{address}`

## Integration with PayGuard's Dispute Flow

### Before SOLPRISM (existing flow)

```
Dispute raised → AI decides → resolve_dispute() → funds move → reasoning stored as hash
                                                                (no way to verify)
```

### With SOLPRISM

```
Dispute raised → AI decides → SOLPRISM commit → resolve_dispute() → SOLPRISM reveal → verify ✅
                              (hash locked)     (funds move)        (reasoning public)
```

The `arbitration_proof` field in PayGuard's `Milestone` struct now contains the SOLPRISM commitment hash, linking the two protocols.

## Running the Example

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run the demo
npx ts-node examples/solprism-arbitration.ts
```

See [`examples/solprism-arbitration.ts`](../examples/solprism-arbitration.ts) for the full walkthrough.

## Explorer Links

- **SOLPRISM Explorer:** [https://www.solprism.app/](https://www.solprism.app/)
- **View a commitment:** `https://www.solprism.app/commitment/{address}`
- **View an agent profile:** `https://www.solprism.app/agent/{address}`
- **Program on Solscan:** [CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu](https://solscan.io/account/CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu)
