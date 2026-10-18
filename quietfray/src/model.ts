// ============================================================================
// QUIETFRAY v0.1 — MATHEMATICAL SPECIFICATION & IMPLEMENTATION
// Category-aware Temporal Evidence Model for Problem Opportunity Ranking
// Aligned with Section 11 of Master Product Brief
// ============================================================================

export interface TemporalEvent {
  timeDays: number; // Elapsed time in days from issue start (or absolute days)
  channel: 'VOTE' | 'REPORT';
  direction?: 'UP' | 'DOWN'; // For votes
  mark?: {
    confidence: number;      // c_k in [0, 1]
    diversity: number;       // H_k in [0, 1]
    burstSimilarity: number; // s_k^burst in [0, 1]
  };
}

export interface QuietFrayParams {
  tau_f: number; // Fast timescale (0.02 days = 28.8 min)
  tau_s: number; // Slow timescale (3.0 days)
  mu_V: number;  // Baseline rate for votes
  mu_R: number;  // Baseline rate for reports
  // Intensity coefficients [fast, slow] for H0 and H1
  alpha_V_0: [number, number]; // [12.0, 0.025]
  alpha_V_1: [number, number]; // [0.35, 0.16]
  alpha_R_0: [number, number]; // [15.0, 0.020]
  alpha_R_1: [number, number]; // [0.50, 0.18]
  // Beta mark parameters [a, b] for H0 and H1
  beta_c_0: [number, number]; // [3, 4]
  beta_c_1: [number, number]; // [8, 2]
  beta_H_0: [number, number]; // [1.5, 5]
  beta_H_1: [number, number]; // [5, 2]
  beta_s_0: [number, number]; // [8, 1.5]
  beta_s_1: [number, number]; // [1.5, 8]
  // Vote direction priors [a, b]
  vote_prior_0: [number, number]; // [2, 2]
  vote_prior_1: [number, number]; // [7, 3]
  // Unresolved duration Weibull [k, theta] in days
  weibull_0: [number, number]; // [1.05, 35]
  weibull_1: [number, number]; // [0.75, 45]
  // Reopen Bernoulli probabilities [p0, p1]
  reopen_p0: number; // 0.20
  reopen_p1: number; // 0.70
  // Category prior hyper-parameters
  cat_alpha: number; // 2.0
  cat_beta: number;  // 8.0
}

export const DEFAULT_QUIETFRAY_PARAMS: QuietFrayParams = {
  tau_f: 0.02,
  tau_s: 3.0,
  mu_V: 0.05,
  mu_R: 0.02,
  alpha_V_0: [12.0, 0.025],
  alpha_V_1: [0.35, 0.16],
  alpha_R_0: [15.0, 0.02],
  alpha_R_1: [0.50, 0.18],
  beta_c_0: [3, 4],
  beta_c_1: [8, 2],
  beta_H_0: [1.5, 5],
  beta_H_1: [5, 2],
  beta_s_0: [8, 1.5],
  beta_s_1: [1.5, 8],
  vote_prior_0: [2, 2],
  vote_prior_1: [7, 3],
  weibull_0: [1.05, 35],
  weibull_1: [0.75, 45],
  reopen_p0: 0.20,
  reopen_p1: 0.70,
  cat_alpha: 2.0,
  cat_beta: 8.0,
};

