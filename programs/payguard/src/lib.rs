use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("PayGUARD1111111111111111111111111111111111111");

#[program]
pub mod payguard {
    use super::*;

    /// Create a new escrow contract between client and freelancer
    pub fn create_contract(
        ctx: Context<CreateContract>,
        contract_id: u64,
        total_amount: u64,
        milestones: Vec<Milestone>,
        description_hash: [u8; 32],
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        
        require!(milestones.len() > 0 && milestones.len() <= 10, PayGuardError::InvalidMilestones);
        
        let total_milestone_amount: u64 = milestones.iter().map(|m| m.amount).sum();
        require!(total_milestone_amount == total_amount, PayGuardError::AmountMismatch);
        
        contract.id = contract_id;
        contract.client = ctx.accounts.client.key();
        contract.freelancer = ctx.accounts.freelancer.key();
        contract.token_mint = ctx.accounts.token_mint.key();
        contract.total_amount = total_amount;
        contract.released_amount = 0;
        contract.milestones = milestones;
        contract.description_hash = description_hash;
        contract.status = ContractStatus::Active;
        contract.created_at = Clock::get()?.unix_timestamp;
        contract.bump = ctx.bumps.contract;
        
        Ok(())
    }

    /// Fund the escrow with tokens
    pub fn fund_escrow(ctx: Context<FundEscrow>, amount: u64) -> Result<()> {
        let contract = &ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, PayGuardError::ContractNotActive);
        require!(amount == contract.total_amount, PayGuardError::AmountMismatch);
        
        // Transfer tokens from client to escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        Ok(())
    }

    /// Submit milestone completion (freelancer)
    pub fn submit_milestone(
        ctx: Context<SubmitMilestone>,
        milestone_index: u8,
        proof_hash: [u8; 32],
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, PayGuardError::ContractNotActive);
        require!((milestone_index as usize) < contract.milestones.len(), PayGuardError::InvalidMilestoneIndex);
        
        let milestone = &mut contract.milestones[milestone_index as usize];
        require!(milestone.status == MilestoneStatus::Pending, PayGuardError::MilestoneNotPending);
        
        milestone.status = MilestoneStatus::Submitted;
        milestone.proof_hash = Some(proof_hash);
        milestone.submitted_at = Some(Clock::get()?.unix_timestamp);
        
        Ok(())
    }

    /// Approve milestone and release funds (client)
    pub fn approve_milestone(ctx: Context<ApproveMilestone>, milestone_index: u8) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, PayGuardError::ContractNotActive);
        require!((milestone_index as usize) < contract.milestones.len(), PayGuardError::InvalidMilestoneIndex);
        
        let milestone = &mut contract.milestones[milestone_index as usize];
        require!(milestone.status == MilestoneStatus::Submitted, PayGuardError::MilestoneNotSubmitted);
        
        let amount = milestone.amount;
        milestone.status = MilestoneStatus::Approved;
        contract.released_amount += amount;
        
        // Transfer from escrow to freelancer
        let seeds = &[
            b"contract",
            &contract.id.to_le_bytes(),
            &[contract.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.freelancer_token_account.to_account_info(),
            authority: ctx.accounts.contract.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;
        
        // Check if all milestones completed
        if contract.released_amount == contract.total_amount {
            contract.status = ContractStatus::Completed;
        }
        
        Ok(())
    }

    /// Raise dispute on a milestone
    pub fn raise_dispute(
        ctx: Context<RaiseDispute>,
        milestone_index: u8,
        reason_hash: [u8; 32],
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, PayGuardError::ContractNotActive);
        
        let milestone = &mut contract.milestones[milestone_index as usize];
        require!(milestone.status == MilestoneStatus::Submitted, PayGuardError::MilestoneNotSubmitted);
        
        milestone.status = MilestoneStatus::Disputed;
        milestone.dispute_reason = Some(reason_hash);
        
        Ok(())
    }

    /// Resolve dispute with AI arbitration result (oracle/authority)
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        milestone_index: u8,
        decision: DisputeDecision,
        arbitration_proof: [u8; 32],
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let milestone = &mut contract.milestones[milestone_index as usize];
        require!(milestone.status == MilestoneStatus::Disputed, PayGuardError::MilestoneNotDisputed);
        
        milestone.arbitration_proof = Some(arbitration_proof);
        
        match decision {
            DisputeDecision::FavorFreelancer => {
                milestone.status = MilestoneStatus::Approved;
                contract.released_amount += milestone.amount;
                
                // Release to freelancer
                let seeds = &[
                    b"contract",
                    &contract.id.to_le_bytes(),
                    &[contract.bump],
                ];
                let signer = &[&seeds[..]];
                
                let cpi_accounts = Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.freelancer_token_account.to_account_info(),
                    authority: ctx.accounts.contract.to_account_info(),
                };
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer
                );
                token::transfer(cpi_ctx, milestone.amount)?;
            }
            DisputeDecision::FavorClient => {
                milestone.status = MilestoneStatus::Rejected;
                // Funds stay in escrow for resubmission or refund
            }
            DisputeDecision::Split(freelancer_pct) => {
                let freelancer_amount = (milestone.amount as u128 * freelancer_pct as u128 / 100) as u64;
                let client_amount = milestone.amount - freelancer_amount;
                
                milestone.status = MilestoneStatus::Resolved;
                contract.released_amount += freelancer_amount;
                
                // Transfer split amounts
                let seeds = &[
                    b"contract",
                    &contract.id.to_le_bytes(),
                    &[contract.bump],
                ];
                let signer = &[&seeds[..]];
                
                // To freelancer
                let cpi_accounts = Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.freelancer_token_account.to_account_info(),
                    authority: ctx.accounts.contract.to_account_info(),
                };
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer
                );
                token::transfer(cpi_ctx, freelancer_amount)?;
                
                // To client
                let cpi_accounts = Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.client_token_account.to_account_info(),
                    authority: ctx.accounts.contract.to_account_info(),
                };
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer
                );
                token::transfer(cpi_ctx, client_amount)?;
            }
        }
        
        // Check completion
        if contract.released_amount == contract.total_amount {
            contract.status = ContractStatus::Completed;
        }
        
        Ok(())
    }

    /// Cancel contract and refund (mutual agreement or timeout)
    pub fn cancel_contract(ctx: Context<CancelContract>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, PayGuardError::ContractNotActive);
        
        let refund_amount = contract.total_amount - contract.released_amount;
        
        if refund_amount > 0 {
            let seeds = &[
                b"contract",
                &contract.id.to_le_bytes(),
                &[contract.bump],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.client_token_account.to_account_info(),
                authority: ctx.accounts.contract.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer
            );
            token::transfer(cpi_ctx, refund_amount)?;
        }
        
        contract.status = ContractStatus::Cancelled;
        
        Ok(())
    }
}

