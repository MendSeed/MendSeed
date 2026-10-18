// ============================================================================
// MENDSEED HOMEPAGE HERO
// Spacious Dark Observatory Aesthetic
// Precision, Live Telemetry & Generous Breathing Room
// ============================================================================

import React from 'react';
import { ArrowRight, Database, ShieldCheck, Sparkles } from 'lucide-react';

interface HeroProps {
  onOpenReport: () => void;
  onExplore: () => void;
  totalIssues: number;
  totalReports: number;
  totalSolutions: number;
  isNeonConnected?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenReport,
  onExplore,
  totalIssues,
  totalReports,
  totalSolutions,
  isNeonConnected = true,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] py-20 sm:py-28 lg:py-36">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(210,248,39,0.08),transparent_70%)] pointer-events-none" />

      <div className="page-container relative z-10">
        <div className="max-w-5xl mx-auto text-center lg:text-left">
          {/* Tagline / Telemetry Badge */}
          <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-3 px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] mb-10 shadow-sm">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-lime)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-lime)]" />
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-gray-light)]">
              QuietFray v0.1 Evidence Engine
            </span>
            <span className="text-[var(--color-border-light)]">•</span>
            <span className="font-mono text-xs text-[var(--color-success)] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              {isNeonConnected ? 'Neon Postgres Synced' : 'Local Node Active'}
            </span>
            <span className="text-[var(--color-border-light)]">•</span>
            <span className="font-mono text-xs text-[var(--color-gray)]">
              Zero Mock Data
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-paper)] leading-[1.12] mb-8">
            The world is full of things that{' '}
            <span className="bg-gradient-to-r from-[var(--color-paper)] via-[var(--color-paper-warm)] to-[var(--color-lime)] bg-clip-text text-transparent">
              shouldn't be this annoying.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="font-body text-xl sm:text-2xl text-[var(--color-gray-light)] leading-relaxed mb-12 max-w-3xl mx-auto lg:mx-0">
            Document the friction you keep running into. Consolidate evidence into canonical issues. Give builders verified problems worth solving.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 mb-14">
            <button
              onClick={onOpenReport}
              className="btn btn-primary btn-lg shadow-xl flex items-center gap-2.5 group px-8 py-4"
            >
              <Sparkles className="w-5 h-5 text-black group-hover:rotate-12 transition-transform" />
              <span>Report a Problem</span>
            </button>
            <button
              onClick={onExplore}
              className="btn btn-secondary btn-lg flex items-center gap-2.5 px-8 py-4"
            >
              <span>Explore Verified Friction</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy & Governance Notice */}
          <div className="flex items-start gap-4 text-xs sm:text-sm text-[var(--color-gray)] max-w-3xl mx-auto lg:mx-0 bg-[var(--color-surface)]/90 backdrop-blur-md p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] mb-14 text-left leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-[var(--color-lime)] shrink-0 mt-0.5" />
            <p>
              <strong className="text-[var(--color-paper)] font-medium">Privacy-First Architecture:</strong> Zero conventional accounts, zero tracking cookies, and zero behavioral profiling. Action authorization uses client-held SHA-256 capability tokens.
            </p>
          </div>

          {/* Live Metrics Ticker */}
          <div className="grid grid-cols-3 gap-8 sm:gap-14 pt-10 border-t border-[var(--color-border)] max-w-2xl mx-auto lg:mx-0">
            <div className="text-left">
              <div className="stat-value text-[var(--color-lime)]">{totalIssues}</div>
              <div className="stat-label mt-2">Canonical Issues</div>
            </div>
            <div className="text-left">
              <div className="stat-value text-[var(--color-paper)]">{totalReports}</div>
              <div className="stat-label mt-2">Verified Reports</div>
            </div>
            <div className="text-left">
              <div className="stat-value text-[var(--color-success)]">{totalSolutions}</div>
              <div className="stat-label mt-2">Verified Fixes</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