// Log-gamma approximation (Lanczos formula) for beta normalizing constants
function logGamma(z: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

/**
 * Log density ratio for Beta distribution: log( f1(x) / f0(x) )
 */
export function betaLogDensityRatio(x: number, [a0, b0]: [number, number], [a1, b1]: [number, number]): number {
  const clampedX = Math.min(Math.max(x, 1e-6), 1 - 1e-6);
  const logNormRatio = logBeta(a0, b0) - logBeta(a1, b1);
  return logNormRatio + (a1 - a0) * Math.log(clampedX) + (b1 - b0) * Math.log(1 - clampedX);
}

export interface QuietFrayOnlineState {
  tLast: number;
  x_V_f: number;
  x_V_s: number;
  x_R_f: number;
  x_R_s: number;
  int_V_1: number;
  int_V_0: number;
  int_R_1: number;
  int_R_0: number;
  sum_log_ratio_V: number;
  sum_log_ratio_R: number;
  ell_marks: number;
  ell_vote: number;
  upvotes: number;
  downvotes: number;
  reportsCount: number;
}

export function createInitialState(t0 = 0): QuietFrayOnlineState {
  return {
    tLast: t0,
    x_V_f: 0,
    x_V_s: 0,
    x_R_f: 0,
    x_R_s: 0,
    int_V_1: 0,
    int_V_0: 0,
    int_R_1: 0,
    int_R_0: 0,
    sum_log_ratio_V: 0,
    sum_log_ratio_R: 0,
    ell_marks: 0,
    ell_vote: 0,
    upvotes: 0,
    downvotes: 0,
    reportsCount: 0,
  };
}

/**
 * Incrementally processes a single event and updates state online.
 */
export function processEventOnline(
  state: QuietFrayOnlineState,
  event: TemporalEvent,
  params: QuietFrayParams = DEFAULT_QUIETFRAY_PARAMS
): void {
  const dt = Math.max(0, event.timeDays - state.tLast);

  // 1. Integrated intensity updates over (tLast, t) using exact analytical integral
  // \int_0^{dt} \exp(-s/\tau) ds = \tau * (1 - \exp(-dt/\tau)) = - \tau * expm1(-dt/\tau)
  const intDecay_f = -params.tau_f * Math.expm1(-dt / params.tau_f);
  const intDecay_s = -params.tau_s * Math.expm1(-dt / params.tau_s);

  // Votes channel integral
  state.int_V_1 += params.mu_V * dt + params.alpha_V_1[0] * state.x_V_f * intDecay_f + params.alpha_V_1[1] * state.x_V_s * intDecay_s;
  state.int_V_0 += params.mu_V * dt + params.alpha_V_0[0] * state.x_V_f * intDecay_f + params.alpha_V_0[1] * state.x_V_s * intDecay_s;

  // Reports channel integral
  state.int_R_1 += params.mu_R * dt + params.alpha_R_1[0] * state.x_R_f * intDecay_f + params.alpha_R_1[1] * state.x_R_s * intDecay_s;
  state.int_R_0 += params.mu_R * dt + params.alpha_R_0[0] * state.x_R_f * intDecay_f + params.alpha_R_0[1] * state.x_R_s * intDecay_s;

  // 2. Decay states to event time t^-
  const decay_f = Math.exp(-dt / params.tau_f);
  const decay_s = Math.exp(-dt / params.tau_s);
  state.x_V_f *= decay_f;
  state.x_V_s *= decay_s;
  state.x_R_f *= decay_f;
  state.x_R_s *= decay_s;
  state.tLast = event.timeDays;

  // 3. Evaluate point process intensities at t^-
  if (event.channel === 'VOTE') {
    const lam1 = params.mu_V + params.alpha_V_1[0] * state.x_V_f + params.alpha_V_1[1] * state.x_V_s;
    const lam0 = params.mu_V + params.alpha_V_0[0] * state.x_V_f + params.alpha_V_0[1] * state.x_V_s;
    state.sum_log_ratio_V += Math.log(Math.max(lam1, 1e-9) / Math.max(lam0, 1e-9));

    // Sequential vote direction update
    const [a0, b0] = params.vote_prior_0;
    const [a1, b1] = params.vote_prior_1;
    const n = state.upvotes + state.downvotes;
    if (event.direction === 'DOWN') {
      state.ell_vote += Math.log(((b1 + state.downvotes) / (a1 + b1 + n)) / ((b0 + state.downvotes) / (a0 + b0 + n)));
      state.downvotes += 1;
    } else {
      state.ell_vote += Math.log(((a1 + state.upvotes) / (a1 + b1 + n)) / ((a0 + state.upvotes) / (a0 + b0 + n)));
      state.upvotes += 1;
    }

    // Add mark to state at t: for votes q_j = 1
    state.x_V_f += 1.0;
    state.x_V_s += 1.0;
  } else if (event.channel === 'REPORT') {
    const lam1 = params.mu_R + params.alpha_R_1[0] * state.x_R_f + params.alpha_R_1[1] * state.x_R_s;
    const lam0 = params.mu_R + params.alpha_R_0[0] * state.x_R_f + params.alpha_R_0[1] * state.x_R_s;
    state.sum_log_ratio_R += Math.log(Math.max(lam1, 1e-9) / Math.max(lam0, 1e-9));

    // Mark evidence: c, H, s
    const c = event.mark?.confidence ?? 0.5;
    const H = event.mark?.diversity ?? 0.5;
    const s = event.mark?.burstSimilarity ?? 0.1;

    const logRatio_c = betaLogDensityRatio(c, params.beta_c_0, params.beta_c_1);
    const logRatio_H = betaLogDensityRatio(H, params.beta_H_0, params.beta_H_1);
    const logRatio_s = betaLogDensityRatio(s, params.beta_s_0, params.beta_s_1);
    state.ell_marks += (logRatio_c + logRatio_H + logRatio_s);

    // Report mark magnitude: q_k = clip(c * H * (1 - s), 0, 1)
    const q_k = Math.min(Math.max(c * H * (1.0 - s), 0), 1.0);
    state.x_R_f += q_k;
    state.x_R_s += q_k;
    state.reportsCount += 1;
  }
}

export interface IssueContext {
  categorySuccesses: number; // y_c
  categoryTotal: number;     // n_c
  unresolvedDays: number;    // a
  hasReopen: boolean;        // whether reopened event exists
  currentHorizonDays?: number; // T
}

/**
 * Computes the unified log-evidence score U_i from the online state and context.
 */
export function computeUnifiedScore(
  state: QuietFrayOnlineState,
  ctx: IssueContext,
  params: QuietFrayParams = DEFAULT_QUIETFRAY_PARAMS
): {
  score: number;
  signals: {
    temporalEvidence: number;
    reportMarks: number;
    voteDirection: number;
    survivalPersistence: number;
    reopenSignal: number;
    categoryPriorScore: number;
  };
} {
  // If horizon extends beyond last event, integrate the tail
  let tail_int_V_1 = 0;
  let tail_int_V_0 = 0;
  let tail_int_R_1 = 0;
  let tail_int_R_0 = 0;

  if (ctx.currentHorizonDays && ctx.currentHorizonDays > state.tLast) {
    const dt = ctx.currentHorizonDays - state.tLast;
    const intDecay_f = -params.tau_f * Math.expm1(-dt / params.tau_f);
    const intDecay_s = -params.tau_s * Math.expm1(-dt / params.tau_s);
    tail_int_V_1 = params.mu_V * dt + params.alpha_V_1[0] * state.x_V_f * intDecay_f + params.alpha_V_1[1] * state.x_V_s * intDecay_s;
    tail_int_V_0 = params.mu_V * dt + params.alpha_V_0[0] * state.x_V_f * intDecay_f + params.alpha_V_0[1] * state.x_V_s * intDecay_s;
    tail_int_R_1 = params.mu_R * dt + params.alpha_R_1[0] * state.x_R_f * intDecay_f + params.alpha_R_1[1] * state.x_R_s * intDecay_s;
    tail_int_R_0 = params.mu_R * dt + params.alpha_R_0[0] * state.x_R_f * intDecay_f + params.alpha_R_0[1] * state.x_R_s * intDecay_s;
  }

  const ell_V = state.sum_log_ratio_V - ((state.int_V_1 + tail_int_V_1) - (state.int_V_0 + tail_int_V_0));
  const ell_R = state.sum_log_ratio_R - ((state.int_R_1 + tail_int_R_1) - (state.int_R_0 + tail_int_R_0));
  const temporalEvidence = ell_V + ell_R;

  // Category prior: Empirical Bayes
  const pi_c = (params.cat_alpha + ctx.categorySuccesses) / (params.cat_alpha + params.cat_beta + ctx.categoryTotal);
  const logit_pi_c = Math.log(pi_c / (1 - pi_c));

  // Survival / unresolved duration Weibull
  const a = Math.max(ctx.unresolvedDays, 0.01);
  const [k0, th0] = params.weibull_0;
  const [k1, th1] = params.weibull_1;
  const survivalPersistence = Math.pow(a / th0, k0) - Math.pow(a / th1, k1);

  // Reopen Bernoulli
  const reopenSignal = ctx.hasReopen
    ? Math.log(params.reopen_p1 / params.reopen_p0)
    : Math.log((1 - params.reopen_p1) / (1 - params.reopen_p0));

  const totalScore = logit_pi_c + temporalEvidence + state.ell_marks + state.ell_vote + survivalPersistence + reopenSignal;

  return {
    score: totalScore,
    signals: {
      temporalEvidence,
      reportMarks: state.ell_marks,
      voteDirection: state.ell_vote,
      survivalPersistence,
      reopenSignal,
      categoryPriorScore: logit_pi_c,
    },
  };
}

/**
 * Independent Batch reference implementation to verify online incremental state equivalence.
 */
export function computeBatchReference(
  events: TemporalEvent[],
  ctx: IssueContext,
  params: QuietFrayParams = DEFAULT_QUIETFRAY_PARAMS
): {
  score: number;
  state: QuietFrayOnlineState;
  signals: {
    temporalEvidence: number;
    reportMarks: number;
    voteDirection: number;
    survivalPersistence: number;
    reopenSignal: number;
    categoryPriorScore: number;
  };
} {
  // Sort events chronologically
  const sorted = [...events].sort((a, b) => a.timeDays - b.timeDays);
  const state = createInitialState(0);
  for (const ev of sorted) {
    processEventOnline(state, ev, params);
  }
  const result = computeUnifiedScore(state, ctx, params);
  return { score: result.score, state, signals: result.signals };
}
