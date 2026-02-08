/**
 * PayGuard x AgentMemory Integration
 * 
 * Uses AgentMemory (moltdev-labs) to store persistent data about:
 * - Freelancer/Client reputation history
 * - Dispute patterns and resolutions
 * - Contract completion rates
 * 
 * This data helps the AI arbitrator make better decisions.
 * 
 * @see https://github.com/moltdev-labs/agent-memory-sdk
 */

import { AgentMemoryClient } from '@moltdev-labs/agent-memory-sdk';
import { PublicKey } from '@solana/web3.js';

// Initialize AgentMemory client
const agentMemory = new AgentMemoryClient({
  apiUrl: process.env.AGENT_MEMORY_API_URL || 'https://api.agentmemory.io',
  apiKey: process.env.AGENT_MEMORY_API_KEY || '',
});

// PayGuard vault ID (create once, reuse)
let PAYGUARD_VAULT_ID: string | null = null;

/**
 * Initialize or retrieve the PayGuard vault
 */
export async function initializeVault(): Promise<string> {
  if (PAYGUARD_VAULT_ID) return PAYGUARD_VAULT_ID;

  try {
    // Try to get existing vault
    const vaults = await agentMemory.listVaults({ limit: 100 });
    const existing = vaults.data.find(v => v.name === 'payguard-escrow');
    
    if (existing) {
      PAYGUARD_VAULT_ID = existing.id;
      return existing.id;
    }

    // Create new vault
    const vault = await agentMemory.createVault({
      name: 'payguard-escrow',
      description: 'PayGuard Escrow - Reputation and dispute history for freelancers and clients',
      metadata: {
        program_id: '87P97UZthkX6neXErdTLWT2sfMHo6P49Qr87fwkyWjDU',
        network: 'solana-devnet',
        version: '0.1.0',
      },
    });

    PAYGUARD_VAULT_ID = vault.id;
    return vault.id;
  } catch (error) {
    console.error('Failed to initialize AgentMemory vault:', error);
    throw error;
  }
}

/**
 * User reputation data structure
 */
export interface UserReputation {
  address: string;
  totalContracts: number;
  completedContracts: number;
  disputedContracts: number;
  disputesWon: number;
  disputesLost: number;
  averageContractValue: number;
  totalValueTransacted: number;
  lastActive: string;
  riskScore: number; // 0-100, lower is better
  tags: string[];
}

/**
 * Dispute record for pattern analysis
 */
export interface DisputeRecord {
  contractId: string;
  clientAddress: string;
  freelancerAddress: string;
  milestoneIndex: number;
  milestoneAmount: number;
  clientReason: string;
  freelancerResponse: string;
  resolution: 'favor_client' | 'favor_freelancer' | 'split';
  splitPercentage?: number;
  aiConfidence: number;
  timestamp: string;
  contractType?: string;
  tags: string[];
}

/**
 * Get or create user reputation
 */
export async function getUserReputation(address: string): Promise<UserReputation> {
  const vaultId = await initializeVault();
  const key = `reputation:${address}`;

  try {
    const memory = await agentMemory.getMemory(vaultId, key);
    return memory.data as UserReputation;
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      // Create new reputation
      const newReputation: UserReputation = {
        address,
        totalContracts: 0,
        completedContracts: 0,
        disputedContracts: 0,
        disputesWon: 0,
        disputesLost: 0,
        averageContractValue: 0,
        totalValueTransacted: 0,
        lastActive: new Date().toISOString(),
        riskScore: 50, // Neutral starting score
        tags: ['new-user'],
      };

      await agentMemory.storeMemory(vaultId, {
        key,
        data: newReputation,
        metadata: {
          tags: ['reputation', 'user'],
          labels: { address },
        },
      });

      return newReputation;
    }
    throw error;
  }
}

/**
 * Update user reputation after contract completion
 */
export async function updateReputationAfterContract(
  address: string,
  contractValue: number,
  completed: boolean,
  disputed: boolean,
  disputeWon?: boolean
): Promise<UserReputation> {
  const vaultId = await initializeVault();
  const key = `reputation:${address}`;
  
  const current = await getUserReputation(address);

  // Update stats
  current.totalContracts += 1;
  current.totalValueTransacted += contractValue;
  current.averageContractValue = current.totalValueTransacted / current.totalContracts;
  current.lastActive = new Date().toISOString();

  if (completed) {
    current.completedContracts += 1;
  }

  if (disputed) {
    current.disputedContracts += 1;
    if (disputeWon === true) {
      current.disputesWon += 1;
    } else if (disputeWon === false) {
      current.disputesLost += 1;
    }
  }

  // Recalculate risk score
  current.riskScore = calculateRiskScore(current);

  // Update tags
  current.tags = generateTags(current);

  // Save updated reputation
  await agentMemory.updateMemory(vaultId, key, {
    data: current,
    mergeData: false,
  });

  return current;
}

/**
 * Calculate risk score (0-100, lower is better)
 */
