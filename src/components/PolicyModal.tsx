// ============================================================================
// POLICY & DOCUMENTATION MODAL
// Aligned with Section 7, 16, 24 of Master Product Brief
// Privacy, Moderation, Data Retention, Security Reporting, Code of Conduct
// ============================================================================

import React, { useState } from 'react';
import { BookOpen, X } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'moderation' | 'retention' | 'security' | 'conduct';
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'moderation' | 'retention' | 'security' | 'conduct'>(
    initialTab
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="card w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 rounded-[var(--radius-md)] relative my-8 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--color-gray)] hover:text-[var(--color-paper)] p-1 bg-transparent border-0 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="section-subheader flex items-center gap-1.5 mb-1 text-[var(--color-lime)]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Public Governance & Policies</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-paper)]">MendSeed Trust & Safety</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] mb-6">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 px-3 text-xs font-mono uppercase tracking-wider transition-colors border-0 border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'privacy'
                ? 'border-[var(--color-lime)] text-[var(--color-lime)] font-bold'
                : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`pb-2 px-3 text-xs font-mono uppercase tracking-wider transition-colors border-0 border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'moderation'
                ? 'border-[var(--color-lime)] text-[var(--color-lime)] font-bold'
                : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
            }`}
          >
            Moderation Policy
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`pb-2 px-3 text-xs font-mono uppercase tracking-wider transition-colors border-0 border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'retention'
                ? 'border-[var(--color-lime)] text-[var(--color-lime)] font-bold'
                : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
            }`}
          >
            Data Retention
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2 px-3 text-xs font-mono uppercase tracking-wider transition-colors border-0 border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'security'
                ? 'border-[var(--color-lime)] text-[var(--color-lime)] font-bold'
                : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
            }`}
          >
            Security Reporting
          </button>
          <button
            onClick={() => setActiveTab('conduct')}
            className={`pb-2 px-3 text-xs font-mono uppercase tracking-wider transition-colors border-0 border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'conduct'
                ? 'border-[var(--color-lime)] text-[var(--color-lime)] font-bold'
                : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
            }`}
          >
            Code of Conduct
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-xs text-[var(--color-gray-light)] leading-relaxed space-y-4 font-body">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-paper)]">Privacy-Preserving Participation</h3>
              <p>
                MendSeed requires no user accounts, passwords, social logins, or phone numbers to report, explore, or support problems.
              </p>
              <h4 className="text-xs font-bold text-[var(--color-paper)]">1. Data Minimization</h4>
              <p>
                We do not collect names, biographical details, or IP fingerprints. The only personal contact information intentionally collected is an email address voluntarily supplied for optional newsletter subscriptions.
              </p>
              <h4 className="text-xs font-bold text-[var(--color-paper)]">2. Strict Isolation</h4>
              <p>
                Newsletter subscription data is kept completely isolated from problem reports, support votes, work claims, and public issue pages. We never cross-reference subscriber emails with reporting activity.
              </p>
              <h4 className="text-xs font-bold text-[var(--color-paper)]">3. Capability Tokens</h4>
              <p>
                Instead of identity profiles, actions requiring continuity (such as managing a work lease or marking a solution as solved) use client-held cryptographic capability tokens. The server stores only a SHA-256 hash.
              </p>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-paper)]">Moderation Policy & Guidelines</h3>
              <p>
                MendSeed is a public problem-discovery and solution-development platform, not a generic complaint wall or attack surface.
              </p>
              <h4 className="text-xs font-bold text-[var(--color-paper)]">1. Prohibited Submissions</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Personal attacks, defamation, or doxxing of individuals.</li>
                <li>Malware, exploits, phishing, scam tokens, or credential theft links.</li>
                <li>Commercial spam, affiliate marketing, or repetitive low-diversity floods.</li>
                <li>Private confidential secrets (passwords, private keys, medical IDs).</li>
              </ul>
              <h4 className="text-xs font-bold text-[var(--color-paper)]">2. Deterministic & Human Oversight</h4>
              <p>
                All submissions pass deterministic pre-checks. AI suggestions never autonomously delete reports or execute arbitrary merges without validated review thresholds.
              </p>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-paper)]">Data Retention & Provenance</h3>
              <p>
                Original problem reports are preserved as verifiable evidence for canonical issues. Association with a broader problem statement never erases the author's original wording.
              </p>
              <h4 className="text-xs font-bold text-[var(--color-paper)]">Capability-Based Deletion</h4>
              <p>
                A reporter holding their anonymous capability token may withdraw their submission at any time. Once withdrawn, content is purged from active search and canonical evidence indexes.
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-paper)]">Coordinated Vulnerability Disclosure</h3>
              <p>
                We welcome responsible security research regarding MendSeed, QuietFray v0.1 algorithms, and infrastructure.
              </p>
              <p>
                To report a vulnerability, please contact the maintainers via security@mendseed.org or file a confidential GitHub Security Advisory. We commit to acknowledging receipt within 48 hours and validating fixes before public disclosure.
              </p>
            </div>
          )}

          {activeTab === 'conduct' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-paper)]">Community Code of Conduct</h3>
              <p>
                MendSeed fosters a constructive, open, and respectful environment for reporters, Problem Hunters, and open-source builders.
              </p>
              <p>
                We treat obstacles and broken systems as puzzles to be understood and solved collaboratively. Harassment, condescension, and malicious manipulation of voting or claims are strictly prohibited.
              </p>
            </div>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex justify-end">
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
