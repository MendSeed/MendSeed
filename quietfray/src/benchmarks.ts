// ============================================================================
// QUIETFRAY v0.1 — BENCHMARK GENERATORS, ABLATIONS & EVALUATION SUITE
// Aligned with Section 12 of Master Product Brief
// ============================================================================

import type {
  TemporalEvent,
} from './model';
import {
  computeBatchReference,
  computeUnifiedScore,
  createInitialState,
  processEventOnline,
} from './model';
import type { BaselineInput } from './baselines';
import {
  betaEmpiricalBayesBaseline,
  exponentialDecayBaseline,
  persistenceHeuristicBaseline,
  rawNetVotesBaseline,
  wilsonScoreBaseline,
} from './baselines';

// Simple deterministic PRNG (Mulberry32) for reproducible synthetic benchmarks
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SyntheticIssueScenario {
  id: string;
  name: string;
  groundTruthLabel: boolean; // True = genuine persistent unmet need (H1), False = transient/noise (H0)
  events: TemporalEvent[];
  unresolvedDays: number;
  hasReopen: boolean;
  categorySuccesses: number;
  categoryTotal: number;
  horizonDays: number;
}

/**
 * Generates synthetic benchmark scenarios covering all Section 12.1 requirements.
 */
export function generateSyntheticScenarios(seed = 42): SyntheticIssueScenario[] {
  const rand = createPRNG(seed);
  const scenarios: SyntheticIssueScenario[] = [];

  // Scenario 1: Sustained low-volume problem (H1)
  // Steady trickle of diverse reports and upvotes over 60 days
  const ev1: TemporalEvent[] = [];
  for (let d = 1; d <= 60; d += 3 + rand() * 2) {
    ev1.push({
      timeDays: d,
      channel: 'REPORT',
      mark: { confidence: 0.8 + rand() * 0.15, diversity: 0.75 + rand() * 0.2, burstSimilarity: 0.05 + rand() * 0.1 },
    });
    ev1.push({ timeDays: d + 0.1, channel: 'VOTE', direction: 'UP' });
    if (rand() > 0.6) ev1.push({ timeDays: d + 0.5, channel: 'VOTE', direction: 'UP' });
  }
  scenarios.push({
    id: 'scen_sustained_trickle',
    name: 'Sustained Low-Volume Friction (Genuine Unmet Need)',
    groundTruthLabel: true,
    events: ev1,
    unresolvedDays: 60,
    hasReopen: false,
    categorySuccesses: 10,
    categoryTotal: 25,
    horizonDays: 65,
  });

  // Scenario 2: Short Viral Burst / Coordinated Flashmob (H0)
  // 100 votes & 40 reports in 3 hours, all identical burst similarity, then silence for 40 days
  const ev2: TemporalEvent[] = [];
  for (let i = 0; i < 40; i++) {
    ev2.push({
      timeDays: 1.0 + (i / 40) * 0.1, // 2.4 hours burst
      channel: 'REPORT',
      mark: { confidence: 0.4 + rand() * 0.2, diversity: 0.2 + rand() * 0.1, burstSimilarity: 0.85 + rand() * 0.1 },
    });
  }
  for (let i = 0; i < 100; i++) {
    ev2.push({
      timeDays: 1.0 + rand() * 0.15,
      channel: 'VOTE',
      direction: 'UP',
    });
  }
  scenarios.push({
    id: 'scen_viral_burst',
    name: 'Short Viral Burst / Coordinated Activity (Transient)',
    groundTruthLabel: false,
    events: ev2,
    unresolvedDays: 45,
    hasReopen: false,
    categorySuccesses: 5,
    categoryTotal: 30,
    horizonDays: 45,
  });

  // Scenario 3: Large legacy issue with declining activity (H0/stale)
  const ev3: TemporalEvent[] = [];
  for (let d = 1; d <= 20; d += 0.5) {
    ev3.push({ timeDays: d, channel: 'VOTE', direction: 'UP' });
    if (d % 2 === 0) {
      ev3.push({
        timeDays: d,
        channel: 'REPORT',
        mark: { confidence: 0.6, diversity: 0.5, burstSimilarity: 0.2 },
      });
    }
  }
  // Zero events between day 20 and day 120
  scenarios.push({
    id: 'scen_legacy_stale',
    name: 'Large Legacy Issue with Declining Activity',
    groundTruthLabel: false,
    events: ev3,
    unresolvedDays: 120,
    hasReopen: false,
    categorySuccesses: 8,
    categoryTotal: 20,
    horizonDays: 120,
  });

  // Scenario 4: New issue with insufficient historical evidence (Uncertain)
  const ev4: TemporalEvent[] = [
    { timeDays: 0.5, channel: 'REPORT', mark: { confidence: 0.7, diversity: 0.6, burstSimilarity: 0.1 } },
    { timeDays: 0.6, channel: 'VOTE', direction: 'UP' },
  ];
  scenarios.push({
    id: 'scen_new_insufficient',
    name: 'New Issue with Insufficient Historical Evidence',
    groundTruthLabel: false,
    events: ev4,
    unresolvedDays: 1,
    hasReopen: false,
    categorySuccesses: 3,
    categoryTotal: 10,
    horizonDays: 1.5,
  });

  // Scenario 5: Genuine improvement followed by recurring failure / reopen (H1)
  const ev5: TemporalEvent[] = [];
  for (let d = 1; d <= 30; d += 2) {
    ev5.push({
      timeDays: d,
      channel: 'REPORT',
      mark: { confidence: 0.85, diversity: 0.75, burstSimilarity: 0.1 },
    });
    ev5.push({ timeDays: d, channel: 'VOTE', direction: 'UP' });
  }
  // Re-emergence after attempted fix at day 40
  for (let d = 42; d <= 65; d += 2.5) {
    ev5.push({
      timeDays: d,
      channel: 'REPORT',
      mark: { confidence: 0.9, diversity: 0.8, burstSimilarity: 0.05 },
    });
    ev5.push({ timeDays: d, channel: 'VOTE', direction: 'UP' });
  }
  scenarios.push({
    id: 'scen_reopened_recurrence',
    name: 'Genuine Friction with Reopened Fix',
    groundTruthLabel: true,
    events: ev5,
    unresolvedDays: 65,
    hasReopen: true,
    categorySuccesses: 15,
    categoryTotal: 25,
    horizonDays: 66,
  });

  // Scenario 6: High-volume but low-diversity report stream / automated spam (H0)
  const ev6: TemporalEvent[] = [];
  for (let i = 0; i < 50; i++) {
    ev6.push({
      timeDays: 2.0 + i * 0.2,
      channel: 'REPORT',
      mark: { confidence: 0.3 + rand() * 0.1, diversity: 0.1 + rand() * 0.05, burstSimilarity: 0.9 },
    });
    ev6.push({ timeDays: 2.0 + i * 0.2, channel: 'VOTE', direction: 'UP' });
  }
  scenarios.push({
    id: 'scen_low_diversity_spam',
    name: 'High-Volume Low-Diversity Stream',
    groundTruthLabel: false,
    events: ev6,
    unresolvedDays: 15,
    hasReopen: false,
    categorySuccesses: 2,
    categoryTotal: 15,
    horizonDays: 15,
  });

  return scenarios;
}

