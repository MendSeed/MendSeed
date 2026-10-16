// ============================================================================
// HOW IT WORKS — LIFECYCLE GUIDE
// Aligned with Section 5 of Master Product Brief
// Report -> Validate -> Consolidate -> Explore -> Claim -> Investigate -> Submit -> Verify -> Resolve
// ============================================================================

import React from 'react';
import {
  CheckCircle,
  FileCheck,
  FileText,
  Hammer,
  Layers,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';

interface HowItWorksViewProps {
  onOpenReport: () => void;
  onExplore: () => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onOpenReport, onExplore }) => {
  const steps = [
    {
      number: '01',
      title: 'Report a Problem',
      icon: <Sparkles className="w-5 h-5 text-[var(--color-lime)]" />,
      desc: 'Document the friction, broken workflow, or unmet need you encountered. No conventional account or public identity is required. You receive an anonymous capability token to manage your submission.',
    },
    {
      number: '02',
      title: 'Validation & Deterministic Checks',
      icon: <FileCheck className="w-5 h-5 text-[var(--color-info)]" />,
      desc: 'Your report is saved durably in the database before any background processing. Deterministic safety checks filter obvious spam, scripts, and private data.',
    },
    {
      number: '03',
      title: 'Consolidate into Canonical Issues',
      icon: <Layers className="w-5 h-5 text-[var(--color-warning)]" />,
      desc: 'When multiple reports describe related obstacles, evidence is consolidated into a broader canonical issue statement. Original reports remain preserved as the underlying evidence.',
    },
    {
      number: '04',
      title: 'Problem Hunters Discover Patterns',
      icon: <Search className="w-5 h-5 text-[var(--color-lime)]" />,
      desc: 'Visitors explore the Friction Map, Top 10, and Problem Stream. Support votes indicate community resonance, while QuietFray evaluates temporal persistence.',
    },
    {
      number: '05',
      title: 'Builders Claim Stewardship',
      icon: <Hammer className="w-5 h-5 text-[var(--color-info)]" />,
      desc: 'Solvers declare active work by placing a time-limited (7-day) stewardship lease on an issue. Claims coordinate responsibility without locking out other contributors.',
    },
    {
      number: '06',
      title: 'Submit Structured Solutions',
      icon: <FileText className="w-5 h-5 text-[var(--color-paper)]" />,
      desc: 'Contributors submit prototypes, applications, or open-source repositories. External links are validated for safety against SSRF and malicious schemes.',
    },
    {
      number: '07',
      title: 'Cryptographically Verified Resolution',
      icon: <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />,
      desc: 'An issue may only be marked Solved by the authorized submitter who presents the capability token for a linked solution report. Unsubstantiated claims can be challenged and reopened.',
    },
  ];

  return (
    <div className="py-12 bg-[var(--color-ink)]">
      <div className="page-container">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="section-subheader mb-1 text-[var(--color-lime)]">Product Architecture</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-paper)] tracking-tight mb-4">
            How MendSeed Works
          </h1>
          <p className="text-base text-[var(--color-gray-light)] leading-relaxed">
            Every fix starts with a problem. MendSeed bridges anonymous friction reporting, evidence synthesis, and verifiable open-source solution development.
          </p>
        </div>

        {/* 7-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {steps.map((step) => (
            <div
              key={step.number}
              className="card p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-[var(--color-border)]">
                    {step.number}
                  </span>
                  <div className="p-2 bg-[var(--color-ink)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[var(--color-paper)] mb-2">{step.title}</h3>
                <p className="text-xs text-[var(--color-gray-light)] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Operating Principles Callout */}
        <div className="p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-[var(--color-lime)]" />
            <h2 className="text-xl font-bold text-[var(--color-paper)]">Core Non-Negotiable Guarantees</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[var(--color-gray-light)] leading-relaxed pt-2">
            <div>
              <strong className="text-[var(--color-paper)] block mb-1">Account-Free Participation:</strong>
              No passwords, emails, or phone numbers needed to report, browse, or vote on problems.
            </div>
            <div>
              <strong className="text-[var(--color-paper)] block mb-1">Capability Security:</strong>
              Ownership of work claims and solution reports is verified using client-held cryptographic tokens.
            </div>
            <div>
              <strong className="text-[var(--color-paper)] block mb-1">Zero Fabricated Activity:</strong>
              All Top 10 rankings, event feeds, and metrics reflect real database records.
            </div>
            <div>
              <strong className="text-[var(--color-paper)] block mb-1">Free-First Resilience:</strong>
              The platform continues operating even when third-party AI or external APIs are unavailable.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-8 pt-6 border-t border-[var(--color-border)]">
            <button onClick={onOpenReport} className="btn btn-primary">
              Report a Problem
            </button>
            <button onClick={onExplore} className="btn btn-secondary">
              Explore Active Problems
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
