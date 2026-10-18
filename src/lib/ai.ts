// ============================================================================
// MENDSEED AI CLIENT BRIDGE
// Client-side interface to same-origin serverless /api/ai routes.
// Keeps credentials (MENDSEED_AI_SECRET_KEY) server-side and resiliently
// handles offline/unreachable AI microservice states without blocking UX.
// ============================================================================

export interface GrievanceAnalysisResponse {
  category: string;
  normalized_title: string;
  summary: string;
  affected_sector: string;
  location_or_demographic?: string;
  observed_friction?: string;
  current_workarounds?: string;
  missing_information: string[];
  confidence: number;
}

export interface GrievanceComparisonResponse {
  relationship: string;
  evidence: string[];
  matching_score: number;
  meaningful_differences: string[];
  recommended_action?: string;
}

export interface BuilderBriefResponse {
  problem_statement: string;
  target_beneficiaries: string;
  current_ground_reality: string;
  impact: string;
  solution_opportunities: string[];
  unresolved_questions: string[];
}

export interface CommunitySummaryResponse {
  main_problems: string[];
  recurring_themes: string[];
  disagreements: string[];
  evidence_backed_feedback: string[];
}

export interface MergeProposalResponse {
  candidate_canonical_problem_id: string;
  proposed_grievance_links: string[];
  supporting_evidence: string;
  uncertainty_level: 'Low' | 'Medium' | 'High';
  human_review_required: boolean;
}

export interface AiServiceResult<T> {
  success: boolean;
  aiProcessingState: 'COMPLETED' | 'FAILED' | 'OFFLINE_FALLBACK' | 'STANDBY';
  data?: T;
  message?: string;
  error?: string;
  isFallback?: boolean;
}

/**
 * Checks liveness and status of the MendSeed AI enrichment gateway.
 */
export async function checkAiHealth(): Promise<{ status: string; endpoint?: string }> {
  try {
    const res = await fetch('/api/ai?action=health');
    if (!res.ok) return { status: 'STANDBY' };
    return await res.json();
  } catch {
    return { status: 'OFFLINE' };
  }
}

/**
 * Submits raw citizen grievance text for structured extraction via /api/ai.
 */
export async function analyzeGrievanceWithAi(
  text: string,
  metadata?: Record<string, any>
): Promise<AiServiceResult<GrievanceAnalysisResponse>> {
  try {
    const res = await fetch('/api/ai?action=analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, metadata }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      aiProcessingState: 'OFFLINE_FALLBACK',
      error: err.message,
    };
  }
}

/**
 * Compares two grievances to test for duplicate or shared systemic patterns.
 */
export async function compareGrievancesWithAi(
  reportA: string,
  reportB: string
): Promise<AiServiceResult<GrievanceComparisonResponse>> {
  try {
    const res = await fetch('/api/ai?action=compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_a: reportA, report_b: reportB }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      aiProcessingState: 'OFFLINE_FALLBACK',
      error: err.message,
    };
  }
}

/**
 * Generates an actionable BuilderBrief for builders, researchers, and hackathon teams.
 */
export async function generateBuilderBriefWithAi(
  title: string,
  reports: string[]
): Promise<AiServiceResult<BuilderBriefResponse>> {
  try {
    const res = await fetch('/api/ai?action=builder-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, reports }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      aiProcessingState: 'OFFLINE_FALLBACK',
      error: err.message,
    };
  }
}

/**
 * Proposes whether a new grievance clusters under an existing canonical issue.
 * Always preserves human_review_required=true.
 */
export async function proposeMergeWithAi(
  text: string,
  candidates: Array<{ id: string; title: string; summary: string }>
): Promise<AiServiceResult<MergeProposalResponse>> {
  try {
    const res = await fetch('/api/ai?action=propose-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, candidates }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      aiProcessingState: 'OFFLINE_FALLBACK',
      error: err.message,
    };
  }
}
