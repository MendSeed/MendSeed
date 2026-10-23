// ============================================================================
// MENDSEED LEADERBOARD & TOP 10 SOLVERS (KAGGLE + GITHUB HYBRID)
// Transparent, Non-Fabricated Contributor Rankings & Streaks
// Styled with UI/UX Pro Max Dark Mode Design System
// ============================================================================

import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';
import { getLeaderboards } from '../lib/auth';
import {
  Award,
  ChevronRight,
  Flame,
  Mail,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

interface LeaderboardViewProps {
  onSelectUser: (username: string) => void;
  onOpenNewsletter: () => void;
  onOpenAuth: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onSelectUser,
  onOpenNewsletter,
  onOpenAuth,
}) => {
  const [boardType, setBoardType] = useState<'solvers' | 'scopers' | 'overall'>('solvers');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all'>('all');
  const [data, setData] = useState<{
    topSolvers: LeaderboardEntry[];
    topScopers: LeaderboardEntry[];
    topOverall: LeaderboardEntry[];
  }>({
    topSolvers: [],
    topScopers: [],
    topOverall: [],
  });

  useEffect(() => {
    const res = getLeaderboards(timeframe);
    setData(res);
  }, [timeframe]);

  const currentList =
    boardType === 'solvers'
      ? data.topSolvers
      : boardType === 'scopers'
      ? data.topScopers
      : data.topOverall;

  return (
    <div className="page-container py-12 sm:py-16 animate-fade-in text-[#F8FAFC]">
      {/* Header Banner */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] text-xs font-mono mb-4">
          <Trophy className="w-3.5 h-3.5" />
          <span>Proof-of-Resolution Observatory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-white mb-4">
          Community Solver Rankings
        </h1>
        <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
          Gamified, auditable leaderboards inspired by Kaggle and GitHub. Points are only awarded for verified code solutions, reproducible problem scoping, and peer verification.
        </p>
      </div>

      {/* Top 10 Weekly Digest Newsletter Callout Card */}
      <div className="card p-6 sm:p-8 mb-10 bg-gradient-to-r from-[#1B2336] via-[#161F30] to-[#0F172A] border border-[#27354A] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] shrink-0">
            <Mail className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white mb-1">
              Top 10 Weekly Solver Dispatch
            </h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl">
              Delivered via Resend every Monday. Features the week's top 10 verified solvers, newly solved systemic issues, and emergent community friction.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenNewsletter}
          className="btn btn-primary btn-sm shrink-0 font-mono text-xs cursor-pointer shadow-lg hover:scale-105 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Subscribe to Dispatch</span>
        </button>
      </div>

      {/* Leaderboard Controls (Board Type & Timeframe) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Categories Tab Group */}
        <div className="flex items-center p-1.5 rounded-xl bg-[#111622] border border-[#27354A] self-start sm:self-auto">
          <button
            onClick={() => setBoardType('solvers')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              boardType === 'solvers'
                ? 'bg-[#22C55E] text-[#0F172A] font-bold shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            🛡️ Top Solvers
          </button>
          <button
            onClick={() => setBoardType('scopers')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              boardType === 'scopers'
                ? 'bg-[#38BDF8] text-[#0F172A] font-bold shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            📋 Problem Scopers
          </button>
          <button
            onClick={() => setBoardType('overall')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              boardType === 'overall'
                ? 'bg-[#A855F7] text-white font-bold shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            ⚡ Overall (Points)
          </button>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono text-[#64748B]">
          <span>Window:</span>
          <div className="flex rounded-lg bg-[#0B0F19] p-1 border border-[#27354A]">
            {(['all', 'monthly', 'weekly'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-[11px] capitalize cursor-pointer transition-all ${
                  timeframe === tf ? 'bg-[#27354A] text-white font-bold' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-hidden border border-[#27354A] bg-[#111622] mb-12">
        {currentList.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2 font-display">No Registered Solvers in This Window Yet</h3>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto mb-6">
              MendSeed enforces zero fake statistics. Be the first to create your solver account and claim the #1 ranking!
            </p>
            <button onClick={onOpenAuth} className="btn btn-primary btn-sm font-mono text-xs">
              <Zap className="w-4 h-4" />
              <span>Claim #1 Solver Rank</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27354A] bg-[#0B0F19] text-[#94A3B8] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Contributor</th>
                  <th className="py-3.5 px-4 text-center">Streak</th>
                  <th className="py-3.5 px-4 text-center">
                    {boardType === 'scopers' ? 'Scoped' : 'Verified Solved'}
                  </th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 sm:px-6 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27354A]/60 text-sm">
                {currentList.map((entry) => {
                  return (
                    <tr
                      key={entry.user.id}
                      onClick={() => onSelectUser(entry.user.username)}
                      className="hover:bg-[#1B2336]/60 transition-colors cursor-pointer group"
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-4 sm:px-6 text-center font-mono font-bold">
                        {entry.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                            🥇
                          </span>
                        ) : entry.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#94A3B8]/20 text-white border border-[#94A3B8]/40">
                            🥈
                          </span>
                        ) : entry.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#B45309]/20 text-[#D97706] border border-[#B45309]/40">
                            🥉
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">#{entry.rank}</span>
                        )}
                      </td>

                      {/* User Info Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.user.avatarUrl}
                            alt={entry.user.name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#334155]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-[#22C55E] transition-colors">
                                {entry.user.name}
                              </span>
                              <span className="font-mono text-xs text-[#38BDF8]">
                                @{entry.user.username}
                              </span>
                            </div>
                            <p className="text-xs text-[#94A3B8] line-clamp-1 max-w-sm">
                              {entry.user.bio || 'Solver on MendSeed.'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Streak Column */}
                      <td className="py-4 px-4 text-center font-mono">
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-bold text-xs px-2.5 py-1 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                          <Flame className="w-3.5 h-3.5 fill-[#F59E0B]" />
                          {entry.streakDays}d
                        </span>
                      </td>

                      {/* Solved / Scoped Column */}
                      <td className="py-4 px-4 text-center font-mono">
                        {boardType === 'scopers' ? (
                          <span className="text-[#38BDF8] font-bold text-sm">
                            {entry.problemsScoped}
                          </span>
                        ) : (
                          <span className="text-[#22C55E] font-bold text-sm flex items-center justify-center gap-1">
                            <ShieldCheck className="w-4 h-4" />
                            {entry.verifiedSolutions}
                          </span>
                        )}
                      </td>

                      {/* Points Column */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-[#A855F7] text-sm">
                        {entry.score.toLocaleString()} pts
                      </td>

                      {/* Action Arrow */}
                      <td className="py-4 px-4 sm:px-6 text-right text-[#64748B] group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transparent Scoring Criteria (Gamification Rules) */}
      <div className="card p-6 sm:p-8 border border-[#27354A] bg-[#0E131F]">
        <h3 className="text-base font-bold font-display text-white mb-2 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#22C55E]" />
          <span>Proof-of-Resolution Scoring Rules</span>
        </h3>
        <p className="text-xs text-[#94A3B8] mb-6">
          Points are strictly deterministic and cannot be gamed by repetitive clicks, spam votes, or artificial activity.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-[#161F30] border border-[#27354A]">
            <span className="text-[#22C55E] font-bold text-base block mb-1">+50 PTS</span>
            <strong className="text-white block font-sans text-xs mb-1">Verified Solution Closed</strong>
            <p className="text-[#94A3B8] text-[11px] font-sans">
              Awarded only when an independent reviewer or problem reporter verifies the fix with documented evidence.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161F30] border border-[#27354A]">
            <span className="text-[#38BDF8] font-bold text-base block mb-1">+5 PTS</span>
            <strong className="text-white block font-sans text-xs mb-1">Problem Scoped & Accepted</strong>
            <p className="text-[#94A3B8] text-[11px] font-sans">
              Awarded when a structured community friction report is validated with reproducible symptoms.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161F30] border border-[#27354A]">
            <span className="text-[#A855F7] font-bold text-base block mb-1">+10 PTS</span>
            <strong className="text-white block font-sans text-xs mb-1">Peer Verification Audit</strong>
            <p className="text-[#94A3B8] text-[11px] font-sans">
              Awarded to authorized verifiers testing and confirming external pull requests and demo builds.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161F30] border border-[#27354A]">
            <span className="text-[#F59E0B] font-bold text-base block mb-1">STREAK MULTIPLIER</span>
            <strong className="text-white block font-sans text-xs mb-1">Daily Builder Streak</strong>
            <p className="text-[#94A3B8] text-[11px] font-sans">
              Consecutive days of active contribution, investigation claims, or discussion participation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