// ============ ACCOUNTS ============

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
    
    /// CHECK: Freelancer pubkey, validated by business logic
    pub freelancer: AccountInfo<'info>,
    
    /// CHECK: Token mint for payment
    pub token_mint: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut, has_one = client)]
    pub contract: Account<'info, Contract>,
    
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
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
    pub freelancer: AccountInfo<'info>,
    
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(mut, constraint = contract.client == *authority.key || contract.freelancer == *authority.key)]
    pub contract: Account<'info, Contract>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    
    /// Arbitration oracle/authority
    pub arbitrator: Signer<'info>,
    
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelContract<'info> {
    #[account(mut, has_one = client)]
    pub contract: Account<'info, Contract>,
    
    pub client: Signer<'info>,
    
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// ============ STATE ============

#[account]
#[derive(InitSpace)]
pub struct Contract {
    pub id: u64,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub token_mint: Pubkey,
    pub total_amount: u64,
    pub released_amount: u64,
    #[max_len(10)]
    pub milestones: Vec<Milestone>,
    pub description_hash: [u8; 32],
    pub status: ContractStatus,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Milestone {
    pub amount: u64,
    pub status: MilestoneStatus,
    #[max_len(100)]
    pub description: String,
    pub proof_hash: Option<[u8; 32]>,
    pub dispute_reason: Option<[u8; 32]>,
    pub arbitration_proof: Option<[u8; 32]>,
    pub submitted_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum ContractStatus {
    Active,
    Completed,
    Cancelled,
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Rejected,
    Disputed,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum DisputeDecision {
    FavorFreelancer,
    FavorClient,
    Split(u8), // percentage to freelancer (0-100)
}

// ============ ERRORS ============

#[error_code]
pub enum PayGuardError {
    #[msg("Invalid milestones configuration")]
    InvalidMilestones,
    #[msg("Amount mismatch")]
    AmountMismatch,
    #[msg("Contract is not active")]
    ContractNotActive,
    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,
    #[msg("Milestone is not pending")]
    MilestoneNotPending,
    #[msg("Milestone is not submitted")]
    MilestoneNotSubmitted,
    #[msg("Milestone is not disputed")]
    MilestoneNotDisputed,
    #[msg("Unauthorized")]
    Unauthorized,
}