function calculateRiskScore(rep: UserReputation): number {
  if (rep.totalContracts === 0) return 50;

  let score = 50; // Start neutral

  // Completion rate (max -30 points)
  const completionRate = rep.completedContracts / rep.totalContracts;
  score -= completionRate * 30;

  // Dispute rate (max +30 points)
  const disputeRate = rep.disputedContracts / rep.totalContracts;
  score += disputeRate * 30;

  // Dispute win rate (max ±10 points)
  if (rep.disputedContracts > 0) {
    const disputeWinRate = rep.disputesWon / rep.disputedContracts;
    score -= (disputeWinRate - 0.5) * 20; // Winning disputes reduces risk
  }

  // Experience bonus (max -10 points)
  const expBonus = Math.min(rep.totalContracts / 10, 1) * 10;
  score -= expBonus;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate reputation tags
 */
function generateTags(rep: UserReputation): string[] {
  const tags: string[] = [];

  if (rep.totalContracts === 0) {
    tags.push('new-user');
  } else if (rep.totalContracts >= 50) {
    tags.push('veteran');
  } else if (rep.totalContracts >= 10) {
    tags.push('experienced');
  }

  const completionRate = rep.completedContracts / rep.totalContracts;
  if (completionRate >= 0.95) {
    tags.push('reliable');
  } else if (completionRate < 0.5) {
    tags.push('high-risk');
  }

  const disputeRate = rep.disputedContracts / rep.totalContracts;
  if (disputeRate > 0.3) {
    tags.push('dispute-prone');
  }

  if (rep.totalValueTransacted > 100_000_000_000) { // 100 SOL
    tags.push('whale');
  }

  if (rep.riskScore < 20) {
    tags.push('trusted');
  } else if (rep.riskScore > 70) {
    tags.push('caution');
  }

  return tags;
}

/**
 * Record a dispute for pattern analysis
 */
export async function recordDispute(dispute: DisputeRecord): Promise<void> {
  const vaultId = await initializeVault();
  const key = `dispute:${dispute.contractId}:${dispute.milestoneIndex}`;

  await agentMemory.storeMemory(vaultId, {
    key,
    data: dispute,
    metadata: {
      tags: ['dispute', dispute.resolution, ...(dispute.tags || [])],
      labels: {
        client: dispute.clientAddress,
        freelancer: dispute.freelancerAddress,
        resolution: dispute.resolution,
      },
    },
  });
}

/**
 * Search similar disputes for AI arbitration context
 */
export async function findSimilarDisputes(
  reason: string,
  limit: number = 5
): Promise<DisputeRecord[]> {
  const vaultId = await initializeVault();

  try {
    const results = await agentMemory.searchMemories({
      query: reason,
      vaultId,
      semantic: true,
      minScore: 0.6,
      limit,
    });

    return results.data
      .filter(m => m.key.startsWith('dispute:'))
      .map(m => m.data as DisputeRecord);
  } catch (error) {
    console.error('Failed to search disputes:', error);
    return [];
  }
}

/**
 * Get dispute statistics for a user
 */
export async function getUserDisputeHistory(address: string): Promise<DisputeRecord[]> {
  const vaultId = await initializeVault();

  try {
    const results = await agentMemory.listMemories(vaultId, {
      tags: ['dispute'],
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 50,
    });

    return results.data
      .filter(m => {
        const dispute = m.data as DisputeRecord;
        return dispute.clientAddress === address || dispute.freelancerAddress === address;
      })
      .map(m => m.data as DisputeRecord);
  } catch (error) {
    console.error('Failed to get dispute history:', error);
    return [];
  }
}

/**
 * Risk assessment for new contract
 */
export async function assessContractRisk(
  clientAddress: string,
  freelancerAddress: string,
  contractValue: number
): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  clientRisk: number;
  freelancerRisk: number;
  warnings: string[];
  recommendation: string;
}> {
  const [clientRep, freelancerRep] = await Promise.all([
    getUserReputation(clientAddress),
    getUserReputation(freelancerAddress),
  ]);

  const combinedRisk = (clientRep.riskScore + freelancerRep.riskScore) / 2;
  const warnings: string[] = [];

  // Check for warnings
  if (clientRep.tags.includes('new-user')) {
    warnings.push('Client is a new user with no history');
  }
  if (freelancerRep.tags.includes('new-user')) {
    warnings.push('Freelancer is a new user with no history');
  }
  if (clientRep.tags.includes('dispute-prone')) {
    warnings.push('Client has high dispute rate');
  }
  if (freelancerRep.tags.includes('dispute-prone')) {
    warnings.push('Freelancer has high dispute rate');
  }
  if (contractValue > freelancerRep.averageContractValue * 5 && freelancerRep.totalContracts > 0) {
    warnings.push('Contract value is unusually high for this freelancer');
  }

  let riskLevel: 'low' | 'medium' | 'high';
  let recommendation: string;

  if (combinedRisk < 30) {
    riskLevel = 'low';
    recommendation = 'Both parties have good reputation. Contract can proceed safely.';
  } else if (combinedRisk < 60) {
    riskLevel = 'medium';
    recommendation = 'Some risk factors present. Consider smaller milestones or additional verification.';
  } else {
    riskLevel = 'high';
    recommendation = 'High risk detected. Recommend thorough verification before proceeding.';
  }

  return {
    riskLevel,
    riskScore: Math.round(combinedRisk),
    clientRisk: clientRep.riskScore,
    freelancerRisk: freelancerRep.riskScore,
    warnings,
    recommendation,
  };
}

export default {
  initializeVault,
  getUserReputation,
  updateReputationAfterContract,
  recordDispute,
  findSimilarDisputes,
  getUserDisputeHistory,
  assessContractRisk,
};
