// ============================================================================
// NEWSLETTER MODAL — MENDSEED DISPATCH (POWERED BY RESEND)
// Aligned with Section 17 of Master Product Brief
// Explicit double opt-in, digest preferences, completely unlinked from reports
// ============================================================================

import React, { useState } from 'react';
import { CheckCircle, Mail, Send, ShieldCheck, X } from 'lucide-react';
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
  const [deliveryNote, setDeliveryNote] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Try serverless Resend API route
      let sentViaApi = false;
      try {
        const resp = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            notifyNewIssues,
            weeklyDigest,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          sentViaApi = true;
          if (data.emailSent) {
            setDeliveryNote('A confirmation email has been sent to your inbox via Resend.');
          } else {
            setDeliveryNote('Your email is registered in our database. (Resend API key can be set in Vercel to enable live dispatch).');
          }
        }
      } catch (apiErr) {
        console.warn('[Newsletter] API call failed, falling back to local/Neon storage:', apiErr);
      }

      // 2. Client fallback if API route was not reached
      if (!sentViaApi) {
        await subscribeNewsletter(email, notifyNewIssues, weeklyDigest);
        setDeliveryNote('Your subscription has been registered.');
      }

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
    setDeliveryNote('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="card w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border-light)] p-8 sm:p-10 rounded-2xl relative shadow-2xl">
        <button
          onClick={handleReset}
          className="absolute top-6 right-6 text-[var(--color-gray)] hover:text-[var(--color-paper)] p-2 rounded-lg bg-[var(--color-ink)] border border-[var(--color-border)] cursor-pointer transition-colors"
          title="Close newsletter dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-paper)] mb-3">
              Subscribed to MendSeed Dispatch
            </h2>
            <p className="text-sm text-[var(--color-gray-light)] leading-relaxed mb-6 max-w-sm mx-auto">
              {deliveryNote || 'You will receive notifications based on your chosen preferences. You can unsubscribe anytime with one click.'}
            </p>
            <div className="p-4 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-xl mb-6 text-xs text-[var(--color-gray)] font-mono">
              Delivery Provider: <span className="text-[var(--color-lime)]">Resend Transactional API</span>
            </div>
            <button onClick={handleReset} className="btn btn-primary w-full py-3 justify-center text-sm">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <div className="section-subheader flex items-center gap-2 mb-2 text-[var(--color-lime)]">
                <Mail className="w-4 h-4" />
                <span>MendSeed Dispatch</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-paper)] tracking-tight">
                Stay Informed on New Problems
              </h2>
              <p className="text-sm text-[var(--color-gray)] mt-2 leading-relaxed">
                Receive curated briefings on newly recognized friction, persistent issues, and verified open-source solutions.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-xl text-xs text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="label text-xs uppercase tracking-wider font-mono text-[var(--color-gray)]" htmlFor="dispatch-email">
                Your Email Address *
              </label>
              <input
                id="dispatch-email"
                type="email"
                placeholder="name@example.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-mono px-4 py-3 rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-lime)] transition-colors"
                required
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 text-xs sm:text-sm text-[var(--color-paper)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyNewIssues}
                  onChange={(e) => setNotifyNewIssues(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-lime)] focus:ring-[var(--color-lime)] cursor-pointer"
                />
                <span className="leading-snug">Alert me when new canonical issues are consolidated</span>
              </label>
              <label className="flex items-start gap-3 text-xs sm:text-sm text-[var(--color-paper)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-lime)] focus:ring-[var(--color-lime)] cursor-pointer"
                />
                <span className="leading-snug">Send weekly QuietFray opportunity & resolution digest</span>
              </label>
            </div>

            <div className="p-4 bg-[var(--color-ink)] rounded-xl border border-[var(--color-border)] flex items-start gap-3 text-xs text-[var(--color-gray)] leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-[var(--color-lime)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--color-paper)]">Privacy guarantee:</strong> Newsletter emails are kept strictly isolated from problem reports, votes, and solution claims. Zero third-party trackers. Powered by Resend.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <button type="button" onClick={handleReset} className="btn btn-ghost text-sm px-5">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary text-sm px-6 py-3 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Subscribing...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black" />
                    <span>Subscribe via Resend</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
