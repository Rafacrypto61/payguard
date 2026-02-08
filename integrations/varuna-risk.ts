/**
 * PayGuard x Varuna Integration
 * 
 * Uses Varuna Risk Engine to assess DeFi risk of freelancers/clients
 * BEFORE accepting contracts. If a party has risky DeFi positions,
 * they might get liquidated and become unable to pay.
 * 
 * This is READ-ONLY — we never execute protection transactions.
 * We only query risk assessments to inform contract decisions.
 * 
 * @see https://github.com/pranatha-orb/varuna
 * @security No private keys accessed, no transactions executed
 */

import { PublicKey } from '@solana/web3.js';

// Varuna API types (from varuna/src/types)
interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

interface PositionRisk {
  protocol: string;
  healthFactor: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
}

interface WalletRiskAssessment {
  wallet: string;
  overallRiskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  overallRiskScore: number;
  positions: PositionRisk[];
  timestamp: Date;
}

interface QuickCheck {
  wallet: string;
  riskLevel: string;
  riskScore: number;
  healthFactors: { protocol: string; hf: number }[];
  needsProtection: boolean;
}

// Varuna API client configuration
const VARUNA_API_URL = process.env.VARUNA_API_URL || 'http://localhost:3000';

/**
 * PayGuard Risk Assessment for DeFi-active users
 */
export interface PayGuardDeFiRisk {
  wallet: string;
  hasDeFiPositions: boolean;
  overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  liquidationRisk: boolean;
  estimatedLiquidationUsd: number;
  protocols: {
    name: string;
    healthFactor: number;
    riskLevel: string;
  }[];
  recommendation: string;
  warnings: string[];
  checkedAt: Date;
}

/**
 * Check if Varuna API is available
 */
