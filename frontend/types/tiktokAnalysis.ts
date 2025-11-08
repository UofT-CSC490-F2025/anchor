/**
 * TikTok Analysis Types
 * TypeScript interfaces matching the backend TikTokPredictResponse schema
 */

// ClaimBuster API response structure
export interface ClaimBusterClaim {
  text: string;
  index: number;
  score: number;
}

// Deepfake detection result
export interface DeepfakeCheckResult {
  status: string;
  confidence?: number;
  message?: string;
  details?: Record<string, any>;
}

// Fact-checking result from ClaimBuster API
export interface FactCheckResult {
  status: string;
  claims?: ClaimBusterClaim[];
  confidence?: number;
  message?: string;
  source?: string;
}

// Main response from backend /api/tiktok/predict endpoint
export interface TikTokPredictResponse {
  file_name: string;
  deepfake_check: DeepfakeCheckResult;
  fact_check_results: FactCheckResult;
}

// Request to backend /api/tiktok/predict endpoint
export interface TikTokPredictRequest {
  url: string;
}

// Legacy format expected by FactCheckResults component
export interface LegacyAnalysisResult {
  claims: Array<{
    claim_text: string;
    score: number;
  }>;
}

// Utility function to transform backend response to legacy format
export function transformTikTokResponseToLegacy(
  response: TikTokPredictResponse
): LegacyAnalysisResult {
  const claims = response.fact_check_results.claims || [];
  
  return {
    claims: claims.map(claim => ({
      claim_text: claim.text,
      score: claim.score
    }))
  };
}

// Utility function to get the highest scoring claim
export function getHighestScoringClaim(response: TikTokPredictResponse): ClaimBusterClaim | null {
  const claims = response.fact_check_results.claims || [];
  if (claims.length === 0) return null;
  
  return claims.reduce((highest, current) => 
    current.score > highest.score ? current : highest
  );
}

// Utility function to check if analysis was successful
export function isAnalysisSuccessful(response: TikTokPredictResponse): boolean {
  return response.fact_check_results.status === 'completed' && 
         (response.fact_check_results.claims?.length || 0) > 0;
}

// Get human-readable status message
export function getAnalysisStatusMessage(response: TikTokPredictResponse): string {
  const { fact_check_results, deepfake_check } = response;
  
  if (fact_check_results.status === 'completed') {
    const claimsCount = fact_check_results.claims?.length || 0;
    if (claimsCount > 0) {
      const highestClaim = getHighestScoringClaim(response);
      const score = highestClaim ? Math.round(highestClaim.score * 100) : 0;
      return `Analysis complete! Found ${claimsCount} claim${claimsCount === 1 ? '' : 's'} with highest factuality score of ${score}%.`;
    } else {
      return 'Analysis complete! No specific claims detected in this content.';
    }
  } else if (fact_check_results.status === 'failed') {
    return fact_check_results.message || 'Analysis failed. Please try again.';
  } else {
    return 'Analysis in progress...';
  }
}