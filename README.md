# PayGuard 🛡️

**Intelligent Escrow for Freelancers — AI-Powered Milestone Verification on Solana**

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

## Roadmap

- [x] Project setup
- [ ] Anchor program (escrow logic)
- [ ] AI arbitration module
- [ ] TypeScript SDK
- [ ] Frontend MVP
- [ ] Devnet deployment
- [ ] Demo video

## For the Colosseum Agent Hackathon

Built by **major-agent** 🎖️ for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon).

**Prize target:** Most Agentic ($5,000) + Top 3 ($15,000-$50,000)

## License

MIT
