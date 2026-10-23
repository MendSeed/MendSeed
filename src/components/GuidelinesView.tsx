// ============================================================================
// MENDSEED COMMUNITY GUIDELINES & PROBLEM SCOPING PROTOCOL
// Ethical Principles, Verification Protocol & Anti-Abuse Controls
// Styled with UI/UX Pro Max Dark Mode Design System
// ============================================================================

import React from 'react';
import {
  Award,
  CheckCircle2,
  FileCheck,
  GitPullRequest,
  HeartHandshake,
  Lock,
  Scale,
  Shield,
  ShieldAlert,
} from 'lucide-react';

export const GuidelinesView: React.FC = () => {
  return (
    <div className="page-container py-12 sm:py-16 animate-fade-in text-[#F8FAFC]">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-mono mb-4">
          <Scale className="w-3.5 h-3.5" />
          <span>Governance & Ethical Standards</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-white mb-4">
          Community Guidelines & Verification Protocol
        </h1>
        <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
          MendSeed connects citizens facing recurring friction with engineers looking for genuine problems worth solving. These rules preserve platform integrity, protect privacy, and ensure verified outcomes.
        </p>
      </div>

      {/* Bento Grid Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Card 1: Account-Free Reporting */}
        <div className="card p-6 sm:p-7 bg-[#111622] border border-[#27354A] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] w-fit mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2">
              1. Account-Free Reporting
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Anyone can report friction without creating a password or public identity. We collect zero tracking cookies or unnecessary personal data. Operational logs are cryptographically hashed.
            </p>
          </div>
          <div className="pt-4 border-t border-[#27354A] mt-4 flex items-center gap-2 text-[11px] font-mono text-[#38BDF8]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Privacy-First Principle</span>
          </div>
        </div>

        {/* Card 2: Grounded Real Evidence */}
        <div className="card p-6 sm:p-7 bg-[#111622] border border-[#27354A] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] w-fit mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2">
              2. Grounded Evidence Only
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Reports must reflect genuine, observed real-world friction. Fabricated complaints, defamatory accusations, or automated spam submissions are strictly purged.
            </p>
          </div>
          <div className="pt-4 border-t border-[#27354A] mt-4 flex items-center gap-2 text-[11px] font-mono text-[#22C55E]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auditable Symptoms</span>
          </div>
        </div>

        {/* Card 3: Stewardship Leases */}
        <div className="card p-6 sm:p-7 bg-[#111622] border border-[#27354A] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] w-fit mb-4">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2">
              3. Volunteer Claims & Leases
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Solvers volunteer by claiming an active 7-day stewardship lease. Only claim issues you genuinely intend to work on. Stalled leases expire automatically to allow other builders to collaborate.
            </p>
          </div>
          <div className="pt-4 border-t border-[#27354A] mt-4 flex items-center gap-2 text-[11px] font-mono text-[#A855F7]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Collaborative Stewardship</span>
          </div>
        </div>

        {/* Card 4: Enforced Resolution Rule */}
        <div className="card p-6 sm:p-7 bg-[#111622] border border-[#27354A] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] w-fit mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2">
              4. Proof-of-Resolution Rule
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              An issue may <strong className="text-white">only be marked Solved</strong> if a verifiable solution proposal has been submitted with a public GitHub repo, pull request, or live demo that satisfies acceptance criteria.
            </p>
          </div>
          <div className="pt-4 border-t border-[#27354A] mt-4 flex items-center gap-2 text-[11px] font-mono text-[#22C55E]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strict Verification Required</span>
          </div>
        </div>

        {/* Card 5: Open Source & Attribution */}
        <div className="card p-6 sm:p-7 bg-[#111622] border border-[#27354A] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] w-fit mb-4">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2">
              5. Open Source & Licensing
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Credit co-collaborators honestly. All solution code submitted to MendSeed should specify an OSI-approved open license (MIT, Apache-2.0, AGPL) to maximize community benefit.
            </p>
          </div>
          <div className="pt-4 border-t border-[#27354A] mt-4 flex items-center gap-2 text-[11px] font-mono text-[#F59E0B]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Community Benefit</span>
          </div>
        </div>

        {/* Card 6: Anti-Gaming & Point Integrity */}
        <div className="card p-6 sm:p-7 bg-[#111622] border border-[#27354A] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] w-fit mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2">
              6. Zero Gaming of Leaderboards
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Self-verification, repetitive comment spam, bot swarms, and synthetic voting are detected by the QuietFray point-process engine. Fraudulent points and streaks are revoked.
            </p>
          </div>
          <div className="pt-4 border-t border-[#27354A] mt-4 flex items-center gap-2 text-[11px] font-mono text-[#EF4444]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>QuietFray Hawkes Guard</span>
          </div>
        </div>
      </div>

      {/* The Resolution Lifecycle Protocol */}
      <div className="card p-8 bg-[#111622] border border-[#27354A]">
        <h2 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2.5">
          <Award className="w-6 h-6 text-[#22C55E]" />
          <span>The 5-Step Solution Verification Workflow</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] mb-8 leading-relaxed max-w-3xl">
          To bridge the gap between problem logging and real impact, MendSeed enforces an auditable progression:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#27354A] flex flex-col justify-between">
            <span className="font-mono text-xs text-[#38BDF8] font-bold mb-2">STEP 01</span>
            <strong className="text-sm text-white block mb-1">Problem Scoped</strong>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Reported with symptoms and defined acceptance criteria.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#27354A] flex flex-col justify-between">
            <span className="font-mono text-xs text-[#A855F7] font-bold mb-2">STEP 02</span>
            <strong className="text-sm text-white block mb-1">Solver Claims</strong>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Authenticated builder claims a 7-day stewardship lease.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#27354A] flex flex-col justify-between">
            <span className="font-mono text-xs text-[#F59E0B] font-bold mb-2">STEP 03</span>
            <strong className="text-sm text-white block mb-1">Collaborate</strong>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Threaded discussions, technical trade-offs, and repo links.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#27354A] flex flex-col justify-between">
            <span className="font-mono text-xs text-[#38BDF8] font-bold mb-2">STEP 04</span>
            <strong className="text-sm text-white block mb-1">Submit Proposal</strong>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Structured PR, demo, and test logs submitted for review.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#22C55E]/40 bg-[#22C55E]/5 flex flex-col justify-between">
            <span className="font-mono text-xs text-[#22C55E] font-bold mb-2">STEP 05</span>
            <strong className="text-sm text-white block mb-1">Verified Close</strong>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Accepted against criteria. +50 points awarded to solver.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
