// ============================================================================
// PROBLEM EVIDENCE & SOLUTION WORKFLOW MODAL
// Aligned with Section 5.3, 5.4, 5.5, 8.2, 8.5 of Master Product Brief
// ============================================================================

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Globe,
  Hammer,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  ThumbsUp,
  Unlock,
  X,
} from 'lucide-react';
import type { CanonicalIssue } from '../types';
import { CATEGORY_LABELS } from '../types';
import {
  claimWorkOnIssue,
  getAssociatedReports,
  markIssueSolved,
  releaseWorkClaim,
  reopenIssue,
} from '../lib/storage';
import { generateCapability, getCapability, storeCapability } from '../lib/capabilities';
import { SubmitSolutionModal } from './SubmitSolutionModal';

interface ProblemEvidenceModalProps {
  issue: CanonicalIssue | null;
  onClose: () => void;
  onVote: (issueId: string, e: React.MouseEvent) => void;
  userVote: 'UP' | 'DOWN' | null;
  onRefresh: () => void;
}

export const ProblemEvidenceModal: React.FC<ProblemEvidenceModalProps> = ({
  issue,
  onClose,
  onVote,
  userVote,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'solutions' | 'quietfray'>('evidence');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [isSubmitSolutionOpen, setIsSubmitSolutionOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Solved Transition State
  const [isSolving, setIsSolving] = useState(false);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('');
  const [solutionCapabilityToken, setSolutionCapabilityToken] = useState<string>('');
  const [resolutionEvidence, setResolutionEvidence] = useState<string>('');

  // Reopen State
  const [isReopening, setIsReopening] = useState(false);
  const [reopenReason, setReopenReason] = useState<string>('');

  if (!issue) return null;

  const associatedReports = getAssociatedReports(issue.id);

  // Check if current client has active claim capability
  const localClaimCap = getCapability('claim', issue.id);

  // Check if current client has a capability for any solution report on this issue
  const localSolutionCaps = issue.solutions.map((sol) => ({
    sol,
    cap: getCapability('solution', sol.id),
  }));

  const handleClaimWork = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const claimToken = generateCapability('claim');
      await claimWorkOnIssue(issue.id, claimToken);
      await storeCapability('claim', issue.id, claimToken, `Claim: ${issue.title.slice(0, 30)}`);
      setActionSuccess('Claimed 7-day stewardship lease. You are now the active investigator.');
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim work.');
    }
  };

  const handleReleaseClaim = async () => {
    if (!localClaimCap) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await releaseWorkClaim(issue.id, localClaimCap.token);
      setActionSuccess('Released claim stewardship lease back to community.');
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to release claim.');
    }
  };

  const handleMarkSolved = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    try {
      await markIssueSolved(
        issue.id,
        selectedSolutionId,
        solutionCapabilityToken.trim(),
        resolutionEvidence
      );
      setActionSuccess('Issue marked SOLVED with verified solution ownership.');
      setIsSolving(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Verification failed. Cannot mark issue solved.');
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    try {
      await reopenIssue(issue.id, reopenReason);
      setActionSuccess('Issue has been reopened with documented evidence.');
      setIsReopening(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reopen issue.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="card w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 rounded-[var(--radius-md)] relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--color-gray)] hover:text-[var(--color-paper)] p-1.5 bg-transparent border-0 cursor-pointer"
          title="Close evidence modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Action Banner Feedback */}
        {actionSuccess && (
          <div className="mb-4 p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-[var(--radius-sm)] flex items-center gap-2 text-xs text-[var(--color-success)]">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mb-4 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-sm)] flex items-center gap-2 text-xs text-[var(--color-danger)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Issue Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge badge-lime">{CATEGORY_LABELS[issue.category]}</span>
            <span
              className={`badge ${
                issue.status === 'SOLVED'
                  ? 'badge-success'
                  : issue.status === 'BEING_BUILT'
                  ? 'badge-info'
                  : issue.status === 'REOPENED'
                  ? 'badge-danger'
                  : 'badge-warning'
              }`}
            >
              {issue.status.replace('_', ' ')}
            </span>
            <span className="text-xs font-mono text-[var(--color-gray)]">
              Published: {new Date(issue.publishedAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-paper)] tracking-tight mb-3">
            {issue.title}
          </h1>

          {/* Synthesis Statement Callout */}
          <div className="p-4 bg-[var(--color-ink)] border-l-2 border-[var(--color-lime)] rounded-r-[var(--radius-sm)] mb-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-lime)] font-bold mb-1">
              Consolidated Problem Statement (v{issue.summaryVersion})
            </div>
            <p className="text-sm text-[var(--color-paper)] leading-relaxed font-medium">
              {issue.problemStatement}
            </p>
          </div>

          <p className="text-sm text-[var(--color-gray-light)] leading-relaxed mb-4">
            {issue.description}
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[var(--color-border)]">
            <div className="flex items-center gap-6 text-xs font-mono text-[var(--color-gray)]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[var(--color-lime)]" />
                <strong className="text-[var(--color-paper)]">{issue.reportCount}</strong> reports
              </span>
              <span className="flex items-center gap-1.5">
                <Hammer className="w-4 h-4 text-[var(--color-info)]" />
                <strong className="text-[var(--color-paper)]">{issue.solutions.length}</strong> solutions
              </span>
              {issue.quietFray && (
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[var(--color-lime)]" />
                  QF Score: <strong className="text-[var(--color-lime)]">{issue.quietFray.score.toFixed(2)}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => onVote(issue.id, e)}
                className={`vote-btn flex-row px-3 py-1.5 ${userVote === 'UP' ? 'voted' : ''}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Support ({issue.supportCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] mb-6">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-2.5 px-3 font-display text-sm tracking-wide transition-colors border-0 border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'evidence'
                ? 'border-[var(--color-lime)] text-[var(--color-lime)] font-bold'
                : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
            }`}
          >
            Evidence & Reports ({associatedReports.length})
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`pb-2.5 px-3 font-display text-sm tracking-wide transition-colors border-0 border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'solutions'
                ? 'border-[var(--color-lime)] text-[var(--color-lime)] font-bold'
                : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
            }`}
          >
            Solutions & Builder Claims ({issue.solutions.length})
          </button>
          <button
            onClick={() => setActiveTab('quietfray')}
            className={`pb-2.5 px-3 font-display text-sm tracking-wide transition-colors border-0 border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'quietfray'
                ? 'border-[var(--color-lime)] text-[var(--color-lime)] font-bold'
                : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
            }`}
          >
            QuietFray v0.1 Analysis
          </button>
        </div>

        {/* TAB 1: EVIDENCE & REPORTS */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            {/* Observed Frictions */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-gray)] font-bold mb-3">
                Observed Frictions & Provenance
              </h3>
              <div className="space-y-2">
                {issue.observedFrictions.map((fric) => (
                  <div
                    key={fric.id}
                    className="p-3 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-sm)] flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-[var(--color-paper)] font-medium">{fric.statement}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--color-gray)] mt-1.5">
                        <span className="badge badge-lime text-[9px]">{fric.source}</span>
                        <span>Supported by {fric.supportingReportIds.length} original reports</span>
                        <span>Confidence: {(fric.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expandable Original Reports (Section 5.3) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-gray)] font-bold">
                  Approved Original Reports (Preserved Author Wording)
                </h3>
                <span className="text-xs font-mono text-[var(--color-gray)]">
                  Anonymous Community Submissions
                </span>
              </div>

              {associatedReports.length === 0 ? (
                <div className="p-4 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-center text-xs text-[var(--color-gray)] font-mono">
                  All initial evidence consolidated into canonical problem statement.
                </div>
              ) : (
                <div className="space-y-2">
                  {associatedReports.map((rep) => {
                    const isExpanded = expandedReportId === rep.id;
                    return (
                      <div
                        key={rep.id}
                        className="bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}
                          className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--color-surface-raised)] transition-colors border-0 bg-transparent cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-xs font-bold text-[var(--color-paper)] block truncate">
                              {rep.title}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--color-gray)]">
                              Submitted {new Date(rep.createdAt).toLocaleDateString()} • Anonymous Reporter
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[var(--color-gray)] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--color-gray)] shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-3 pt-0 border-t border-[var(--color-border)]/50 bg-[var(--color-surface)]">
                            <p className="text-xs text-[var(--color-gray-light)] leading-relaxed whitespace-pre-wrap mt-2">
                              {rep.description}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SOLUTIONS & BUILDER WORKFLOW */}
        {activeTab === 'solutions' && (
          <div className="space-y-6">
            {/* Work Stewardship Lease Card (Section 8.2) */}
            <div className="p-4 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[var(--color-lime)]" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] font-bold">
                    Work Stewardship Lease
                  </h3>
                </div>
                {issue.activeClaim && issue.activeClaim.status === 'ACTIVE' ? (
                  <span className="badge badge-warning text-[10px]">
                    Active Lease (Expires {new Date(issue.activeClaim.expiresAt).toLocaleDateString()})
                  </span>
                ) : (
                  <span className="badge badge-lime text-[10px]">Available to Claim</span>
                )}
              </div>

              <p className="text-xs text-[var(--color-gray)] leading-relaxed mb-4">
                A work claim is a time-limited (7-day) declaration that an active solver is investigating or building toward a solution. It does not grant permanent ownership over this public issue.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {issue.activeClaim && issue.activeClaim.status === 'ACTIVE' ? (
                  localClaimCap ? (
                    <button
                      onClick={handleReleaseClaim}
                      className="btn btn-secondary btn-sm flex items-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Release My Stewardship Lease</span>
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-[var(--color-gray)]">
                      Claimed by an anonymous builder. Other builders may still submit solutions!
                    </span>
                  )
                ) : (
                  <button
                    onClick={handleClaimWork}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>Claim 7-Day Stewardship Lease</span>
                  </button>
                )}

                <button
                  onClick={() => setIsSubmitSolutionOpen(true)}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Solution Report</span>
                </button>
              </div>
            </div>

            {/* Solution Reports List */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-gray)] font-bold mb-3">
                Submitted Solution Reports ({issue.solutions.length})
              </h3>

              {issue.solutions.length === 0 ? (
                <div className="p-8 text-center bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                  <Hammer className="w-8 h-8 text-[var(--color-gray)] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-mono text-[var(--color-gray)] mb-3">
                    No solutions submitted yet. Be the first to build a fix!
                  </p>
                  <button
                    onClick={() => setIsSubmitSolutionOpen(true)}
                    className="btn btn-primary btn-sm"
                  >
                    Submit a Solution
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {issue.solutions.map((sol) => (
                    <div
                      key={sol.id}
                      className="p-4 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-md)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--color-paper)]">{sol.title}</span>
                          <span className="badge badge-info text-[9px]">{sol.stage}</span>
                          {sol.status === 'ACCEPTED' && (
                            <span className="badge badge-success text-[9px]">Verified Resolution</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[var(--color-gray)]">
                          {new Date(sol.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--color-gray-light)] leading-relaxed mb-3">
                        {sol.summary}
                      </p>

                      {/* External links */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--color-border)] text-xs font-mono">
                        {sol.githubUrl && (
                          <a
                            href={sol.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[var(--color-lime)] hover:underline"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <span>Repository</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {sol.demoUrl && (
                          <a
                            href={sol.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[var(--color-lime)] hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {sol.verificationEvidence && (
                          <span className="text-[var(--color-gray)] truncate max-w-xs">
                            Evidence: {sol.verificationEvidence}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolution Authority & Mark Solved Transition (Section 8.5) */}
            <div className="p-4 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[var(--color-success)]" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] font-bold">
                  Resolution Authority (Section 8.5)
                </h3>
              </div>
              <p className="text-xs text-[var(--color-gray)] leading-relaxed mb-4">
                To prevent false closures, an issue may <strong>only be marked Solved</strong> by the authorized actor who submitted an eligible solution report and provides its cryptographic capability token.
              </p>

              {issue.status === 'SOLVED' ? (
                <div>
                  <div className="p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-[var(--radius-sm)] text-xs text-[var(--color-success)] mb-3">
                    <strong>Problem Solved with Evidence:</strong> {issue.resolutionEvidence}
                  </div>
                  {isReopening ? (
                    <form onSubmit={handleReopen} className="flex flex-col gap-3">
                      <textarea
                        placeholder="Explain why the fix failed, was abandoned, or did not solve the documented problem..."
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        className="input text-xs min-h-[70px]"
                        required
                        minLength={10}
                      />
                      <div className="flex items-center gap-2">
                        <button type="submit" className="btn btn-primary btn-sm">
                          Confirm Reopen with Evidence
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsReopening(false)}
                          className="btn btn-ghost btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsReopening(true)}
                      className="btn btn-secondary btn-sm flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Report Failed Fix / Reopen Problem</span>
                    </button>
                  )}
                </div>
              ) : isSolving ? (
                <form onSubmit={handleMarkSolved} className="flex flex-col gap-3 pt-2">
                  <div>
                    <label className="label">Select Your Solution Report *</label>
                    <select
                      value={selectedSolutionId}
                      onChange={(e) => setSelectedSolutionId(e.target.value)}
                      className="select text-xs"
                      required
                    >
                      <option value="">-- Choose Solution Report --</option>
                      {issue.solutions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.stage})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Solution Submitter Capability Token *</label>
                    <input
                      type="text"
                      placeholder="Paste your mcap_solution_... capability token"
                      value={solutionCapabilityToken}
                      onChange={(e) => setSolutionCapabilityToken(e.target.value)}
                      className="input font-mono text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Resolution & Verification Evidence *</label>
                    <textarea
                      placeholder="Summarize verification tests, live adoption, or independent checks..."
                      value={resolutionEvidence}
                      onChange={(e) => setResolutionEvidence(e.target.value)}
                      className="input text-xs min-h-[60px]"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="submit" className="btn btn-primary btn-sm">
                      Verify Authority & Close Problem as Solved
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSolving(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    // Pre-select if client has a local solution capability
                    const found = localSolutionCaps.find((c) => c.cap);
                    if (found) {
                      setSelectedSolutionId(found.sol.id);
                      setSolutionCapabilityToken(found.cap!.token);
                    } else if (issue.solutions.length > 0) {
                      setSelectedSolutionId(issue.solutions[0].id);
                    }
                    setIsSolving(true);
                  }}
                  disabled={issue.solutions.length === 0}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />
                  <span>Mark Issue Solved (Authorized Submitters Only)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: QUIETFRAY ANALYSIS */}
        {activeTab === 'quietfray' && (
          <div className="space-y-6">
            <div className="p-4 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[var(--color-lime)]" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-lime)] font-bold">
                    QuietFray v0.1 Research Model Output
                  </h3>
                </div>
                <span className="badge badge-lime text-[10px]">
                  Score: {issue.quietFray?.score.toFixed(3) ?? 'N/A'}
                </span>
              </div>

              <p className="text-xs text-[var(--color-gray-light)] leading-relaxed mb-4">
                QuietFray evaluates temporal intensity contrast between transient burst activity (\(H_0\)) and persistent evidence accumulation (\(H_1\)), integrating report marks, duration survival, and category baselines.
              </p>

              {issue.quietFray?.signals && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                    <div className="text-[var(--color-gray)] text-[10px] uppercase">Temporal Evidence (ℓ_V + ℓ_R)</div>
                    <div className="text-sm font-bold text-[var(--color-paper)] mt-0.5">
                      {issue.quietFray.signals.temporalEvidence.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                    <div className="text-[var(--color-gray)] text-[10px] uppercase">Report Marks Likelihood (ℓ_marks)</div>
                    <div className="text-sm font-bold text-[var(--color-paper)] mt-0.5">
                      {issue.quietFray.signals.reportMarks.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                    <div className="text-[var(--color-gray)] text-[10px] uppercase">Survival / Duration Persistence</div>
                    <div className="text-sm font-bold text-[var(--color-paper)] mt-0.5">
                      {issue.quietFray.signals.survivalPersistence.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                    <div className="text-[var(--color-gray)] text-[10px] uppercase">Reopen / Recurrence Signal</div>
                    <div className="text-sm font-bold text-[var(--color-paper)] mt-0.5">
                      {issue.quietFray.signals.reopenSignal.toFixed(3)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Solution Nested Modal */}
        <SubmitSolutionModal
          isOpen={isSubmitSolutionOpen}
          onClose={() => setIsSubmitSolutionOpen(false)}
          canonicalIssueId={issue.id}
          issueTitle={issue.title}
          onSolutionSubmitted={() => {
            setIsSubmitSolutionOpen(false);
            onRefresh();
          }}
        />
      </div>
    </div>
  );
};
