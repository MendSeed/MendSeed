// ============================================================================
// PROBLEM EVIDENCE, DISCUSSIONS & SOLVER WORKSPACE MODAL
// GitHub/Reddit/Kaggle style Problem Scoping, Solver Claims & Verified Resolution
// Styled with UI/UX Pro Max Dark Mode Design System
// ============================================================================

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Code,
  Compass,
  ExternalLink,
  Globe,
  Hammer,
  MessageSquare,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import type { CanonicalIssue, DiscussionComment } from '../types';
import { CATEGORY_LABELS } from '../types';
import {
  addDiscussionReaction,
  addIssueDiscussion,
  claimIssueForSolver,
  getAssociatedReports,
  verifyAndCloseIssueWithResolution,
} from '../lib/storage';
import { getCurrentUser } from '../lib/auth';
import { SubmitSolutionModal } from './SubmitSolutionModal';

interface ProblemEvidenceModalProps {
  issue: CanonicalIssue | null;
  onClose: () => void;
  onVote?: (issueId: string, e: React.MouseEvent) => void;
  userVote?: 'UP' | 'DOWN' | null;
  onRefresh: () => void;
  onSelectUser?: (username: string) => void;
  onOpenAuth?: () => void;
}

export const ProblemEvidenceModal: React.FC<ProblemEvidenceModalProps> = ({
  issue,
  onClose,
  onVote: _onVote,
  userVote: _userVote,
  onRefresh,
  onSelectUser,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'discussions' | 'solutions' | 'quietfray'>('evidence');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [isSubmitSolutionOpen, setIsSubmitSolutionOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Discussions state
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  // Solver Claim state
  const [claimNotes, setClaimNotes] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  const currentUser = getCurrentUser();

  if (!issue) return null;

  const associatedReports = getAssociatedReports(issue.id);
  const discussions: DiscussionComment[] = issue.discussions || [];

  const handleClaim = async () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    try {
      await claimIssueForSolver(issue.id, currentUser, claimNotes.trim() || undefined);
      setActionSuccess(`Successfully claimed issue. You are now the lead solver!`);
      setIsClaiming(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim issue.');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const author = currentUser
        ? {
            userId: currentUser.id,
            username: currentUser.username,
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl,
            isGuest: false,
            isSolver: issue.claimedSolver?.userId === currentUser.id,
            isMaintainer: false,
          }
        : {
            username: 'guest_observer',
            name: 'Anonymous Guest',
            isGuest: true,
            isSolver: false,
            isMaintainer: false,
          };

      await addIssueDiscussion(issue.id, {
        canonicalIssueId: issue.id,
        parentId: replyToId || undefined,
        author,
        content: commentText.trim(),
      });

      setCommentText('');
      setReplyToId(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to post comment.');
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    await addDiscussionReaction(issue.id, commentId, emoji);
    onRefresh();
  };

  const handleVerifyResolution = async (solutionId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await verifyAndCloseIssueWithResolution(
        issue.id,
        solutionId,
        currentUser,
        'Solution meets acceptance criteria and passed verification.'
      );
      setActionSuccess('Solution independently verified! Issue marked SOLVED (+50 solver points awarded).');
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Verification failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto text-[#F8FAFC]">
      <div className="relative w-full max-w-4xl bg-[#111622] border border-[#27354A] rounded-2xl p-6 sm:p-8 shadow-2xl my-8 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#27354A]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] font-bold">
                {CATEGORY_LABELS[issue.category]}
              </span>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                  issue.status === 'SOLVED'
                    ? 'bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]'
                    : issue.status === 'BEING_BUILT'
                    ? 'bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]'
                    : 'bg-[#1E293B] border border-[#334155] text-[#94A3B8]'
                }`}
              >
                {issue.status}
              </span>
              {issue.quietFray && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] font-semibold">
                  QuietFray Score: {issue.quietFray.score.toFixed(3)}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-display text-white leading-snug">
              {issue.title}
            </h1>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Alerts */}
        {actionError && (
          <div className="mt-4 p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#27354A] mt-4 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'bg-[#1B2336] text-[#22C55E] font-bold border border-[#27354A]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            📋 Problem & Scoping
          </button>

          <button
            onClick={() => setActiveTab('discussions')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'discussions'
                ? 'bg-[#1B2336] text-[#38BDF8] font-bold border border-[#27354A]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussions ({discussions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('solutions')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'solutions'
                ? 'bg-[#1B2336] text-[#A855F7] font-bold border border-[#27354A]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Solutions & PRs ({issue.solutions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quietfray')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quietfray'
                ? 'bg-[#1B2336] text-[#F59E0B] font-bold border border-[#27354A]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>QuietFray Model Telemetry</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-6">
          {/* TAB 1: EVIDENCE & SCOPING */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Problem Description & Symptoms */}
              <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#27354A]">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">
                  Problem Description & Ground Symptoms
                </h3>
                <p className="text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>

              {/* Acceptance Criteria (Kaggle/Devpost Problem Scoping) */}
              <div className="p-5 rounded-xl bg-[#161F30] border border-[#27354A]">
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="w-4 h-4 text-[#22C55E]" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                    Acceptance Criteria for Solvers
                  </h3>
                </div>

                {issue.acceptanceCriteria && issue.acceptanceCriteria.length > 0 ? (
                  <ul className="space-y-2 text-xs text-[#94A3B8]">
                    {issue.acceptanceCriteria.map((crit, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                        <span className="text-[#F8FAFC]">{crit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#94A3B8]">
                    1. Replicate described symptom in local or public environment.
                    <br />
                    2. Provide working patch, PR link, or live application demonstration.
                  </p>
                )}
              </div>

              {/* Solver Claim Status & Claim Action */}
              <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#27354A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-1">
                    Stewardship & Solver Assignment
                  </div>
                  {issue.claimedSolver ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Lead Solver:</span>
                      <button
                        onClick={() => onSelectUser && onSelectUser(issue.claimedSolver!.username)}
                        className="text-sm font-mono text-[#22C55E] hover:underline flex items-center gap-1 font-bold bg-transparent border-0 cursor-pointer p-0"
                      >
                        @{issue.claimedSolver.username}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-[#64748B] font-mono">
                        (Claimed {new Date(issue.claimedSolver.claimedAt).toLocaleDateString()})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#F59E0B] font-mono">
                      ⚡ Open for claiming! No solver currently assigned.
                    </span>
                  )}
                </div>

                {!issue.claimedSolver && (
                  <div>
                    {isClaiming ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Brief approach notes (optional)..."
                          value={claimNotes}
                          onChange={(e) => setClaimNotes(e.target.value)}
                          className="px-3 py-1.5 bg-[#161F30] border border-[#334155] rounded-lg text-xs text-white"
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={handleClaim} className="btn btn-primary btn-sm text-xs font-mono">
                            Confirm Claim
                          </button>
                          <button onClick={() => setIsClaiming(false)} className="btn btn-secondary btn-sm text-xs">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            if (onOpenAuth) onOpenAuth();
                          } else {
                            setIsClaiming(true);
                          }
                        }}
                        className="btn btn-primary btn-sm flex items-center gap-2 text-xs font-mono"
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Claim to Solve</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Underlying Community Reports */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-bold mb-3">
                  Underlying Corroborating Reports ({associatedReports.length})
                </h3>
                {associatedReports.map((rep) => {
                  const isExp = expandedReportId === rep.id;
                  return (
                    <div
                      key={rep.id}
                      className="rounded-xl bg-[#0B0F19] border border-[#27354A] overflow-hidden mb-2"
                    >
                      <button
                        onClick={() => setExpandedReportId(isExp ? null : rep.id)}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#161F30] transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{rep.title}</p>
                          <p className="text-[11px] font-mono text-[#64748B]">
                            Submitted {new Date(rep.createdAt).toLocaleDateString()} • Anonymous Evidence
                          </p>
                        </div>
                        {isExp ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                      </button>
                      {isExp && (
                        <div className="p-3.5 pt-0 border-t border-[#27354A] text-xs text-[#94A3B8] leading-relaxed whitespace-pre-wrap">
                          {rep.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: THREADED DISCUSSIONS (REDDIT / GITHUB STYLE) */}
          {activeTab === 'discussions' && (
            <div className="space-y-6">
              {/* Comment Submission Box */}
              <form onSubmit={handlePostComment} className="p-4 rounded-xl bg-[#0B0F19] border border-[#27354A]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#94A3B8]">
                    {currentUser ? (
                      <span className="text-[#22C55E]">Posting as @{currentUser.username} (+2 pts)</span>
                    ) : (
                      <span>Posting as Anonymous Guest</span>
                    )}
                  </span>
                  {replyToId && (
                    <button
                      type="button"
                      onClick={() => setReplyToId(null)}
                      className="text-[11px] font-mono text-[#EF4444] hover:underline"
                    >
                      Cancel Reply
                    </button>
                  )}
                </div>

                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Discuss approaches, ask clarifying questions, share workarounds or links..."
                  rows={3}
                  className="w-full p-3 bg-[#111622] border border-[#334155] rounded-xl text-xs text-white placeholder-[#64748B] focus:border-[#38BDF8] focus:outline-none mb-3"
                  required
                />

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-[#64748B] font-mono flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" />
                    <span>Markdown & code blocks supported</span>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm flex items-center gap-2 text-xs font-mono">
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </form>

              {/* Discussions Stream */}
              {discussions.length === 0 ? (
                <div className="p-8 text-center bg-[#0B0F19] border border-[#27354A] rounded-xl">
                  <MessageSquare className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-mono text-[#94A3B8]">
                    No discussions on this issue yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {discussions.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 rounded-xl bg-[#0B0F19] border border-[#27354A] space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => comment.author.username && onSelectUser && onSelectUser(comment.author.username)}
                            className="font-bold text-[#38BDF8] hover:underline cursor-pointer bg-transparent border-0 p-0"
                          >
                            @{comment.author.username}
                          </button>
                          {comment.author.isSolver && (
                            <span className="text-[10px] px-2 py-0.2 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-bold">
                              Solver
                            </span>
                          )}
                          {comment.author.isGuest && (
                            <span className="text-[10px] text-[#64748B]">
                              (Guest)
                            </span>
                          )}
                        </div>
                        <span className="text-[#64748B] text-[11px]">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {/* Emoji Reactions Bar */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#27354A]/50 text-xs">
                        {['👍', '🚀', '💡', '❤️'].map((emoji) => {
                          const count = comment.reactions?.[emoji] || 0;
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(comment.id, emoji)}
                              className={`px-2 py-0.5 rounded-lg border text-xs cursor-pointer flex items-center gap-1 transition-all ${
                                count > 0
                                  ? 'bg-[#1E293B] border-[#38BDF8]/40 text-white'
                                  : 'bg-[#111622] border-[#27354A] text-[#94A3B8] hover:text-white'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span className="font-mono text-[10px]">{count}</span>}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => {
                            setReplyToId(comment.id);
                            setCommentText(`@${comment.author.username} `);
                          }}
                          className="ml-auto text-[11px] font-mono text-[#94A3B8] hover:text-white hover:underline cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SOLUTIONS & VERIFIED PULL REQUESTS */}
          {activeTab === 'solutions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display text-white">
                    Proposed Solutions & Pull Requests
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Verified fixes earn 50 solver reputation points and close the issue.
                  </p>
                </div>
                <button
                  onClick={() => setIsSubmitSolutionOpen(true)}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Solution PR</span>
                </button>
              </div>

              {issue.solutions.length === 0 ? (
                <div className="p-8 text-center bg-[#0B0F19] border border-[#27354A] rounded-xl">
                  <Hammer className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-mono text-[#94A3B8] mb-4">
                    No solutions submitted yet. Build a fix and submit a PR!
                  </p>
                  <button
                    onClick={() => setIsSubmitSolutionOpen(true)}
                    className="btn btn-secondary btn-sm text-xs font-mono"
                  >
                    Submit the First Solution
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {issue.solutions.map((sol) => (
                    <div
                      key={sol.id}
                      className="p-5 rounded-xl bg-[#0B0F19] border border-[#27354A] space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{sol.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8]">
                            {sol.stage}
                          </span>
                          {sol.status === 'ACCEPTED' && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] font-bold">
                              VERIFIED RESOLUTION
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-[#64748B]">
                          {new Date(sol.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed">
                        {sol.summary}
                      </p>

                      {/* Links: GitHub & Demo */}
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono pt-1">
                        {sol.githubUrl && (
                          <a
                            href={sol.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-[#38BDF8] hover:underline"
                          >
                            <GithubIcon className="w-3.5 h-3.5" />
                            <span>Repository / Pull Request</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {sol.demoUrl && (
                          <a
                            href={sol.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-[#22C55E] hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Live Application Demo</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {sol.verificationEvidence && (
                        <div className="p-3 rounded-lg bg-[#111622] border border-[#27354A] text-xs font-mono text-[#94A3B8]">
                          <strong className="text-white block mb-1 font-sans">Verification Evidence:</strong>
                          {sol.verificationEvidence}
                        </div>
                      )}

                      {/* Verification CTA */}
                      {issue.status !== 'SOLVED' && (
                        <div className="pt-3 border-t border-[#27354A] flex items-center justify-between">
                          <span className="text-[11px] text-[#64748B] font-mono">
                            Meets acceptance criteria?
                          </span>
                          <button
                            onClick={() => handleVerifyResolution(sol.id)}
                            className="btn btn-primary btn-sm text-xs font-mono flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verify & Mark Issue Solved (+50 pts)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUIETFRAY MATHEMATICAL TELEMETRY */}
          {activeTab === 'quietfray' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#27354A]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#F59E0B]" />
                    <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                      QuietFray v0.1 Point-Process Ranking Engine
                    </h3>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] font-bold">
                    Score: {issue.quietFray?.score.toFixed(3) ?? '0.850'}
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
                  QuietFray is a pure-mathematics marked Hawkes point-process model. It separates genuine chronic community suffering from transient viral bot bursts using dual decay timescales (tau_f = 28.8 min, tau_s = 72 hours) and empirical-Bayes category priors. Zero neural dependency.
                </p>

                {issue.quietFray?.signals && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-[#111622] rounded-xl border border-[#27354A]">
                      <span className="text-[#64748B] text-[10px] block">TEMPORAL EVIDENCE (ℓ_V + ℓ_R)</span>
                      <strong className="text-white text-sm mt-0.5 block">
                        {issue.quietFray.signals.temporalEvidence.toFixed(3)}
                      </strong>
                    </div>
                    <div className="p-3 bg-[#111622] rounded-xl border border-[#27354A]">
                      <span className="text-[#64748B] text-[10px] block">REPORT MARKS LIKELIHOOD</span>
                      <strong className="text-white text-sm mt-0.5 block">
                        {issue.quietFray.signals.reportMarks.toFixed(3)}
                      </strong>
                    </div>
                    <div className="p-3 bg-[#111622] rounded-xl border border-[#27354A]">
                      <span className="text-[#64748B] text-[10px] block">SURVIVAL PERSISTENCE</span>
                      <strong className="text-white text-sm mt-0.5 block">
                        {issue.quietFray.signals.survivalPersistence.toFixed(3)}
                      </strong>
                    </div>
                    <div className="p-3 bg-[#111622] rounded-xl border border-[#27354A]">
                      <span className="text-[#64748B] text-[10px] block">REOPEN SIGNAL</span>
                      <strong className="text-white text-sm mt-0.5 block">
                        {issue.quietFray.signals.reopenSignal.toFixed(3)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nested Submit Solution Modal */}
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
