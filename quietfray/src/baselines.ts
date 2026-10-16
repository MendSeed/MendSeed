// ============================================================================
// QUIETFRAY v0.1 — BASELINE COMPARISON MODELS
// Aligned with Section 11.3 of Master Product Brief
// ============================================================================

export interface BaselineInput {
  upvotes: number;
  downvotes: number;
  voteTimestampsDays: { timeDays: number; direction: 'UP' | 'DOWN' }[];
  reportsCount: number;
  unresolvedDays: number;
  currentHorizonDays: number;
}

/**
 * 1. Raw Net Votes Baseline: S_raw = U - D
 */
export function rawNetVotesBaseline(input: BaselineInput): number {
  return input.upvotes - input.downvotes;
}

/**
 * 2. Wilson Lower Confidence Bound for Upvote Ratio:
 * Standard Wilson score interval lower bound with z = 1.96 (95% confidence).
 */
export function wilsonScoreBaseline(input: BaselineInput, z = 1.96): number {
  const n = input.upvotes + input.downvotes;
  if (n === 0) return 0;
  const p = input.upvotes / n;
  const z2 = z * z;
  const numerator = p + z2 / (2 * n) - z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  const denominator = 1 + z2 / n;
  return Math.max(0, numerator / denominator);
}

/**
 * 3. Exponential Recency Decay Baseline:
 * S_decay(T) = sum_j d_j * exp( -(T - t_j) / tau )
 * Default tau = 7.0 days.
 */
export function exponentialDecayBaseline(input: BaselineInput, tau = 7.0): number {
  let score = 0;
  for (const v of input.voteTimestampsDays) {
    const dt = Math.max(0, input.currentHorizonDays - v.timeDays);
    const weight = v.direction === 'DOWN' ? -1 : 1;
    score += weight * Math.exp(-dt / tau);
  }
  return score;
}

/**
 * 4. Beta-Smoothed Empirical Bayes Vote Score:
 * p_hat = (U + alpha) / (U + D + alpha + beta)
 * S_EB = log( p_hat / (1 - p_hat) )
 */
export function betaEmpiricalBayesBaseline(input: BaselineInput, alpha = 2.0, beta = 2.0): number {
  const p_hat = (input.upvotes + alpha) / (input.upvotes + input.downvotes + alpha + beta);
  return Math.log(p_hat / (1 - p_hat));
}

/**
 * 5. Persistence-Oriented Heuristic Baseline:
 * Combines report count with log of unresolved duration and net votes.
 */
export function persistenceHeuristicBaseline(input: BaselineInput): number {
  const netVotes = input.upvotes - input.downvotes;
  const reportsWeight = Math.log1p(input.reportsCount) * 2.0;
  const durationWeight = Math.log1p(input.unresolvedDays) * 1.5;
  return netVotes * 0.2 + reportsWeight + durationWeight;
}
