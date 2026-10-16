// ============================================================================
// NEWSLETTER MODAL — MENDSEED DISPATCH
// Aligned with Section 17 of Master Product Brief
// Explicit double opt-in, digest preferences, completely unlinked from reports
// ============================================================================

import React, { useState } from 'react';
import { CheckCircle, Mail, ShieldCheck, X } from 'lucide-react';
import { subscribeNewsletter } from '../lib/storage';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewsletterModal: React.FC<NewsletterModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [notifyNewIssues, setNotifyNewIssues] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await subscribeNewsletter(email, notifyNewIssues, weeklyDigest);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Subscription failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="card w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 rounded-[var(--radius-md)] relative my-8">
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 text-[var(--color-gray)] hover:text-[var(--color-paper)] p-1 bg-transparent border-0 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-paper)] mb-2">Subscribed to MendSeed Dispatch</h2>
            <p className="text-xs text-[var(--color-gray-light)] leading-relaxed mb-6">
              You will receive notifications based on your chosen preferences. You can unsubscribe anytime with one click.
            </p>
            <button onClick={handleReset} className="btn btn-primary w-full justify-center">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <div className="section-subheader flex items-center gap-1.5 mb-1 text-[var(--color-lime)]">
                <Mail className="w-3.5 h-3.5" />
                <span>MendSeed Dispatch</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--color-paper)]">Stay Informed on New Problems</h2>
              <p className="text-xs text-[var(--color-gray)] mt-1">
                Receive curated briefings on newly recognized friction and verified solutions.
              </p>
            </div>

            {error && (
              <div className="p-2.5 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-sm)] text-xs text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <div>
              <label className="label" htmlFor="dispatch-email">
                Your Email Address *
              </label>
              <input
                id="dispatch-email"
                type="email"
                placeholder="name@example.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-[var(--color-paper)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyNewIssues}
                  onChange={(e) => setNotifyNewIssues(e.target.checked)}
                />
                <span>Alert me when new canonical issues are published</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--color-paper)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                />
                <span>Send weekly opportunity & resolution digest</span>
              </label>
            </div>

            <div className="p-3 bg-[var(--color-ink)] rounded-[var(--radius-sm)] border border-[var(--color-border)] flex items-start gap-2 text-[11px] text-[var(--color-gray)]">
              <ShieldCheck className="w-4 h-4 text-[var(--color-lime)] shrink-0 mt-0.5" />
              <span>
                <strong>Privacy guarantee:</strong> Newsletter emails are kept strictly isolated from problem reports, votes, and solution claims. Zero third-party trackers.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={handleReset} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm">
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