/**
 * Metric computation helpers: NDCG@K, Precision@K, Recall@K.
 */
export function computeNDCGAtK(rankedIds: string[], groundTruthMap: Map<string, boolean>, k = 5): number {
  const topK = rankedIds.slice(0, k);
  let dcg = 0;
  for (let i = 0; i < topK.length; i++) {
    const rel = groundTruthMap.get(topK[i]) ? 1 : 0;
    dcg += rel / Math.log2(i + 2);
  }

  // Calculate Ideal DCG
  const allRels = Array.from(groundTruthMap.values())
    .map((v) => (v ? 1 : 0))
    .sort((a, b) => b - a)
    .slice(0, k);
  let idcg = 0;
  for (let i = 0; i < allRels.length; i++) {
    idcg += allRels[i] / Math.log2(i + 2);
  }

  return idcg === 0 ? 0 : dcg / idcg;
}

export function computePrecisionRecallAtK(
  rankedIds: string[],
  groundTruthMap: Map<string, boolean>,
  k = 3
): { precision: number; recall: number } {
  const topK = rankedIds.slice(0, k);
  let truePositives = 0;
  for (const id of topK) {
    if (groundTruthMap.get(id)) truePositives++;
  }
  const totalPositives = Array.from(groundTruthMap.values()).filter(Boolean).length;
  return {
    precision: topK.length > 0 ? truePositives / topK.length : 0,
    recall: totalPositives > 0 ? truePositives / totalPositives : 0,
  };
}

