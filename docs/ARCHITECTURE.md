# PayGuard Architecture

## Overview

PayGuard is a trustless escrow system for freelance work with AI-powered dispute resolution. It consists of three main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PayGuard System                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Anchor    │    │  TypeScript │    │      Next.js        │ │
│  │   Program   │◄──►│     SDK     │◄──►│      Frontend       │ │
│  │  (On-chain) │    │ (Off-chain) │    │    (User-facing)    │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│         ▲                  ▲                     ▲              │
│         │                  │                     │              │
│         ▼                  ▼                     ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Solana    │    │     AI      │    │   Wallet Adapter    │ │
│  │  Blockchain │    │ Arbitrator  │    │ (Phantom, Solflare) │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Smart Contract (Anchor Program)

### State Accounts

```rust
Contract {
    id: u64,                    // Unique contract identifier
    client: Pubkey,             // Who pays
    freelancer: Pubkey,         // Who delivers
    token_mint: Pubkey,         // Payment token (USDC)
    total_amount: u64,          // Total contract value
    released_amount: u64,       // Amount paid out so far
    milestones: Vec<Milestone>, // Up to 10 milestones
    description_hash: [u8; 32], // SHA256 of contract details
    status: ContractStatus,     // Active/Completed/Cancelled/Disputed
    created_at: i64,            // Unix timestamp
    bump: u8,                   // PDA bump seed
}

Milestone {
    amount: u64,                      // Payment for this milestone
    description: String,              // What needs to be delivered
    status: MilestoneStatus,          // Pending/Submitted/Approved/etc
    proof_hash: Option<[u8; 32]>,     // Hash of deliverable proof
    dispute_reason: Option<[u8; 32]>, // Hash of dispute reason
    arbitration_proof: Option<[u8; 32]>, // Hash of AI decision
    submitted_at: Option<i64>,        // When freelancer submitted
}
```

### Instructions

| Instruction | Who Can Call | Description |
|-------------|--------------|-------------|
| `create_contract` | Client | Initialize contract with milestones |
| `fund_escrow` | Client | Deposit tokens into escrow PDA |
| `submit_milestone` | Freelancer | Mark milestone as complete with proof |
| `approve_milestone` | Client | Release funds for completed milestone |
| `raise_dispute` | Client/Freelancer | Flag milestone for arbitration |
| `resolve_dispute` | Arbitrator | Execute AI decision on-chain |
| `cancel_contract` | Client | Refund remaining escrow balance |

### PDA Structure

```
Contract PDA: ["contract", contract_id.to_le_bytes()]
```

Escrow vault is a token account owned by the Contract PDA, enabling trustless custody.

## Flow Diagrams

### Happy Path (No Disputes)

```
Client                    Escrow                   Freelancer
   │                         │                         │
   │──create_contract───────►│                         │
   │──fund_escrow───────────►│                         │
   │                         │                         │
   │                         │◄──submit_milestone──────│
   │                         │                         │
   │──approve_milestone─────►│──────transfer───────────►│
   │                         │                         │
   │                         │◄──submit_milestone──────│
   │──approve_milestone─────►│──────transfer───────────►│
   │                         │                         │
   ▼                         ▼                         ▼
         Contract marked COMPLETED
```

### Dispute Flow

```
Client          Escrow          AI Arbitrator       Freelancer
   │               │                   │                 │
   │               │◄──submit_milestone─────────────────│
   │               │                   │                 │
   │──raise_dispute►│                   │                 │
   │               │──request_ruling───►│                 │
   │               │                   │                 │
   │               │                   │──analyze────────►│
   │               │                   │◄──evidence──────│
   │               │                   │                 │
   │               │◄──resolve_dispute─│                 │
   │               │                   │                 │
   │               │──split_funds─────────────────────────►│
   │◄──refund──────│                   │                 │
   │               │                   │                 │
```

## AI Arbitrator

The AI Arbitrator is an off-chain component that:

1. **Receives dispute context**: Contract description, milestone requirements, deliverable proof, dispute reason
2. **Analyzes evidence**: Uses Claude to evaluate if work meets requirements
3. **Generates decision**: Returns one of:
   - `FavorFreelancer` → Release full milestone to freelancer
   - `FavorClient` → Keep funds in escrow / allow refund
   - `Split(percentage)` → Divide funds proportionally
4. **Creates proof**: Hashes the reasoning for on-chain storage

### Arbitration Prompt Template

```
You are an impartial arbitrator for a freelance contract dispute.

CONTRACT: {contract_description}
MILESTONE: {milestone_description}
PROOF: {deliverable_proof}
DISPUTE: {dispute_reason}

Determine:
1. Was the milestone satisfactorily completed?
2. If partial completion, what percentage should be paid?

Respond with: {decision, percentage?, reasoning, confidence}
```

## Security Considerations

### On-Chain Security

- **PDA custody**: Funds held by program-derived address, not any individual
- **Signature verification**: Only authorized parties can call each instruction
- **Amount validation**: Milestone amounts must equal total contract value
- **Status checks**: Instructions validate current contract/milestone status

### Off-Chain Security

- **Hash commitments**: Contract descriptions, proofs, and decisions stored as hashes
- **Arbitrator authorization**: Only designated arbitrator can resolve disputes
- **Audit trail**: All state changes emit events for transparency

### Trust Assumptions

1. Client and freelancer trust the AI arbitrator to make fair decisions
2. Off-chain evidence (deliverables, proofs) must be preserved by parties
3. Arbitrator key is held by PayGuard service (future: decentralized arbitration)

## Integration Points

### For Other Agents

```typescript
import { PayGuardClient } from "@payguard/sdk";

const client = new PayGuardClient(provider, PROGRAM_ID);

// Create escrow contract
await client.createContract({
  freelancer: freelancerPubkey,
  tokenMint: USDC_MINT,
  totalAmount: 1000_000_000, // 1000 USDC
  milestones: [
    { amount: 500_000_000, description: "Phase 1" },
    { amount: 500_000_000, description: "Phase 2" },
  ],
  description: "Build a trading bot",
});
```

### Webhook Events (Planned)

- `contract.created`
- `contract.funded`
- `milestone.submitted`
- `milestone.approved`
- `dispute.raised`
- `dispute.resolved`
- `contract.completed`
- `contract.cancelled`

## Future Enhancements

1. **Decentralized Arbitration**: Multiple AI agents vote on disputes
2. **Reputation System**: On-chain track record for clients and freelancers
3. **Recurring Contracts**: Subscription-style payments
4. **Multi-token Support**: Accept any SPL token via Jupiter swap
5. **Cross-chain**: Bridge to other chains for broader reach
