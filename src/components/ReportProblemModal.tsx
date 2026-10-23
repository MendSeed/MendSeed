// ============================================================================
// REPORT A PROBLEM MODAL
// Aligned with Section 5.1, 7.1, 14.1 of Master Product Brief
// Inline candidate matching, local draft resilience, capability token issuance
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Info,
  Key,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import type { CanonicalIssue, Category } from '../types';
import { CATEGORY_LABELS } from '../types';
import { findCandidateIssues, submitProblemReport } from '../lib/storage';
import { generateCapability, storeCapability } from '../lib/capabilities';
import { getCurrentUser } from '../lib/auth';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: (canonicalId?: string) => void;
}

const STORAGE_KEY_DRAFT = 'mendseed_report_draft_v1';

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  onReportSubmitted,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [category, setCategory] = useState<Category>('SOFTWARE_APPS');
  const [candidateIssues, setCandidateIssues] = useState<CanonicalIssue[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = getCurrentUser();
  const [successInfo, setSuccessInfo] = useState<{
    reportId: string;
    token: string;
    canonicalIssueId?: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.category) setCategory(draft.category);
      }
    } catch {}
  }, []);

  // Auto-save draft on change
  useEffect(() => {
    if (title || description) {
      localStorage.setItem(
        STORAGE_KEY_DRAFT,
        JSON.stringify({ title, description, category })
      );
    }
  }, [title, description, category]);

  // Real-time deterministic candidate search
  useEffect(() => {
    if (title.trim().length > 8 || description.trim().length > 15) {
      const query = title.trim().length > 8 ? title : description;
      const matches = findCandidateIssues(query, category);
      setCandidateIssues(matches);
    } else {
      setCandidateIssues([]);
    }
  }, [title, description, category]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Generate anonymous capability token for reporter
      const reporterToken = generateCapability('report');

      const criteriaList = acceptanceCriteria
        .split('\n')
        .map((c) => c.replace(/^[-*•0-9.]+\s*/, '').trim())
        .filter(Boolean);

      const res = await submitProblemReport(
        {
          title,
          description,
          category,
          candidateIssueId: selectedCandidateId,
          acceptanceCriteria: criteriaList.length > 0 ? criteriaList : undefined,
          reporterUserId: currentUser?.id,
        },
        reporterToken
      );

      // Store capability in browser storage
      await storeCapability('report', res.report.id, reporterToken, `Report: ${title.slice(0, 30)}`);

      // Clear draft
      localStorage.removeItem(STORAGE_KEY_DRAFT);

      setSuccessInfo({
        reportId: res.report.id,
        token: reporterToken,
        canonicalIssueId: res.canonicalIssueId,
      });

      onReportSubmitted(res.canonicalIssueId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit problem report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (successInfo?.token) {
      navigator.clipboard.writeText(successInfo.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setDescription('');
    setSuccessInfo(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="card w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 rounded-[var(--radius-md)] relative my-8">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-[var(--color-gray)] hover:text-[var(--color-paper)] p-1 bg-transparent border-0 cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {successInfo ? (
          // Success & Capability Token Confirmation Screen
          <div className="py-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-lime)]/10 text-[var(--color-lime)] flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-paper)] mb-2">
              Problem Report Saved
            </h2>
            <p className="text-sm text-[var(--color-gray-light)] leading-relaxed mb-6">
              Your submission has been durably stored. It is being evaluated for canonical issue consolidation and pattern recognition.
            </p>

            {/* Anonymous Capability Token Box */}
            <div className="bg-[var(--color-ink)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] mb-6">
              <div className="flex items-center gap-2 mb-2 text-xs font-mono text-[var(--color-lime)] font-bold">
                <Key className="w-3.5 h-3.5" />
                <span>Your Anonymous Report Capability Token</span>
              </div>
              <p className="text-xs text-[var(--color-gray)] mb-3">
                No account was created. This token is saved in your browser and lets you manage or withdraw your submission:
              </p>
              <div className="flex items-center gap-2 bg-[var(--color-surface)] p-2 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                <code className="text-xs font-mono text-[var(--color-paper)] truncate flex-1">
                  {successInfo.token}
                </code>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="btn btn-secondary btn-sm shrink-0 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="btn btn-primary w-full justify-center"
            >
              Done & Return to Explorer
            </button>
          </div>
        ) : (
          // Report Form
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <div className="section-subheader flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-lime)]" />
                <span>Seed a New Problem</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-paper)]">Report a Problem</h2>
              <p className="text-xs text-[var(--color-gray)] mt-1">
                Describe the broken workflow, unmet need, or recurring friction you experienced. No account required.
              </p>

              {/* Author status banner */}
              <div className="mt-3 py-2 px-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono">
                {currentUser ? (
                  <span className="text-[var(--color-lime)] flex items-center gap-1.5 font-bold">
                    <span>Logged in as @{currentUser.username}</span>
                    <span className="text-[var(--color-gray)] font-normal">(+5 Scoping Points on submission)</span>
                  </span>
                ) : (
                  <span className="text-[var(--color-gray-light)]">
                    Posting as Anonymous Guest (No account needed)
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-sm)] flex items-start gap-2 text-xs text-[var(--color-danger)]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="label" htmlFor="report-title">
                Problem Summary / Title *
              </label>
              <input
                id="report-title"
                type="text"
                placeholder="e.g. State unemployment portal invalidates draft when session expires"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                required
                minLength={5}
                maxLength={250}
              />
            </div>

            {/* Category */}
            <div>
              <label className="label" htmlFor="report-category">
                Category *
              </label>
              <select
                id="report-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="select"
              >
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="label" htmlFor="report-desc">
                What happened? Describe the friction & consequences *
              </label>
              <textarea
                id="report-desc"
                placeholder="Provide specific details: What were you attempting to do? What failed or created friction? What workaround did you have to use? What was the impact?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[140px]"
                required
                minLength={20}
                maxLength={5000}
              />
              <span className="text-[10px] font-mono text-[var(--color-gray-dark)] mt-1 block">
                {description.length} / 5000 characters
              </span>
            </div>

            {/* Acceptance Criteria (Kaggle/Devpost Problem Scoping) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0" htmlFor="report-criteria">
                  Acceptance Criteria for Solvers (Optional)
                </label>
                <span className="text-[11px] font-mono text-[var(--color-lime)]">Problem Scoping</span>
              </div>
              <p className="text-[11px] text-[var(--color-gray)] mb-2">
                What would prove this problem is resolved? (One criterion per line, e.g. "Auto-saves draft to localStorage every 10s")
              </p>
              <textarea
                id="report-criteria"
                placeholder="- User draft is preserved across browser session expiration&#10;- Recovery prompt restores form data seamlessly without server rejection"
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                className="input min-h-[85px] font-mono text-xs"
              />
            </div>

            {/* Real-time Inline Candidates (Section 7.1) */}
            {candidateIssues.length > 0 && (
              <div className="p-4 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-lime)] mb-2 font-bold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Existing Related Problems Discovered</span>
                </div>
                <p className="text-xs text-[var(--color-gray)] mb-3">
                  Your report may describe a symptom of an existing issue. Select one to attach your evidence directly, or leave unselected to submit as an independent problem:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {candidateIssues.map((cand) => (
                    <label
                      key={cand.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-[var(--radius-sm)] border cursor-pointer transition-colors ${
                        selectedCandidateId === cand.id
                          ? 'border-[var(--color-lime)] bg-[var(--color-surface)]'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="candidateIssue"
                        checked={selectedCandidateId === cand.id}
                        onChange={() => setSelectedCandidateId(cand.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--color-paper)] line-clamp-1">
                          {cand.title}
                        </div>
                        <div className="text-[11px] text-[var(--color-gray)] line-clamp-1">
                          {cand.problemStatement}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedCandidateId && (
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateId(undefined)}
                    className="text-[11px] font-mono text-[var(--color-gray)] hover:text-[var(--color-paper)] mt-2 underline bg-transparent border-0 cursor-pointer"
                  >
                    Clear selection (submit as new distinct problem)
                  </button>
                )}
              </div>
            )}

            {/* Info notice */}
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-gray)]">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Draft auto-saves in your browser. All submissions are moderated before public listing.</span>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Saving report...' : 'Submit problem report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
