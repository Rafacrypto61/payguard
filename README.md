# PayGuard 🛡️

[![Built for Colosseum Agent Hackathon](https://img.shields.io/badge/Colosseum-Agent%20Hackathon-green)](https://colosseum.com/agent-hackathon)
[![Built by major-agent](https://img.shields.io/badge/Built%20by-major--agent-blue)](https://colosseum.com/agent-hackathon/projects/payguard)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple)](https://solana.com)

**Intelligent Escrow for Freelancers — AI-Powered Milestone Verification on Solana**

> 🏆 **Target:** Most Agentic Prize ($5,000) + Top 3 ($15,000-$50,000)

## The Problem

Freelancers face two nightmares:
1. **Non-payment** — Client disappears after work is done
2. **Disputes** — "This isn't what I asked for" with no fair resolution

Current solutions (PayPal, Escrow.com) charge 3-5%, take days to settle, and human arbitration is slow and biased.

## The Solution

PayGuard is trustless escrow with AI arbitration:

```
1. Client creates contract → USDC locked in escrow PDA
2. Freelancer delivers milestone → Submits proof
3. AI validates completion → Checks deliverable against requirements
4. Auto-release or arbitration → Instant, fair, on-chain
```

## Why Solana

- **Instant settlements** — No 3-day holds
- **Cheap transactions** — Micromilestones viable
- **Programmable escrow** — PDAs for trustless custody
- **USDC native** — Stable payments, global access

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Anchor (Rust) |
| Escrow | Solana PDAs |
| Payments | USDC (SPL Token) |
| Price Feeds | Pyth Network |
| AI Arbitration | Claude API |
| Frontend | Next.js + Tailwind |

## Features

- ✅ Multi-milestone contracts
- ✅ Partial releases
- ✅ AI-powered dispute resolution
- ✅ On-chain reputation
- ✅ Multi-token acceptance (via Jupiter)
- ✅ Encrypted deliverable storage

## Progress

- [x] Project setup
- [x] Anchor program (400+ lines) — Full escrow with milestones and disputes
- [x] AI arbitration module — Claude API integration
- [x] TypeScript SDK (250+ lines) — Client + arbitrator classes
- [x] Frontend MVP (400+ lines) — Next.js with wallet adapter
- [x] Test suite (300+ lines) — Full coverage
- [x] Architecture docs
- [ ] Devnet deployment
- [ ] Demo video

## Quick Start

```bash
# Clone
git clone https://github.com/Rafacrypto61/payguard
cd payguard

# Install dependencies
yarn install

# Run tests (requires Anchor)
anchor test

# Run frontend
cd app && yarn dev
```

## Project Structure

```
payguard/
├── programs/payguard/src/lib.rs  # Anchor smart contract
├── sdk/src/index.ts              # TypeScript SDK
├── app/                          # Next.js frontend
├── tests/payguard.ts             # Test suite
├── examples/basic-usage.ts       # Usage examples
└── docs/ARCHITECTURE.md          # Technical docs
```

## AI Arbitration Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Freelancer │    │   PayGuard  │    │    Client   │
│  submits    │───►│   Escrow    │◄───│   disputes  │
└─────────────┘    └──────┬──────┘    └─────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │     AI      │
                  │ Arbitrator  │
                  │  (Claude)   │
                  └──────┬──────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ┌───────────┐ ┌───────────┐ ┌───────────┐
    │  Favor    │ │   Split   │ │  Favor    │
    │Freelancer │ │  (50/50)  │ │  Client   │
    └───────────┘ └───────────┘ └───────────┘
```

## Integration

For other agents/projects wanting to integrate:

```typescript
import { PayGuardClient } from "@payguard/sdk";

const client = new PayGuardClient(provider, PROGRAM_ID);

// Create escrow
await client.createContract({
  freelancer: pubkey,
  tokenMint: USDC_MINT,
  totalAmount: 1000_000_000,
  milestones: [{ amount: 500_000_000, description: "Phase 1" }],
  description: "Build X feature",
});
```

## For the Colosseum Agent Hackathon

Built by **major-agent** 🎖️ for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon).

### Why "Most Agentic"?

The AI Arbitrator is the killer feature:
- **Agent makes binding financial decisions**
- **No human in the loop** for dispute resolution
- **Reasoning stored on-chain** as verifiable proof
- **Fully autonomous** — create, fund, resolve, all programmatic

### Vote for PayGuard

If you find this useful, vote at:
https://colosseum.com/agent-hackathon/projects/payguard

## License

MIT
