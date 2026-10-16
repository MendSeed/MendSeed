// ============================================================================
// FOOTER COMPONENT
// Aligned with Section 9.2 K of Master Product Brief
// ============================================================================

import React from 'react';
import { Mail } from 'lucide-react';

interface FooterProps {
  onOpenNewsletter: () => void;
  onOpenPolicy: (tab: 'privacy' | 'moderation' | 'retention' | 'security' | 'conduct') => void;
  onNavigateTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenNewsletter,
  onOpenPolicy,
  onNavigateTab,
}) => {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-ink)] py-12 text-xs text-[var(--color-gray)]">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-ink-light)] border border-[var(--color-border)] flex items-center justify-center p-1">
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                  <path
                    d="M8 24V12l4-4 4 8 4-8 4 4v12"
                    stroke="var(--color-lime)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="16" cy="10" r="2.5" fill="var(--color-lime)" />
                </svg>
              </div>
              <span className="font-display font-bold text-sm tracking-tight text-[var(--color-paper)]">
                MEND<span className="text-[var(--color-lime)]">SEED</span>
              </span>
            </div>
            <p className="leading-relaxed mb-4">
              Every fix starts with a problem. Discover real friction, consolidate community evidence, and build open solutions.
            </p>
            <div className="font-mono text-[11px] text-[var(--color-gray-dark)]">
              Model: QuietFray v0.1 (Temporal Point Process)
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] font-bold mb-3">
              Explore
            </h4>
            <ul className="space-y-2 list-none">
              <li>
                <button
                  onClick={() => onNavigateTab('explore')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Problem Stream
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('top10')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Top 10 Public Priorities
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('friction-map')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Friction Map Matrix
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('observatory')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Opportunity Observatory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('how-it-works')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Governance & Policies */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] font-bold mb-3">
              Governance & Policies
            </h4>
            <ul className="space-y-2 list-none">
              <li>
                <button
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Privacy Policy (Account-Free)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('moderation')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Moderation Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('retention')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Data Retention & Provenance
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('security')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Security Vulnerability Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('conduct')}
                  className="hover:text-[var(--color-lime)] transition-colors bg-transparent border-0 p-0 cursor-pointer text-xs text-[var(--color-gray)]"
                >
                  Community Code of Conduct
                </button>
              </li>
            </ul>
          </div>

          {/* Open Source & Dispatch */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] font-bold mb-3">
              Open Source & Dispatch
            </h4>
            <p className="leading-relaxed mb-3">
              MendSeed is open source under MIT License. No invasive trackers or advertisement networks.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenNewsletter}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 self-start"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>MendSeed Dispatch</span>
              </button>
              <a
                href="https://github.com/MendSeed/MendSeed"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[var(--color-gray)] hover:text-[var(--color-lime)] transition-colors mt-2"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[var(--color-gray-dark)]">
          <div>© {new Date().getFullYear()} MendSeed. Free-first, evidence-driven, privacy-conscious.</div>
          <div>Tagline: Every fix starts with a problem.</div>
        </div>
      </div>
    </footer>
  );
};
