// ============================================================================
// SUBMIT A SOLUTION MODAL
// Aligned with Section 5.4, 8.4 of Master Product Brief
// Structured solution submission with link validation & capability issuance
// ============================================================================

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Hammer, Key, X } from 'lucide-react';
import { submitSolutionReport } from '../lib/storage';
import { generateCapability, storeCapability } from '../lib/capabilities';
import { getCurrentUser } from '../lib/auth';

interface SubmitSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  canonicalIssueId: string;
  issueTitle: string;
  onSolutionSubmitted: () => void;
}

export const SubmitSolutionModal: React.FC<SubmitSolutionModalProps> = ({
  isOpen,
  onClose,
  canonicalIssueId,
  issueTitle,
  onSolutionSubmitted,
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [aspects, setAspects] = useState('');
  const [instructions, setInstructions] = useState('');
  const [limitations, setLimitations] = useState('');
  const [stage, setStage] = useState<'CONCEPT' | 'PROTOTYPE' | 'AVAILABLE' | 'INDEPENDENTLY_VERIFIED'>('PROTOTYPE');
  const [projectName, setProjectName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [verificationEvidence, setVerificationEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const currentUser = getCurrentUser();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Generate capability token for solution submitter
      const capabilityToken = generateCapability('solution');

      const sol = await submitSolutionReport(
        canonicalIssueId,
        {
          title,
          summary,
          aspectsAddressed: aspects.split('\n').filter((a) => a.trim().length > 0),
          usageInstructions: instructions || 'See GitHub repository for setup instructions.',
          limitations,
          stage,
          projectName: projectName || (currentUser ? `${currentUser.username} Fix` : undefined),
          githubUrl: githubUrl.trim() || undefined,
          demoUrl: demoUrl.trim() || undefined,
          verificationEvidence: verificationEvidence.trim() || undefined,
        },
        capabilityToken
      );

      // Store capability in client browser
      await storeCapability('solution', sol.id, capabilityToken, `Solution: ${title.slice(0, 30)}`);

      setSuccessToken(capabilityToken);
      onSolutionSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit solution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (successToken) {
      navigator.clipboard.writeText(successToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setSummary('');
    setAspects('');
    setInstructions('');
    setLimitations('');
    setGithubUrl('');
    setDemoUrl('');
    setSuccessToken(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="card w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 rounded-[var(--radius-md)] relative my-8">
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-[var(--color-gray)] hover:text-[var(--color-paper)] p-1 bg-transparent border-0 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {successToken ? (
          <div className="py-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-paper)] mb-2">Solution Report Registered</h2>
            <p className="text-sm text-[var(--color-gray-light)] leading-relaxed mb-6">
              Your solution report has been linked to this problem. Below is your <strong>Submitter Capability Token</strong>.
            </p>

            {/* Non-negotiable Capability Token Callout */}
            <div className="bg-[var(--color-ink)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] mb-6">
              <div className="flex items-center gap-2 mb-2 text-xs font-mono text-[var(--color-lime)] font-bold">
                <Key className="w-3.5 h-3.5" />
                <span>CRITICAL: Your Anonymous Solution Ownership Token</span>
              </div>
              <p className="text-xs text-[var(--color-gray)] mb-3">
                Per MendSeed Section 8.5, <strong>only the holder of this token</strong> has the cryptographic authority to request marking this issue as Solved once verification passes:
              </p>
              <div className="flex items-center gap-2 bg-[var(--color-surface)] p-2 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                <code className="text-xs font-mono text-[var(--color-paper)] truncate flex-1">{successToken}</code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-secondary btn-sm shrink-0 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <button onClick={handleResetAndClose} className="btn btn-primary w-full justify-center">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <div className="section-subheader flex items-center gap-1.5 mb-1">
                <Hammer className="w-3.5 h-3.5 text-[var(--color-info)]" />
                <span>Contribute a Solution</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-paper)]">Submit a Solution Report</h2>
              <p className="text-xs text-[var(--color-gray)] mt-1 truncate">
                Solving: <strong className="text-[var(--color-paper)]">{issueTitle}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-sm)] flex items-start gap-2 text-xs text-[var(--color-danger)]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label" htmlFor="sol-title">
                Solution Title *
              </label>
              <input
                id="sol-title"
                type="text"
                placeholder="e.g. CivicDraft LocalStorage Proxy Extension"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                required
                minLength={5}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="sol-stage">
                  Development Stage *
                </label>
                <select
                  id="sol-stage"
                  value={stage}
                  onChange={(e: any) => setStage(e.target.value)}
                  className="select"
                >
                  <option value="CONCEPT">Concept / Architecture</option>
                  <option value="PROTOTYPE">Working Prototype</option>
                  <option value="AVAILABLE">Publicly Available</option>
                  <option value="INDEPENDENTLY_VERIFIED">Independently Verified</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="sol-proj">
                  Project or Library Name
                </label>
                <input
                  id="sol-proj"
                  type="text"
                  placeholder="e.g. CivicDraft"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="sol-summary">
                Summary of the Proposed or Implemented Fix *
              </label>
              <textarea
                id="sol-summary"
                placeholder="How does this solution address the underlying problem? What architecture or mechanism does it use?"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="input min-h-[100px]"
                required
                minLength={20}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="sol-gh">
                  GitHub Repository URL (Optional)
                </label>
                <input
                  id="sol-gh"
                  type="url"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>
              <div>
                <label className="label" htmlFor="sol-demo">
                  Demo / Application URL (Optional)
                </label>
                <input
                  id="sol-demo"
                  type="url"
                  placeholder="https://..."
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="sol-aspects">
                Aspects of the Problem Addressed (one per line)
              </label>
              <textarea
                id="sol-aspects"
                placeholder="Preserves form progress locally on 401&#10;Provides countdown timer before session expires"
                value={aspects}
                onChange={(e) => setAspects(e.target.value)}
                className="input min-h-[70px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0" htmlFor="sol-evidence">
                  Verification Evidence & Testing Instructions *
                </label>
                <span className="text-[11px] font-mono text-[var(--color-lime)]">Proof Required</span>
              </div>
              <p className="text-[11px] text-[var(--color-gray)] mb-2">
                Provide instructions or evidence so reviewers can verify your solution satisfies the acceptance criteria:
              </p>
              <textarea
                id="sol-evidence"
                placeholder="Run `npm test` or visit demo URL. Click 'Expire Session' button; observe that form state is automatically recovered."
                value={verificationEvidence}
                onChange={(e) => setVerificationEvidence(e.target.value)}
                className="input min-h-[85px] font-mono text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <button type="button" onClick={handleResetAndClose} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'Registering solution...' : 'Submit solution report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
