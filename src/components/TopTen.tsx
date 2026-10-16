// ============================================================================
// TOP 10 PROBLEMS PEOPLE WANT SOLVED
// Mandatory Section 9.2 D of Master Product Brief
// Modes: Trending, Most Supported, Newest (Zero Dummy Data)
// ============================================================================

import React, { useState } from 'react';
import { ArrowUpRight, Flame, Layers, Sparkles, ThumbsUp } from 'lucide-react';
import type { CanonicalIssue } from '../types';
import { CATEGORY_LABELS } from '../types';

interface TopTenProps {
  issues: CanonicalIssue[];
  onSelectIssue: (issue: CanonicalIssue) => void;
  onVote: (issueId: string, e: React.MouseEvent) => void;
  userVotes: Record<string, 'UP' | 'DOWN' | null>;
}

export const TopTen: React.FC<TopTenProps> = ({
  issues,
  onSelectIssue,
  onVote,
  userVotes,
}) => {
  const [mode, setMode] = useState<'trending' | 'most_supported' | 'newest'>('trending');

  // Compute ranking based on mode
  const sorted = [...issues].sort((a, b) => {
    if (mode === 'most_supported') {
      return b.supportCount - a.supportCount;
    }
    if (mode === 'newest') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
    const aTime = new Date(a.lastActivityAt).getTime();
    const bTime = new Date(b.lastActivityAt).getTime();
    return b.supportCount * 0.4 + b.reportCount * 3 + bTime / 1e11 - (a.supportCount * 0.4 + a.reportCount * 3 + aTime / 1e11);
  });

  const top10 = sorted.slice(0, 10);

  return (
    <section className="py-12 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="page-container">
        {/* Section Header & Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="section-subheader mb-1">Public Priorities</div>
            <h2 className="section-header text-[var(--color-paper)]">
              The 10 problems people want solved.
            </h2>
            <p className="text-sm text-[var(--color-gray)] max-w-xl mt-1">
              Real community friction ranked transparently by votes, evidence momentum, and recency.
            </p>
          </div>

          {/* 3 Ranking Modes */}
          <div className="flex items-center gap-1 p-1 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-md)] self-start md:self-auto">
            <button
              onClick={() => setMode('trending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-0 ${
                mode === 'trending'
                  ? 'bg-[var(--color-lime)] text-black font-bold'
                  : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Trending</span>
            </button>
            <button
              onClick={() => setMode('most_supported')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-0 ${
                mode === 'most_supported'
                  ? 'bg-[var(--color-lime)] text-black font-bold'
                  : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Most Supported</span>
            </button>
            <button
              onClick={() => setMode('newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-0 ${
                mode === 'newest'
                  ? 'bg-[var(--color-lime)] text-black font-bold'
                  : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Newest</span>
            </button>
          </div>
        </div>

        {/* Top 10 List or Empty State */}
        {top10.length === 0 ? (
          <div className="empty-state card p-12 text-center">
            <Sparkles className="w-8 h-8 text-[var(--color-lime)] mx-auto mb-3" />
            <h3 className="font-bold text-lg text-[var(--color-paper)] mb-2">No Community Problems Yet</h3>
            <p className="text-sm text-[var(--color-gray)] max-w-md mx-auto">
              As soon as real problems are reported and verified, the top 10 priorities will emerge here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {top10.map((issue, index) => {
              const rankStr = (index + 1).toString().padStart(2, '0');
              const userVote = userVotes[issue.id];

              return (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="py-4 sm:py-5 flex items-start gap-4 sm:gap-6 hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer px-2 sm:px-4 -mx-2 sm:-mx-4 rounded-[var(--radius-sm)] group"
                >
                  {/* Number 01-10 */}
                  <div className="font-mono text-2xl font-bold text-[var(--color-gray-dark)] group-hover:text-[var(--color-lime)] transition-colors shrink-0">
                    {rankStr}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="badge badge-lime">{CATEGORY_LABELS[issue.category]}</span>
                      <span
                        className={`badge ${
                          issue.status === 'SOLVED'
                            ? 'badge-success'
                            : issue.status === 'BEING_BUILT'
                            ? 'badge-info'
                            : 'badge-gray'
                        }`}
                      >
                        {issue.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[var(--color-paper)] group-hover:text-[var(--color-lime)] transition-colors truncate">
                      {issue.title}
                    </h3>

                    <p className="text-sm text-[var(--color-gray)] line-clamp-2 mt-1">
                      {issue.problemStatement}
                    </p>

                    <div className="flex items-center gap-4 mt-2.5 text-xs font-mono text-[var(--color-gray-dark)]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {issue.reportCount} reports
                      </span>
                      {issue.solutions.length > 0 && (
                        <span className="text-[var(--color-info)]">
                          {issue.solutions.length} solutions proposed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vote Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={(e) => onVote(issue.id, e)}
                      className={`vote-btn ${userVote === 'UP' ? 'voted' : ''}`}
                      title="Support anonymously"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{issue.supportCount}</span>
                    </button>
                    <ArrowUpRight className="w-4 h-4 text-[var(--color-gray)] group-hover:text-[var(--color-lime)] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
