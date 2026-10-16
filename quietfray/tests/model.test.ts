// ============================================================================
// QUIETFRAY v0.1 — AUTOMATED TEST SUITE
// Aligned with Section 25.5 of Master Product Brief
// ============================================================================

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUIETFRAY_PARAMS,
  TemporalEvent,
  betaLogDensityRatio,
  computeBatchReference,
  computeUnifiedScore,
  createInitialState,
  processEventOnline,
} from '../src/model';
import {
  generateSyntheticScenarios,
  runAblations,
  runBenchmarkSuite,
} from '../src/benchmarks';

describe('QuietFray v0.1 Core Point Process Model', () => {
  it('satisfies subcritical branching mass condition (nu < 1)', () => {
    const p = DEFAULT_QUIETFRAY_PARAMS;
    const nu_V_0 = p.alpha_V_0[0] * p.tau_f + p.alpha_V_0[1] * p.tau_s;
    const nu_V_1 = p.alpha_V_1[0] * p.tau_f + p.alpha_V_1[1] * p.tau_s;
    const nu_R_0 = p.alpha_R_0[0] * p.tau_f + p.alpha_R_0[1] * p.tau_s;
    const nu_R_1 = p.alpha_R_1[0] * p.tau_f + p.alpha_R_1[1] * p.tau_s;

    // From Section 11.12:
    // Votes H0: 12.0*0.02 + 0.025*3.0 = 0.24 + 0.075 = 0.315 < 1
    // Votes H1: 0.35*0.02 + 0.16*3.0 = 0.007 + 0.48 = 0.487 < 1
    // Reports H0: 15.0*0.02 + 0.020*3.0 = 0.30 + 0.060 = 0.360 < 1
    // Reports H1: 0.50*0.02 + 0.18*3.0 = 0.010 + 0.54 = 0.550 < 1
    expect(nu_V_0).toBeCloseTo(0.315, 3);
    expect(nu_V_1).toBeCloseTo(0.487, 3);
    expect(nu_R_0).toBeCloseTo(0.360, 3);
    expect(nu_R_1).toBeCloseTo(0.550, 3);

    expect(nu_V_0).toBeLessThan(1.0);
    expect(nu_V_1).toBeLessThan(1.0);
    expect(nu_R_0).toBeLessThan(1.0);
    expect(nu_R_1).toBeLessThan(1.0);
  });

  it('guarantees online incremental processing matches batch reference', () => {
    const events: TemporalEvent[] = [
      { timeDays: 0.2, channel: 'REPORT', mark: { confidence: 0.8, diversity: 0.7, burstSimilarity: 0.1 } },
      { timeDays: 0.5, channel: 'VOTE', direction: 'UP' },
      { timeDays: 1.2, channel: 'VOTE', direction: 'UP' },
      { timeDays: 3.5, channel: 'REPORT', mark: { confidence: 0.9, diversity: 0.6, burstSimilarity: 0.05 } },
      { timeDays: 5.0, channel: 'VOTE', direction: 'DOWN' },
      { timeDays: 7.8, channel: 'VOTE', direction: 'UP' },
    ];

    const ctx = {
      categorySuccesses: 10,
      categoryTotal: 30,
      unresolvedDays: 10,
      hasReopen: false,
      currentHorizonDays: 12,
    };

    // Incremental online update
    const onlineState = createInitialState(0);
    for (const ev of events) {
      processEventOnline(onlineState, ev);
    }
    const onlineRes = computeUnifiedScore(onlineState, ctx);

    // Batch reference
    const batchRes = computeBatchReference(events, ctx);

    expect(onlineRes.score).toBeCloseTo(batchRes.score, 6);
    expect(onlineState.x_V_f).toBeCloseTo(batchRes.state.x_V_f, 6);
    expect(onlineState.x_V_s).toBeCloseTo(batchRes.state.x_V_s, 6);
    expect(onlineState.x_R_f).toBeCloseTo(batchRes.state.x_R_f, 6);
    expect(onlineState.x_R_s).toBeCloseTo(batchRes.state.x_R_s, 6);
  });

  it('computes numerically stable beta density ratios without NaN or Infinity', () => {
    // Extreme edge values
    const r0 = betaLogDensityRatio(0.000001, [3, 4], [8, 2]);
    const r1 = betaLogDensityRatio(0.999999, [3, 4], [8, 2]);
    const rMid = betaLogDensityRatio(0.5, [3, 4], [8, 2]);

    expect(Number.isFinite(r0)).toBe(true);
    expect(Number.isFinite(r1)).toBe(true);
    expect(Number.isFinite(rMid)).toBe(true);
  });
});

describe('QuietFray v0.1 Benchmarks & Ablations Suite', () => {
  it('generates deterministic synthetic scenarios with known seeds', () => {
    const s1 = generateSyntheticScenarios(1234);
    const s2 = generateSyntheticScenarios(1234);

    expect(s1.length).toBe(s2.length);
    expect(s1[0].events.length).toBe(s2[0].events.length);
    expect(s1[0].events[0].timeDays).toBe(s2[0].events[0].timeDays);
  });

  it('runs benchmark suite comparing QuietFray against baselines', () => {
    const results = runBenchmarkSuite(42);
    expect(results.length).toBe(6);

    const qf = results.find((r) => r.modelName.includes('QuietFray'));
    expect(qf).toBeDefined();
    expect(qf!.ndcgAt3).toBeGreaterThan(0.5);

    // Verify all baseline models produced ranking outputs
    for (const res of results) {
      expect(res.ranking.length).toBeGreaterThan(0);
      expect(Number.isFinite(res.ndcgAt3)).toBe(true);
      expect(Number.isFinite(res.ndcgAt5)).toBe(true);
    }
  });

  it('runs ablation study correctly', () => {
    const ablations = runAblations(42);
    expect(ablations.length).toBe(4);
    for (const a of ablations) {
      expect(Number.isFinite(a.ndcgAt3)).toBe(true);
      expect(Number.isFinite(a.ndcgAt5)).toBe(true);
    }
  });
});