export async function isVarunaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${VARUNA_API_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get quick health check for a wallet
 */
export async function quickHealthCheck(wallet: string): Promise<QuickCheck | null> {
  try {
    const response = await fetch(`${VARUNA_API_URL}/api/health/${wallet}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`[PayGuard] Varuna health check failed for ${wallet}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`[PayGuard] Varuna health check error:`, error);
    return null;
  }
}

/**
 * Get full risk assessment for a wallet
 */
export async function getFullRiskAssessment(wallet: string): Promise<WalletRiskAssessment | null> {
  try {
    const response = await fetch(`${VARUNA_API_URL}/api/risk/${wallet}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[PayGuard] Varuna risk assessment failed for ${wallet}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`[PayGuard] Varuna risk assessment error:`, error);
    return null;
  }
}

/**
 * Assess DeFi risk for PayGuard contract parties
 * 
 * This evaluates if a freelancer/client has risky DeFi positions
 * that could lead to liquidation and inability to fulfill contracts.
 */
export async function assessDeFiRisk(walletAddress: string): Promise<PayGuardDeFiRisk> {
  const result: PayGuardDeFiRisk = {
    wallet: walletAddress,
    hasDeFiPositions: false,
    overallRisk: 'none',
    riskScore: 0,
    liquidationRisk: false,
    estimatedLiquidationUsd: 0,
    protocols: [],
    recommendation: 'No DeFi positions detected. Proceed normally.',
    warnings: [],
    checkedAt: new Date(),
  };

  // Validate wallet address
  try {
    new PublicKey(walletAddress);
  } catch {
    result.warnings.push('Invalid wallet address format');
    return result;
  }

  // Check if Varuna is available
  const available = await isVarunaAvailable();
  if (!available) {
    result.warnings.push('Varuna risk engine unavailable — DeFi risk not assessed');
    result.recommendation = 'Varuna offline. Consider manual verification of DeFi positions.';
    return result;
  }

  // Get risk assessment
  const assessment = await getFullRiskAssessment(walletAddress);
  if (!assessment) {
    result.warnings.push('Could not fetch DeFi risk data');
    return result;
  }

  // No positions = no DeFi risk
  if (assessment.positions.length === 0) {
    return result;
  }

  // Has DeFi positions
  result.hasDeFiPositions = true;
  result.overallRisk = assessment.overallRiskLevel;
  result.riskScore = assessment.overallRiskScore;

  // Map protocols
  result.protocols = assessment.positions.map(p => ({
    name: p.protocol,
    healthFactor: p.healthFactor,
    riskLevel: p.riskLevel,
  }));

  // Check for liquidation risk
  const criticalPositions = assessment.positions.filter(p => 
    p.riskLevel === 'critical' || p.riskLevel === 'high'
  );
  result.liquidationRisk = criticalPositions.length > 0;

  // Generate warnings based on risk
  if (result.overallRisk === 'critical') {
    result.warnings.push('⚠️ CRITICAL: User has positions at imminent liquidation risk');
    result.warnings.push('High chance of forced liquidation affecting ability to pay');
    result.recommendation = 'CAUTION: Require upfront payment or additional collateral for contracts.';
  } else if (result.overallRisk === 'high') {
    result.warnings.push('User has high-risk DeFi positions');
    result.warnings.push('Market volatility could trigger liquidations');
    result.recommendation = 'Consider smaller milestones and faster payout cycles.';
  } else if (result.overallRisk === 'medium') {
    result.warnings.push('User has moderate DeFi exposure');
    result.recommendation = 'Standard risk. Monitor for changes during long contracts.';
  } else if (result.overallRisk === 'low') {
    result.recommendation = 'Low DeFi risk. Proceed with standard terms.';
  } else {
    result.recommendation = 'Healthy DeFi positions. No concerns.';
  }

  // Add specific protocol warnings
  for (const p of assessment.positions) {
    if (p.healthFactor < 1.2) {
      result.warnings.push(`${p.protocol}: Health factor ${p.healthFactor.toFixed(2)} is dangerously low`);
    } else if (p.healthFactor < 1.5) {
      result.warnings.push(`${p.protocol}: Health factor ${p.healthFactor.toFixed(2)} needs attention`);
    }
  }

  return result;
}

/**
 * Assess combined risk for a PayGuard contract
 * 
 * Evaluates both client and freelancer DeFi positions.
 */
export async function assessContractDeFiRisk(
  clientWallet: string,
  freelancerWallet: string,
  contractValueUsd: number,
): Promise<{
  clientRisk: PayGuardDeFiRisk;
  freelancerRisk: PayGuardDeFiRisk;
  combinedRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  shouldProceed: boolean;
  recommendations: string[];
}> {
  // Assess both parties in parallel
  const [clientRisk, freelancerRisk] = await Promise.all([
    assessDeFiRisk(clientWallet),
    assessDeFiRisk(freelancerWallet),
  ]);

  const recommendations: string[] = [];
  
  // Determine combined risk
  const riskLevels = ['none', 'low', 'medium', 'high', 'critical'];
  const clientLevel = riskLevels.indexOf(clientRisk.overallRisk);
  const freelancerLevel = riskLevels.indexOf(freelancerRisk.overallRisk);
  const maxLevel = Math.max(clientLevel, freelancerLevel);
  
  let combinedRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  let shouldProceed = true;

  if (maxLevel >= 4) { // critical
    combinedRiskLevel = 'critical';
    shouldProceed = false;
    recommendations.push('❌ At least one party has critical DeFi risk');
    recommendations.push('Consider requiring full upfront payment or declining');
  } else if (maxLevel >= 3) { // high
    combinedRiskLevel = 'high';
    recommendations.push('⚠️ High DeFi risk detected');
    recommendations.push('Recommend smaller milestones (max $500 each)');
    recommendations.push('Require milestone completion verification before next');
  } else if (maxLevel >= 2) { // medium
    combinedRiskLevel = 'medium';
    recommendations.push('Moderate DeFi exposure — proceed with caution');
  } else {
    combinedRiskLevel = 'low';
    recommendations.push('✅ Low DeFi risk — proceed with standard terms');
  }

  // High value contracts need extra scrutiny
  if (contractValueUsd > 10000 && (clientRisk.hasDeFiPositions || freelancerRisk.hasDeFiPositions)) {
    recommendations.push(`Large contract ($${contractValueUsd}) with DeFi-active parties`);
    recommendations.push('Consider requiring on-chain reputation verification (SAID Protocol)');
  }

  // Add party-specific recommendations
  if (clientRisk.liquidationRisk) {
    recommendations.push('Client at liquidation risk — may have payment difficulties');
  }
  if (freelancerRisk.liquidationRisk) {
    recommendations.push('Freelancer at liquidation risk — may need faster milestone payouts');
  }

  return {
    clientRisk,
    freelancerRisk,
    combinedRiskLevel,
    shouldProceed,
    recommendations,
  };
}

/**
 * Monitor ongoing contract parties for DeFi risk changes
 * 
 * Call periodically during long-running contracts to detect
 * if a party's risk level has increased.
 */
export async function monitorContractRisk(
  clientWallet: string,
  freelancerWallet: string,
  previousRisk: {
    clientScore: number;
    freelancerScore: number;
  },
): Promise<{
  clientRiskChanged: boolean;
  freelancerRiskChanged: boolean;
  clientDelta: number;
  freelancerDelta: number;
  alert: string | null;
}> {
  const [clientRisk, freelancerRisk] = await Promise.all([
    assessDeFiRisk(clientWallet),
    assessDeFiRisk(freelancerWallet),
  ]);

  const clientDelta = clientRisk.riskScore - previousRisk.clientScore;
  const freelancerDelta = freelancerRisk.riskScore - previousRisk.freelancerScore;

  const clientRiskChanged = Math.abs(clientDelta) > 15;
  const freelancerRiskChanged = Math.abs(freelancerDelta) > 15;

  let alert: string | null = null;

  if (clientDelta > 30 || freelancerDelta > 30) {
    alert = '🚨 Significant DeFi risk increase detected for contract parties';
  } else if (clientRisk.liquidationRisk || freelancerRisk.liquidationRisk) {
    alert = '⚠️ Liquidation risk detected — consider accelerating milestone payouts';
  }

  return {
    clientRiskChanged,
    freelancerRiskChanged,
    clientDelta,
    freelancerDelta,
    alert,
  };
}

export default {
  isVarunaAvailable,
  quickHealthCheck,
  getFullRiskAssessment,
  assessDeFiRisk,
  assessContractDeFiRisk,
  monitorContractRisk,
};
