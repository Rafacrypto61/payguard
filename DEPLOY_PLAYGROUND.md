# Deploy PayGuard no Solana Playground

## Passo a Passo

### 1. Acesse o Playground
👉 https://beta.solpg.io

### 2. Criar Novo Projeto
- Clique em **"Create a new project"**
- Nome: `payguard`
- Framework: **Anchor**

### 3. Copiar o Código

Substitua o conteúdo de `src/lib.rs` pelo código abaixo:

```rust
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod payguard {
    use super::*;

    pub fn create_contract(
        ctx: Context<CreateContract>,
        contract_id: u64,
        total_amount: u64,
        milestone_amounts: Vec<u64>,
        milestone_descriptions: Vec<String>,
        description_hash: [u8; 32],
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        
        require!(milestone_amounts.len() > 0 && milestone_amounts.len() <= 10, PayGuardError::InvalidMilestones);
        require!(milestone_amounts.len() == milestone_descriptions.len(), PayGuardError::InvalidMilestones);
        
        let total: u64 = milestone_amounts.iter().sum();
        require!(total == total_amount, PayGuardError::AmountMismatch);
        
        contract.id = contract_id;
        contract.client = ctx.accounts.client.key();
        contract.freelancer = ctx.accounts.freelancer.key();
        contract.arbitrator = ctx.accounts.arbitrator.key();
        contract.total_amount = total_amount;
        contract.released_amount = 0;
        contract.description_hash = description_hash;
        contract.status = ContractStatus::Active;
        contract.created_at = Clock::get()?.unix_timestamp;
        contract.bump = ctx.bumps.contract;
        contract.milestone_count = milestone_amounts.len() as u8;
        
        // Store milestone data
        for (i, (amount, desc)) in milestone_amounts.iter().zip(milestone_descriptions.iter()).enumerate() {
            contract.milestone_amounts[i] = *amount;
            contract.milestone_statuses[i] = MilestoneStatus::Pending;
        }
        
        msg!("Contract {} created! Total: {} lamports", contract_id, total_amount);
        Ok(())
    }

    pub fn submit_milestone(ctx: Context<SubmitMilestone>, milestone_index: u8) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, PayGuardError::ContractNotActive);
        require!((milestone_index as usize) < contract.milestone_count as usize, PayGuardError::InvalidMilestoneIndex);
        require!(contract.milestone_statuses[milestone_index as usize] == MilestoneStatus::Pending, PayGuardError::MilestoneNotPending);
        
        contract.milestone_statuses[milestone_index as usize] = MilestoneStatus::Submitted;
        msg!("Milestone {} submitted!", milestone_index);
        Ok(())
    }

    pub fn approve_milestone(ctx: Context<ApproveMilestone>, milestone_index: u8) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, PayGuardError::ContractNotActive);
        require!((milestone_index as usize) < contract.milestone_count as usize, PayGuardError::InvalidMilestoneIndex);
        require!(contract.milestone_statuses[milestone_index as usize] == MilestoneStatus::Submitted, PayGuardError::MilestoneNotSubmitted);
        
        let amount = contract.milestone_amounts[milestone_index as usize];
        contract.milestone_statuses[milestone_index as usize] = MilestoneStatus::Approved;
        contract.released_amount += amount;
        
        // Transfer SOL from escrow to freelancer
        **ctx.accounts.contract.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += amount;
        
        msg!("Milestone {} approved! Released {} lamports", milestone_index, amount);
        
        if contract.released_amount == contract.total_amount {
            contract.status = ContractStatus::Completed;
            msg!("Contract completed!");
        }
        
        Ok(())
    }

    pub fn raise_dispute(ctx: Context<RaiseDispute>, milestone_index: u8) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, PayGuardError::ContractNotActive);
        require!(contract.milestone_statuses[milestone_index as usize] == MilestoneStatus::Submitted, PayGuardError::MilestoneNotSubmitted);
        
        contract.milestone_statuses[milestone_index as usize] = MilestoneStatus::Disputed;
        msg!("Dispute raised on milestone {}", milestone_index);
        Ok(())
    }

    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        milestone_index: u8,
        favor_freelancer: bool,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.milestone_statuses[milestone_index as usize] == MilestoneStatus::Disputed, PayGuardError::MilestoneNotDisputed);
        
        let amount = contract.milestone_amounts[milestone_index as usize];
        
        if favor_freelancer {
            contract.milestone_statuses[milestone_index as usize] = MilestoneStatus::Approved;
            contract.released_amount += amount;
            
            **ctx.accounts.contract.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += amount;
            msg!("Dispute resolved in favor of freelancer");
        } else {
            contract.milestone_statuses[milestone_index as usize] = MilestoneStatus::Rejected;
            msg!("Dispute resolved in favor of client");
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(contract_id: u64)]
pub struct CreateContract<'info> {
    #[account(
        init,
        payer = client,
        space = 8 + Contract::INIT_SPACE,
        seeds = [b"contract", &contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    
    #[account(mut)]
    pub client: Signer<'info>,
    
    /// CHECK: Freelancer address
    pub freelancer: AccountInfo<'info>,
    
    /// CHECK: Arbitrator address  
    pub arbitrator: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitMilestone<'info> {
    #[account(mut, has_one = freelancer)]
    pub contract: Account<'info, Contract>,
    pub freelancer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveMilestone<'info> {
    #[account(mut, has_one = client, has_one = freelancer)]
    pub contract: Account<'info, Contract>,
    pub client: Signer<'info>,
    /// CHECK: Validated by contract
    #[account(mut)]
    pub freelancer: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut, has_one = arbitrator, has_one = freelancer)]
    pub contract: Account<'info, Contract>,
    pub arbitrator: Signer<'info>,
    /// CHECK: Validated by contract
    #[account(mut)]
    pub freelancer: AccountInfo<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Contract {
    pub id: u64,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub arbitrator: Pubkey,
    pub total_amount: u64,
    pub released_amount: u64,
    pub description_hash: [u8; 32],
    pub status: ContractStatus,
    pub created_at: i64,
    pub bump: u8,
    pub milestone_count: u8,
    #[max_len(10)]
    pub milestone_amounts: [u64; 10],
    #[max_len(10)]
    pub milestone_statuses: [MilestoneStatus; 10],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Default)]
pub enum ContractStatus {
    #[default]
    Active,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Default)]
pub enum MilestoneStatus {
    #[default]
    Pending,
    Submitted,
    Approved,
    Rejected,
    Disputed,
}

#[error_code]
pub enum PayGuardError {
    #[msg("Invalid milestones")]
    InvalidMilestones,
    #[msg("Amount mismatch")]
    AmountMismatch,
    #[msg("Contract not active")]
    ContractNotActive,
    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,
    #[msg("Milestone not pending")]
    MilestoneNotPending,
    #[msg("Milestone not submitted")]
    MilestoneNotSubmitted,
    #[msg("Milestone not disputed")]
    MilestoneNotDisputed,
}
```

### 4. Build
- Clique em **"Build"** (martelo 🔨)
- Aguarde compilar (~30s)

### 5. Deploy
- Clique em **"Deploy"**
- Selecione **Devnet**
- Confirme a transação

### 6. Testar
No painel "Test", você pode testar as instruções:

**Criar Contrato:**
```
create_contract:
  contract_id: 1
  total_amount: 1000000000 (1 SOL em lamports)
  milestone_amounts: [500000000, 500000000]
  milestone_descriptions: ["Design", "Development"]
  description_hash: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
```

### 7. Pegar o Program ID
Após deploy, copie o **Program ID** gerado. Você vai precisar dele para:
- Atualizar o frontend
- Integrar com o SDK

---

## Próximos Passos

1. ✅ Deploy no Devnet
2. Copiar Program ID
3. Atualizar `sdk/src/index.ts` com o novo ID
4. Atualizar frontend para usar SDK real

---

*PayGuard - Escrow Trustless para Freelancers*
