// ============================================================================
// PROBLEM STREAM — SEARCHABLE, FILTERABLE MAIN FEED
// Modern Observatory Aesthetic
// ============================================================================

import React from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Compass,
  FileText,
  Flame,
  Hammer,
  HelpCircle,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import type { CanonicalIssue, Category, IssueStatus } from '../types';
import { CATEGORY_LABELS } from '../types';

interface ProblemStreamProps {
  issues: CanonicalIssue[];
  rankingMode: 'trending' | 'most_supported' | 'newest' | 'quietfray';
  setRankingMode: (mode: 'trending' | 'most_supported' | 'newest' | 'quietfray') => void;
  selectedCategory: Category | 'ALL';
  setSelectedCategory: (cat: Category | 'ALL') => void;
  statusFilter: IssueStatus | 'ALL' | 'UNSOLVED';
  setStatusFilter: (status: IssueStatus | 'ALL' | 'UNSOLVED') => void;
  onSelectIssue: (issue: CanonicalIssue) => void;
  onVote: (issueId: string, e: React.MouseEvent) => void;
  userVotes: Record<string, 'UP' | 'DOWN' | null>;
  searchQuery: string;
  onOpenReport?: () => void;
}

export const ProblemStream: React.FC<ProblemStreamProps> = ({
  issues,
  rankingMode,
  setRankingMode,
  selectedCategory,
  setSelectedCategory,
  statusFilter,
  setStatusFilter,
  onSelectIssue,
  onVote,
  userVotes,
  searchQuery,
  onOpenReport,
}) => {
  const categories = Object.keys(CATEGORY_LABELS) as Category[];

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'SOLVED':
        return (
          <span className="badge badge-success">
            <CheckCircle className="w-3 h-3" />
            Solved
          </span>
        );
      case 'BEING_BUILT':
        return (
          <span className="badge badge-info">
            <Hammer className="w-3 h-3" />
            Being Built
          </span>
        );
      case 'UNDER_INVESTIGATION':
        return (
          <span className="badge badge-warning">
            <AlertCircle className="w-3 h-3" />
            Investigating
          </span>
        );
      case 'REOPENED':
        return (
          <span className="badge badge-danger">
            <RefreshCw className="w-3 h-3" />
            Reopened
          </span>
        );
      case 'OPEN':
      default:
        return (
          <span className="badge badge-lime">
            <HelpCircle className="w-3 h-3" />
            Open
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Feed Control Bar */}
      <div className="card p-5 flex flex-col gap-5">
        {/* Top Controls: Ranking Mode & Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Ranking Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-x-auto">
            <button
              onClick={() => setRankingMode('trending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border-0 ${
                rankingMode === 'trending'
                  ? 'bg-[var(--color-lime)] text-black font-bold shadow-sm'
                  : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Trending</span>
            </button>
            <button
              onClick={() => setRankingMode('most_supported')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border-0 ${
                rankingMode === 'most_supported'
                  ? 'bg-[var(--color-lime)] text-black font-bold shadow-sm'
                  : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Most Supported</span>
            </button>
            <button
              onClick={() => setRankingMode('newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border-0 ${
                rankingMode === 'newest'
                  ? 'bg-[var(--color-lime)] text-black font-bold shadow-sm'
                  : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Newest</span>
            </button>
            <button
              onClick={() => setRankingMode('quietfray')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border-0 ${
                rankingMode === 'quietfray'
                  ? 'bg-[var(--color-lime)] text-black font-bold shadow-sm'
                  : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
              title="QuietFray v0.1 Point Process Opportunity Score"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>QuietFray v0.1</span>
            </button>
          </div>

          {/* Status Filter Dropdown / Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {searchQuery && (
              <span className="text-[var(--color-lime)] truncate max-w-[140px]">
                "{searchQuery}"
              </span>
            )}
            <span className="text-[var(--color-gray)]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[var(--color-surface)] text-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2.5 py-1.5 focus:outline-none focus:border-[var(--color-lime)] text-xs font-mono cursor-pointer"
            >
              <option value="ALL">All States</option>
              <option value="UNSOLVED">Unsolved Only</option>
              <option value="OPEN">Open</option>
              <option value="BEING_BUILT">Being Built</option>
              <option value="UNDER_INVESTIGATION">Investigating</option>
              <option value="SOLVED">Solved</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
              selectedCategory === 'ALL'
                ? 'bg-[var(--color-lime)] text-black font-bold border-[var(--color-lime)]'
                : 'bg-[var(--color-surface)] text-[var(--color-gray)] border-[var(--color-border)] hover:border-[var(--color-gray-dark)]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[var(--color-lime)] text-black font-bold border-[var(--color-lime)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-gray)] border-[var(--color-border)] hover:border-[var(--color-gray-dark)]'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Feed Cards */}
      {issues.length === 0 ? (
        <div className="empty-state card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-lime)]/10 border border-[var(--color-lime)]/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-[var(--color-lime)]" />
          </div>
          <h3 className="font-bold text-xl text-[var(--color-paper)] mb-2">
            No Problems Documented Yet
          </h3>
          <p className="text-sm font-body text-[var(--color-gray-light)] max-w-md mx-auto mb-6 leading-relaxed">
            The live database is ready and waiting for real friction. Be the first to report a persistent frustration and initiate community consensus.
          </p>
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="btn btn-primary shadow-lg inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Document the First Problem</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {issues.map((issue) => {
            const userVote = userVotes[issue.id];
            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="card card-hover cursor-pointer p-6 flex flex-col justify-between group transition-all"
              >
                <div>
                  {/* Badges & Meta Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-lime text-[10px]">
                        {CATEGORY_LABELS[issue.category]}
                      </span>
                      {getStatusBadge(issue.status)}
                      {issue.activeClaim && issue.activeClaim.status === 'ACTIVE' && (
                        <span className="badge badge-info text-[10px]">
                          Claimed Work Lease
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-[var(--color-gray-dark)]">
                      {new Date(issue.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-paper)] group-hover:text-[var(--color-lime)] transition-colors mb-2">
                    {issue.title}
                  </h3>

                  {/* Problem Statement */}
                  <p className="text-sm text-[var(--color-gray-light)] line-clamp-3 leading-relaxed mb-4">
                    {issue.problemStatement}
                  </p>
                </div>

                {/* Footer Metrics & Vote Action */}
                <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-gray)]">
                    <span className="flex items-center gap-1" title="Observed frictions documented">
                      <Layers className="w-3.5 h-3.5" />
                      {issue.observedFrictions.length} frictions
                    </span>
                    <span className="flex items-center gap-1" title="Independent user reports">
                      <FileText className="w-3.5 h-3.5" />
                      {issue.reportCount} reports
                    </span>
                    {issue.solutions.length > 0 && (
                      <span className="flex items-center gap-1 text-[var(--color-info)]" title="Submitted solutions">
                        <Hammer className="w-3.5 h-3.5" />
                        {issue.solutions.length} fixes
                      </span>
                    )}
                    {rankingMode === 'quietfray' && issue.quietFray && (
                      <span
                        className="badge badge-lime text-[10px]"
                        title="QuietFray v0.1 Opportunity Evidence Score"
                      >
                        QF: {issue.quietFray.score.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Vote Button */}
                    <button
                      onClick={(e) => onVote(issue.id, e)}
                      className={`vote-btn flex-row px-3 py-1.5 ${userVote === 'UP' ? 'voted' : ''}`}
                      title="Support this problem anonymously"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{issue.supportCount}</span>
                    </button>

                    <div className="w-7 h-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-lime)] group-hover:text-[var(--color-lime)] transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
