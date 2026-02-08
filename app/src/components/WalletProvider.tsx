"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet as useSolanaWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton as SolanaWalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as bs58 from "bs58";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

// PayGuard Program ID (Devnet)
export const PAYGUARD_PROGRAM_ID = new PublicKey("7xGH3qHVxeRJcMBcMrjPw3KqpNMNLZD5dVJUJCPWvxxt");

// Devnet RPC
const DEVNET_RPC = "https://api.devnet.solana.com";

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProviderWrapper: FC<WalletProviderProps> = ({ children }) => {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={DEVNET_RPC}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

// Custom hook for wallet
export const useWallet = () => {
  const wallet = useSolanaWallet();
  return {
    connected: wallet.connected,
    publicKey: wallet.publicKey,
    connecting: wallet.connecting,
    disconnect: wallet.disconnect,
    select: wallet.select,
    wallet: wallet.wallet,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  };
};

// Custom hook for PayGuard operations
export const usePayGuard = () => {
  const { publicKey, signTransaction } = useSolanaWallet();
  const { connection } = useConnection();

  const getContractPDA = (contractId: number, client: PublicKey): [PublicKey, number] => {
    const seed = Buffer.alloc(8);
    seed.writeBigUInt64LE(BigInt(contractId));
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from("contract"), client.toBuffer(), seed],
      PAYGUARD_PROGRAM_ID
    );
  };

  const createContract = async (
    contractId: number,
    freelancer: PublicKey,
    arbitrator: PublicKey,
    totalAmount: number,
    milestoneAmounts: number[]
  ) => {
    if (!publicKey || !signTransaction) {
      throw new Error("Wallet not connected");
    }

    const [contractPda] = getContractPDA(contractId, publicKey);
    
    // For demo purposes, we'll create a simple transfer to show wallet is working
    // In production, this would call the actual PayGuard program
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: contractPda,
        lamports: 0, // Just a test transaction
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    const signed = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    
    return { tx: signature, contractPda };
  };

  const fundContract = async (contractId: number, amount: number) => {
    if (!publicKey || !signTransaction) {
      throw new Error("Wallet not connected");
    }

    const [contractPda] = getContractPDA(contractId, publicKey);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: contractPda,
        lamports: amount,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    const signed = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    
    return signature;
  };

  const submitMilestone = async (contractId: number, milestoneIndex: number) => {
    // Would call PayGuard program to submit milestone
    console.log("Submitting milestone", contractId, milestoneIndex);
    return "milestone_submitted";
  };

  const approveMilestone = async (contractId: number, milestoneIndex: number, freelancer: PublicKey) => {
    // Would call PayGuard program to approve milestone and release funds
    console.log("Approving milestone", contractId, milestoneIndex);
    return "milestone_approved";
  };

  const getContract = async (contractPda: PublicKey) => {
    // Would fetch contract data from chain
    return null;
  };

  return {
    createContract,
    fundContract,
    submitMilestone,
    approveMilestone,
    getContract,
    getContractPDA,
  };
};

// Re-export wallet button with custom styling
export const WalletMultiButton: FC = () => {
  return <SolanaWalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 !rounded-xl !font-semibold hover:!opacity-90 !transition" />;
};

export default WalletProviderWrapper;
