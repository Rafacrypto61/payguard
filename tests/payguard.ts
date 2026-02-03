import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Payguard } from "../target/types/payguard";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";
import { expect } from "chai";
import { BN } from "bn.js";

describe("payguard", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Payguard as Program<Payguard>;
  
  // Test accounts
  let client: Keypair;
  let freelancer: Keypair;
  let tokenMint: PublicKey;
  let clientTokenAccount: PublicKey;
  let freelancerTokenAccount: PublicKey;
  let escrowVault: PublicKey;
  let contractPDA: PublicKey;
  let contractBump: number;
  
  const contractId = new BN(Date.now());
  const totalAmount = new BN(1000 * 10 ** 6); // 1000 USDC (6 decimals)
  
  before(async () => {
    // Generate keypairs
    client = Keypair.generate();
    freelancer = Keypair.generate();
    
    // Airdrop SOL to client for fees
    const airdropSig = await provider.connection.requestAirdrop(
      client.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
    
    // Create mock USDC mint
    tokenMint = await createMint(
      provider.connection,
      client,
      client.publicKey,
      null,
      6 // USDC has 6 decimals
    );
    
    // Create token accounts
    clientTokenAccount = await createAccount(
      provider.connection,
      client,
      tokenMint,
      client.publicKey
    );
    
    freelancerTokenAccount = await createAccount(
      provider.connection,
      client,
      tokenMint,
      freelancer.publicKey
    );
    
    // Mint tokens to client
    await mintTo(
      provider.connection,
      client,
      tokenMint,
      clientTokenAccount,
      client,
      2000 * 10 ** 6 // 2000 USDC
    );
    
    // Derive contract PDA
    [contractPDA, contractBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("contract"), contractId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    // Create escrow vault (PDA-owned token account)
    escrowVault = await createAccount(
      provider.connection,
      client,
      tokenMint,
      contractPDA,
      undefined,
      TOKEN_PROGRAM_ID
    );
  });

  describe("create_contract", () => {
    it("should create a new escrow contract", async () => {
      const milestones = [
        {
          amount: new BN(500 * 10 ** 6),
          description: "Design mockups",
          status: { pending: {} },
          proofHash: null,
          disputeReason: null,
          arbitrationProof: null,
          submittedAt: null,
        },
        {
          amount: new BN(500 * 10 ** 6),
          description: "Final delivery",
          status: { pending: {} },
          proofHash: null,
          disputeReason: null,
          arbitrationProof: null,
          submittedAt: null,
        },
      ];
      
      const descriptionHash = Array(32).fill(1); // Mock hash
      
      const tx = await program.methods
        .createContract(contractId, totalAmount, milestones, descriptionHash)
        .accounts({
          contract: contractPDA,
          client: client.publicKey,
          freelancer: freelancer.publicKey,
          tokenMint: tokenMint,
          systemProgram: SystemProgram.programId,
        })
        .signers([client])
        .rpc();
      
      console.log("Create contract tx:", tx);
      
      // Verify contract state
      const contract = await program.account.contract.fetch(contractPDA);
      expect(contract.client.toString()).to.equal(client.publicKey.toString());
      expect(contract.freelancer.toString()).to.equal(freelancer.publicKey.toString());
      expect(contract.totalAmount.toNumber()).to.equal(totalAmount.toNumber());
      expect(contract.releasedAmount.toNumber()).to.equal(0);
      expect(contract.milestones.length).to.equal(2);
      expect(contract.status).to.deep.equal({ active: {} });
    });
  });

  describe("fund_escrow", () => {
    it("should fund the escrow with tokens", async () => {
      const tx = await program.methods
        .fundEscrow(totalAmount)
        .accounts({
          contract: contractPDA,
          client: client.publicKey,
          clientTokenAccount: clientTokenAccount,
          escrowVault: escrowVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([client])
        .rpc();
      
      console.log("Fund escrow tx:", tx);
      
      // Verify escrow balance
      const vaultAccount = await getAccount(provider.connection, escrowVault);
      expect(Number(vaultAccount.amount)).to.equal(totalAmount.toNumber());
    });
  });

  describe("submit_milestone", () => {
    it("should allow freelancer to submit milestone completion", async () => {
      const proofHash = Array(32).fill(2); // Mock proof hash
      
      const tx = await program.methods
        .submitMilestone(0, proofHash)
        .accounts({
          contract: contractPDA,
          freelancer: freelancer.publicKey,
        })
        .signers([freelancer])
        .rpc();
      
      console.log("Submit milestone tx:", tx);
      
      // Verify milestone status
      const contract = await program.account.contract.fetch(contractPDA);
      expect(contract.milestones[0].status).to.deep.equal({ submitted: {} });
    });
  });

  describe("approve_milestone", () => {
    it("should allow client to approve milestone and release funds", async () => {
      const freelancerBalanceBefore = await getAccount(
        provider.connection, 
        freelancerTokenAccount
      );
      
      const tx = await program.methods
        .approveMilestone(0)
        .accounts({
          contract: contractPDA,
          client: client.publicKey,
          freelancer: freelancer.publicKey,
          escrowVault: escrowVault,
          freelancerTokenAccount: freelancerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([client])
        .rpc();
      
      console.log("Approve milestone tx:", tx);
      
      // Verify funds transferred
      const freelancerBalanceAfter = await getAccount(
        provider.connection, 
        freelancerTokenAccount
      );
      const expectedAmount = 500 * 10 ** 6;
      expect(Number(freelancerBalanceAfter.amount)).to.equal(
        Number(freelancerBalanceBefore.amount) + expectedAmount
      );
      
      // Verify contract state
      const contract = await program.account.contract.fetch(contractPDA);
      expect(contract.milestones[0].status).to.deep.equal({ approved: {} });
      expect(contract.releasedAmount.toNumber()).to.equal(expectedAmount);
    });
  });

  describe("raise_dispute", () => {
    it("should allow raising dispute on submitted milestone", async () => {
      // First submit milestone 2
      const proofHash = Array(32).fill(3);
      await program.methods
        .submitMilestone(1, proofHash)
        .accounts({
          contract: contractPDA,
          freelancer: freelancer.publicKey,
        })
        .signers([freelancer])
        .rpc();
      
      // Now raise dispute
      const reasonHash = Array(32).fill(4);
      const tx = await program.methods
        .raiseDispute(1, reasonHash)
        .accounts({
          contract: contractPDA,
          authority: client.publicKey,
        })
        .signers([client])
        .rpc();
      
      console.log("Raise dispute tx:", tx);
      
      // Verify milestone status
      const contract = await program.account.contract.fetch(contractPDA);
      expect(contract.milestones[1].status).to.deep.equal({ disputed: {} });
    });
  });

  describe("cancel_contract", () => {
    it("should refund remaining funds on cancellation", async () => {
      // Create a new contract for cancellation test
      const cancelContractId = new BN(Date.now() + 1);
      const [cancelPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("contract"), cancelContractId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      const cancelAmount = new BN(100 * 10 ** 6);
      const milestones = [
        {
          amount: cancelAmount,
          description: "Test milestone",
          status: { pending: {} },
          proofHash: null,
          disputeReason: null,
          arbitrationProof: null,
          submittedAt: null,
        },
      ];
      
      // Create contract
      await program.methods
        .createContract(cancelContractId, cancelAmount, milestones, Array(32).fill(5))
        .accounts({
          contract: cancelPDA,
          client: client.publicKey,
          freelancer: freelancer.publicKey,
          tokenMint: tokenMint,
          systemProgram: SystemProgram.programId,
        })
        .signers([client])
        .rpc();
      
      // Create escrow vault for this contract
      const cancelVault = await createAccount(
        provider.connection,
        client,
        tokenMint,
        cancelPDA,
        undefined,
        TOKEN_PROGRAM_ID
      );
      
      // Fund it
      await program.methods
        .fundEscrow(cancelAmount)
        .accounts({
          contract: cancelPDA,
          client: client.publicKey,
          clientTokenAccount: clientTokenAccount,
          escrowVault: cancelVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([client])
        .rpc();
      
      const clientBalanceBefore = await getAccount(provider.connection, clientTokenAccount);
      
      // Cancel contract
      const tx = await program.methods
        .cancelContract()
        .accounts({
          contract: cancelPDA,
          client: client.publicKey,
          escrowVault: cancelVault,
          clientTokenAccount: clientTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([client])
        .rpc();
      
      console.log("Cancel contract tx:", tx);
      
      // Verify refund
      const clientBalanceAfter = await getAccount(provider.connection, clientTokenAccount);
      expect(Number(clientBalanceAfter.amount)).to.equal(
        Number(clientBalanceBefore.amount) + cancelAmount.toNumber()
      );
      
      // Verify contract status
      const contract = await program.account.contract.fetch(cancelPDA);
      expect(contract.status).to.deep.equal({ cancelled: {} });
    });
  });
});

// Helper to create deterministic description hash
function hashDescription(description: string): number[] {
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256").update(description).digest();
  return Array.from(hash);
}