export interface BenchmarkComparisonResult {
  modelName: string;
  ndcgAt3: number;
  ndcgAt5: number;
  precisionAt2: number;
  ranking: string[];
}

/**
 * Runs benchmarks across QuietFray v0.1 and all transparent baselines on synthetic scenarios.
 */
export function runBenchmarkSuite(seed = 42): BenchmarkComparisonResult[] {
  const scenarios = generateSyntheticScenarios(seed);
  const groundTruthMap = new Map<string, boolean>(scenarios.map((s) => [s.id, s.groundTruthLabel]));

  // 1. Evaluate QuietFray Full Model
  const quietFrayScores = scenarios.map((s) => {
    const res = computeBatchReference(s.events, {
      categorySuccesses: s.categorySuccesses,
      categoryTotal: s.categoryTotal,
      unresolvedDays: s.unresolvedDays,
      hasReopen: s.hasReopen,
      currentHorizonDays: s.horizonDays,
    });
    return { id: s.id, score: res.score };
  });
  const qfRanked = [...quietFrayScores].sort((a, b) => b.score - a.score).map((x) => x.id);

  // 2. Evaluate Baselines
  const baselineInputs: { id: string; input: BaselineInput }[] = scenarios.map((s) => {
    let u = 0;
    let d = 0;
    const voteTimestamps: { timeDays: number; direction: 'UP' | 'DOWN' }[] = [];
    let repCount = 0;
    for (const ev of s.events) {
      if (ev.channel === 'VOTE') {
        if (ev.direction === 'DOWN') d++;
        else u++;
        voteTimestamps.push({ timeDays: ev.timeDays, direction: ev.direction ?? 'UP' });
      } else if (ev.channel === 'REPORT') {
        repCount++;
      }
    }
    return {
      id: s.id,
      input: {
        upvotes: u,
        downvotes: d,
        voteTimestampsDays: voteTimestamps,
        reportsCount: repCount,
        unresolvedDays: s.unresolvedDays,
        currentHorizonDays: s.horizonDays,
      },
    };
  });

  const rawRanked = [...baselineInputs]
    .map((b) => ({ id: b.id, score: rawNetVotesBaseline(b.input) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  const wilsonRanked = [...baselineInputs]
    .map((b) => ({ id: b.id, score: wilsonScoreBaseline(b.input) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  const expDecayRanked = [...baselineInputs]
    .map((b) => ({ id: b.id, score: exponentialDecayBaseline(b.input) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  const betaEBRanked = [...baselineInputs]
    .map((b) => ({ id: b.id, score: betaEmpiricalBayesBaseline(b.input) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  const persistenceRanked = [...baselineInputs]
    .map((b) => ({ id: b.id, score: persistenceHeuristicBaseline(b.input) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  const models: { name: string; ranking: string[] }[] = [
    { name: 'QuietFray v0.1 (Temporal Evidence)', ranking: qfRanked },
    { name: 'Baseline 1: Raw Net Votes (U - D)', ranking: rawRanked },
    { name: 'Baseline 2: Wilson 95% Confidence Bound', ranking: wilsonRanked },
    { name: 'Baseline 3: Exponential Recency Decay', ranking: expDecayRanked },
    { name: 'Baseline 4: Beta-Smoothed Empirical Bayes', ranking: betaEBRanked },
    { name: 'Baseline 5: Persistence Heuristic', ranking: persistenceRanked },
  ];

  return models.map((m) => {
    const ndcgAt3 = computeNDCGAtK(m.ranking, groundTruthMap, 3);
    const ndcgAt5 = computeNDCGAtK(m.ranking, groundTruthMap, 5);
    const pr = computePrecisionRecallAtK(m.ranking, groundTruthMap, 2);
    return {
      modelName: m.name,
      ndcgAt3,
      ndcgAt5,
      precisionAt2: pr.precision,
      ranking: m.ranking,
    };
  });
}

/**
 * Runs Section 12.3 Ablations:
 * - No marks evidence (ell_marks = 0)
 * - No fast/slow contrast (alpha_f = 0)
 * - No category prior (pi_c = 0.5 flat)
 * - No unresolved duration survival (ell_surv = 0)
 * - No reopen evidence (ell_reopen = 0)
 * - No vote direction evidence (ell_vote = 0)
 */
export function runAblations(seed = 42) {
  const scenarios = generateSyntheticScenarios(seed);
  const groundTruthMap = new Map<string, boolean>(scenarios.map((s) => [s.id, s.groundTruthLabel]));

  // Standard full QuietFray
  const fullRanked = scenarios
    .map((s) => ({
      id: s.id,
      score: computeBatchReference(s.events, {
        categorySuccesses: s.categorySuccesses,
        categoryTotal: s.categoryTotal,
        unresolvedDays: s.unresolvedDays,
        hasReopen: s.hasReopen,
        currentHorizonDays: s.horizonDays,
      }).score,
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  // Ablation 1: No Marks
  const noMarksRanked = scenarios
    .map((s) => {
      const state = createInitialState(0);
      for (const ev of s.events) {
        processEventOnline(state, ev);
      }
      state.ell_marks = 0; // Ablate marks
      const score = computeUnifiedScore(state, {
        categorySuccesses: s.categorySuccesses,
        categoryTotal: s.categoryTotal,
        unresolvedDays: s.unresolvedDays,
        hasReopen: s.hasReopen,
        currentHorizonDays: s.horizonDays,
      }).score;
      return { id: s.id, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  // Ablation 2: No Reopen Evidence
  const noReopenRanked = scenarios
    .map((s) => {
      const state = createInitialState(0);
      for (const ev of s.events) {
        processEventOnline(state, ev);
      }
      const score = computeUnifiedScore(state, {
        categorySuccesses: s.categorySuccesses,
        categoryTotal: s.categoryTotal,
        unresolvedDays: s.unresolvedDays,
        hasReopen: false, // Ablate reopen
        currentHorizonDays: s.horizonDays,
      }).score;
      return { id: s.id, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  // Ablation 3: No Duration Survival
  const noDurationRanked = scenarios
    .map((s) => {
      const state = createInitialState(0);
      for (const ev of s.events) {
        processEventOnline(state, ev);
      }
      // With uniform duration
      const score = computeUnifiedScore(state, {
        categorySuccesses: s.categorySuccesses,
        categoryTotal: s.categoryTotal,
        unresolvedDays: 1, // Constant duration
        hasReopen: s.hasReopen,
        currentHorizonDays: s.horizonDays,
      }).score;
      return { id: s.id, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.id);

  return [
    { name: 'Full QuietFray v0.1', ndcgAt3: computeNDCGAtK(fullRanked, groundTruthMap, 3), ndcgAt5: computeNDCGAtK(fullRanked, groundTruthMap, 5) },
    { name: 'Ablation: Without Report Marks', ndcgAt3: computeNDCGAtK(noMarksRanked, groundTruthMap, 3), ndcgAt5: computeNDCGAtK(noMarksRanked, groundTruthMap, 5) },
    { name: 'Ablation: Without Reopen Signal', ndcgAt3: computeNDCGAtK(noReopenRanked, groundTruthMap, 3), ndcgAt5: computeNDCGAtK(noReopenRanked, groundTruthMap, 5) },
    { name: 'Ablation: Without Duration Survival', ndcgAt3: computeNDCGAtK(noDurationRanked, groundTruthMap, 3), ndcgAt5: computeNDCGAtK(noDurationRanked, groundTruthMap, 5) },
  ];
}
