# PayGuard Security

## Security Measures Implemented

### Smart Contract (Anchor/Solana)

1. **Arbitrator Authorization**
   - Only the designated arbitrator can resolve disputes
   - Arbitrator is set at contract creation and stored on-chain
   - Constraint validation prevents unauthorized calls to `resolve_dispute`

2. **Access Control**
   - `has_one` constraints ensure only authorized parties can call functions
   - Client-only: `approve_milestone`, `cancel_contract`, `fund_escrow`
   - Freelancer-only: `submit_milestone`
   - Either party: `raise_dispute`
   - Arbitrator-only: `resolve_dispute`

3. **State Validation**
   - All functions check contract status before execution
   - Milestone status transitions are enforced
   - Amount calculations are validated

4. **PDA Security**
   - Contract accounts are PDAs derived from contract_id
   - Prevents account substitution attacks

### SDK/TypeScript

1. **No Hardcoded Secrets**
   - API keys are passed as parameters, never stored in code
   - Uses environment variables for configuration

2. **Input Validation**
   - All user inputs are validated before on-chain submission
   - Hash functions use SHA-256 for integrity

3. **Verifiable Arbitration**
   - Reasoning is hashed before decision execution
   - Hash is stored on-chain for audit trail
   - SOLPRISM integration for cryptographic proofs

## Environment Variables

Required environment variables (NEVER commit these):

```
ANTHROPIC_API_KEY=<your-key>      # For AI arbitration
SOLANA_RPC_URL=<rpc-url>          # Solana connection
WALLET_PRIVATE_KEY=<key>          # Only for testing
```

## Reporting Vulnerabilities

If you discover a security vulnerability, please:
1. DO NOT open a public issue
2. Email: security@payguard.dev (or DM on Discord)
3. Include detailed steps to reproduce
4. Allow 48h for initial response

## Audit Status

- [ ] Internal security review: Complete
- [ ] External audit: Pending
- [ ] Bug bounty program: Coming soon

## Known Limitations

1. **Arbitrator Trust**: The system relies on a trusted arbitrator. In v2, this will be a multi-sig or DAO.
2. **AI Decisions**: While verifiable, AI decisions are only as good as the input data.
3. **Gas Costs**: Multi-agent escrows may have high transaction costs.

## Best Practices for Users

1. Always verify the arbitrator address before creating contracts
2. Use hardware wallets for large escrows
3. Review contract terms carefully before funding
4. Keep proof of deliverables off-chain with hashes on-chain
