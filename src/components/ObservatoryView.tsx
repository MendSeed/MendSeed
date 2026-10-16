// ============================================================================
// OPPORTUNITY OBSERVATORY & QUIETFRAY BENCHMARK LAB
// Aligned with Section 9.2 H, 11, 12 of Master Product Brief
// ============================================================================

import React, { useState } from 'react';
import {
  Activity,
  Compass,
  Cpu,
  Play,
} from 'lucide-react';
import type { CanonicalIssue } from '../types';
import { CATEGORY_LABELS } from '../types';
import type { BenchmarkComparisonResult } from '../../quietfray/src/benchmarks';
import {
  runAblations,
  runBenchmarkSuite,
} from '../../quietfray/src/benchmarks';

interface ObservatoryViewProps {
  issues: CanonicalIssue[];
  onSelectIssue: (issue: CanonicalIssue) => void;
}

export const ObservatoryView: React.FC<ObservatoryViewProps> = ({ issues, onSelectIssue }) => {
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkComparisonResult[] | null>(null);
  const [ablationResults, setAblationResults] = useState<{ name: string; ndcgAt3: number; ndcgAt5: number }[] | null>(null);
  const [isRunningBenchmarks, setIsRunningBenchmarks] = useState(false);

  // Issues sorted by QuietFray opportunity score
  const qfRanked = [...issues]
    .filter((iss) => iss.quietFray)
    .sort((a, b) => (b.quietFray?.score ?? 0) - (a.quietFray?.score ?? 0));

  // Persistent unresolved problems: unresolved for > 45 days
  const persistentUnresolved = [...issues].filter((iss) => {
    const pub = new Date(iss.publishedAt).getTime();
    const days = (Date.now() - pub) / (1000 * 60 * 60 * 24);
    return days > 45 && iss.status !== 'SOLVED';
  });

  const handleRunBenchmarks = () => {
    setIsRunningBenchmarks(true);
    setTimeout(() => {
      const bRes = runBenchmarkSuite(42);
      const aRes = runAblations(42);
      setBenchmarkResults(bRes);
      setAblationResults(aRes);
      setIsRunningBenchmarks(false);
    }, 200);
  };

  return (
    <div className="py-12 bg-[var(--color-ink)]">
      <div className="page-container">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <div className="section-subheader flex items-center gap-1.5 mb-1 text-[var(--color-lime)]">
            <Compass className="w-4 h-4" />
            <span>Research Observatory & Model Card</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-paper)] tracking-tight mb-4">
            QuietFray v0.1 Opportunity Observatory
          </h1>
          <p className="text-base text-[var(--color-gray-light)] leading-relaxed">
            QuietFray is a category-aware temporal evidence model. It estimates whether an issue exhibits evidence patterns associated with persistent, unresolved friction—contrasting sustained accumulation against transient viral spikes.
          </p>
        </div>

        {/* Live Opportunity Ranking Grid */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-paper)]">
                Highest Opportunity Index (QuietFray Ranked)
              </h2>
              <p className="text-xs text-[var(--color-gray)]">
                Ranked by candidate log-evidence score U_i across all temporal channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qfRanked.slice(0, 6).map((iss) => (
              <div
                key={iss.id}
                onClick={() => onSelectIssue(iss)}
                className="card card-hover p-4 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="badge badge-lime text-[10px]">{CATEGORY_LABELS[iss.category]}</span>
                    <span className="font-mono text-xs text-[var(--color-lime)] font-bold">
                      QF: {iss.quietFray?.score.toFixed(2)}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--color-paper)] group-hover:text-[var(--color-lime)] transition-colors mb-2 line-clamp-2">
                    {iss.title}
                  </h3>
                  <p className="text-xs text-[var(--color-gray-light)] line-clamp-2 leading-relaxed">
                    {iss.problemStatement}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] font-mono text-[var(--color-gray)]">
                  <span>{iss.reportCount} reports</span>
                  <span>{iss.supportCount} votes</span>
                  <span className="text-[var(--color-lime)]">View evidence →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Persistent Unresolved Friction Section */}
        <div className="mb-14 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
          <div className="flex items-center gap-2 mb-2 text-xs font-mono text-[var(--color-warning)] font-bold">
            <Activity className="w-4 h-4" />
            <span>High-Duration Unresolved Issues (&gt; 45 Days)</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-paper)] mb-2">
            Persistent Friction Needing Builder Investigation
          </h2>
          <p className="text-xs text-[var(--color-gray)] mb-4 max-w-2xl leading-relaxed">
            Problems that have remained active without verified resolution. Builders can claim these issues or review existing candidate prototypes.
          </p>

          <div className="divide-y divide-[var(--color-border)]">
            {persistentUnresolved.map((iss) => (
              <div
                key={iss.id}
                onClick={() => onSelectIssue(iss)}
                className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--color-surface-raised)] -mx-3 px-3 rounded-[var(--radius-sm)] transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[var(--color-paper)] hover:text-[var(--color-lime)] truncate">
                    {iss.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--color-gray)] mt-0.5">
                    <span>{CATEGORY_LABELS[iss.category]}</span>
                    <span>{iss.reportCount} reports</span>
                    <span>Status: {iss.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm shrink-0">Investigate</button>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Benchmark Runner (Section 12) */}
        <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-lime)] font-bold mb-1">
                <Cpu className="w-4 h-4" />
                <span>Synthetic Benchmark & Ablation Verification Lab</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--color-paper)]">
                Reproducible QuietFray v0.1 Evaluation
              </h2>
              <p className="text-xs text-[var(--color-gray)] mt-1">
                Execute Section 12 test scenarios (sustained vs viral burst, legacy decay, reopen recurrence) in-browser.
              </p>
            </div>

            <button
              onClick={handleRunBenchmarks}
              disabled={isRunningBenchmarks}
              className="btn btn-primary btn-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningBenchmarks ? 'Running Benchmark Suite...' : 'Run Benchmark Suite'}</span>
            </button>
          </div>

          {benchmarkResults ? (
            <div className="space-y-6 pt-4 border-t border-[var(--color-border)]">
              {/* Baseline Comparison Table */}
              <div>
                <h4 className="font-mono text-xs uppercase text-[var(--color-gray)] font-bold mb-3">
                  Model Ranking Comparison on Synthetic Scenarios (NDCG & Precision)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border border-[var(--color-border)]">
                    <thead className="bg-[var(--color-ink)] text-[var(--color-gray)]">
                      <tr>
                        <th className="p-2.5 border-b border-[var(--color-border)]">Model / Baseline</th>
                        <th className="p-2.5 border-b border-[var(--color-border)] text-right">NDCG@3</th>
                        <th className="p-2.5 border-b border-[var(--color-border)] text-right">NDCG@5</th>
                        <th className="p-2.5 border-b border-[var(--color-border)] text-right">Precision@2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {benchmarkResults.map((b) => (
                        <tr
                          key={b.modelName}
                          className={b.modelName.includes('QuietFray') ? 'bg-[var(--color-lime)]/5 font-bold' : ''}
                        >
                          <td className="p-2.5 text-[var(--color-paper)]">
                            {b.modelName.includes('QuietFray') && (
                              <span className="text-[var(--color-lime)] mr-1.5">★</span>
                            )}
                            {b.modelName}
                          </td>
                          <td className="p-2.5 text-right text-[var(--color-lime)]">{b.ndcgAt3.toFixed(3)}</td>
                          <td className="p-2.5 text-right">{b.ndcgAt5.toFixed(3)}</td>
                          <td className="p-2.5 text-right">{(b.precisionAt2 * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ablation Table */}
              {ablationResults && (
                <div>
                  <h4 className="font-mono text-xs uppercase text-[var(--color-gray)] font-bold mb-3">
                    Ablation Study (Evaluating Signal Component Contributions)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {ablationResults.map((a) => (
                      <div
                        key={a.name}
                        className="p-3 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-sm)]"
                      >
                        <div className="text-[11px] font-bold text-[var(--color-paper)] mb-1 truncate">
                          {a.name}
                        </div>
                        <div className="text-xs font-mono text-[var(--color-lime)]">
                          NDCG@3: {a.ndcgAt3.toFixed(3)}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--color-gray)]">
                          NDCG@5: {a.ndcgAt5.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-center text-xs font-mono text-[var(--color-gray)]">
              Click "Run Benchmark Suite" to compute synthetic ranking metrics and ablation comparisons against transparent baselines.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
