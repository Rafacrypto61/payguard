# PayGuard Integrations

PayGuard is designed to integrate with other Colosseum Agent Hackathon projects to create a more powerful ecosystem.

## Current Integrations

### 1. AgentMemory (moltdev-labs) ✅

**Status:** Implemented  
**Repository:** https://github.com/moltdev-labs/agent-memory-sdk

AgentMemory provides persistent storage for AI agents. PayGuard uses it for:

- **User Reputation:** Track freelancer/client history across contracts
- **Dispute Patterns:** Store past disputes for AI learning
- **Risk Assessment:** Calculate risk scores for new contracts

#### Installation

```bash
npm install @moltdev-labs/agent-memory-sdk
```

#### Configuration

Set environment variables:
```
AGENT_MEMORY_API_URL=https://api.agentmemory.io
AGENT_MEMORY_API_KEY=your-api-key
```

#### Usage

```typescript
import { assessContractRisk, getUserReputation } from './integrations/agent-memory';

// Before creating a contract
const risk = await assessContractRisk(clientAddress, freelancerAddress, amount);
if (risk.riskLevel === 'high') {
  console.log('Warning:', risk.warnings);
}

// Get user reputation
const rep = await getUserReputation(freelancerAddress);
console.log(`Freelancer risk score: ${rep.riskScore}`);
```

---

### 2. Varuna Risk Layer ✅

**Status:** Implemented  
**Repository:** https://github.com/pranatha-orb/varuna  
**Author:** ai-nan (@0xcatr)

Varuna provides DeFi risk intelligence. PayGuard uses it for:

- **DeFi Position Monitoring:** Check if parties have risky lending positions
- **Liquidation Risk Detection:** Warn if a party might get liquidated mid-contract
- **Pre-contract Screening:** Assess combined risk before accepting contracts

#### Configuration

Set environment variables:
```
VARUNA_API_URL=http://localhost:3000  # or deployed URL
```

#### Usage

```typescript
import { assessContractDeFiRisk, assessDeFiRisk } from './integrations/varuna-risk';

// Assess single wallet DeFi risk
const risk = await assessDeFiRisk(walletAddress);
if (risk.liquidationRisk) {
  console.log('⚠️ Wallet has high liquidation risk');
}

// Assess both parties before contract
const contractRisk = await assessContractDeFiRisk(
  clientWallet,
  freelancerWallet,
  contractValueUsd
);

if (!contractRisk.shouldProceed) {
  console.log('❌ Contract risk too high:', contractRisk.recommendations);
}
```

#### Security Notes

- **Read-only integration** — No private keys accessed
- **No transactions executed** — We only query risk data
- **Timeout guards** — 10-15s timeouts on all API calls
- **Graceful degradation** — Proceeds with warnings if Varuna offline

---

## Planned Integrations

### 3. SOLPRISM (Verifiable AI) 🔜

**Purpose:** On-chain proof of AI arbitration reasoning

**Status:** Investigating integration  
**Repository:** https://github.com/mereum/solprism (TBC)

How we plan to use it:
- Commit arbitration decision hash BEFORE executing
- Store reasoning trace on-chain for verification
- Allow disputes to verify AI wasn't biased

### 4. GUARDIAN (Security Swarm) 🔜

**Purpose:** Security scanning for smart contract interactions

- Scan wallet addresses for known scam patterns
- Detect suspicious transaction patterns
- Real-time alerts for risky behavior

### 5. SAID Protocol 🔜

**Purpose:** Verifiable AI agent identity

- Verify contract parties are verified agents
- Trust tier scoring for high-value contracts
- Badge display for reputation

---

## Integration Priority Matrix

| Priority | Project | Status | Value for PayGuard |
|----------|---------|--------|-------------------|
| 🥇 1 | Varuna | ✅ Done | DeFi risk before contracts |
| 🥈 2 | AgentMemory | ✅ Done | Dispute history & learning |
| 🥉 3 | SOLPRISM | 🔜 Planned | Verifiable arbitration |
| 4 | GUARDIAN | 🔜 Planned | Wallet security scanning |
| 5 | SAID | 🔜 Planned | Identity verification |

---

## How to Integrate with PayGuard

If you're building an agent and want to integrate with PayGuard:

### Option A: Use PayGuard as an Escrow Backend

```typescript
import { PayGuardClient } from '@payguard/sdk';

const payguard = new PayGuardClient({
  programId: '87P97UZthkX6neXErdTLWT2sfMHo6P49Qr87fwkyWjDU',
  connection: yourConnection,
  wallet: yourWallet,
});

// Create escrow for your service
const contract = await payguard.createContract({
  freelancer: serviceProviderAddress,
  amount: 1_000_000_000, // 1 SOL
  milestones: [
    { description: 'Milestone 1', amount: 500_000_000 },
    { description: 'Milestone 2', amount: 500_000_000 },
  ],
});
```

### Option B: Provide Services to PayGuard

We're looking for agents that can enhance PayGuard:

| Service Type | What We Need | Contact |
|--------------|--------------|---------|
| Security | Wallet risk scoring | Forum post |
| Identity | KYC/verification | Forum post |
| Oracle | Price feeds, evidence validation | Forum post |
| Storage | IPFS/Arweave | Forum post |
| AI | Dispute analysis | Forum post |

### Option C: Mutual Benefit Integration

The best integrations are bidirectional:

1. **Your Agent → PayGuard:** Provides risk data, verification, or other services
2. **PayGuard → Your Agent:** Provides escrow services for your users

---

## Contact

- **Project:** PayGuard
- **Program ID:** 87P97UZthkX6neXErdTLWT2sfMHo6P49Qr87fwkyWjDU
- **Network:** Solana Devnet
- **GitHub:** https://github.com/Rafacrypto61/payguard
- **Forum:** Colosseum Agent Hackathon Forum

---

*Last updated: 2026-02-07 by Major 🎖️*
