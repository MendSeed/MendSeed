// ============================================================================
// MENDSEED USER & SOLVER PROFILE VIEW (URL: /johndoe)
// Public/Private Profile with Real Stats, Streaks, and GitHub Linking
// Styled with UI/UX Pro Max Dark Mode Design System
// ============================================================================

import React, { useState, useEffect } from 'react';
import type { CanonicalIssue, UserProfile } from '../types';
import { getCurrentUser, getProfileByUsername, updateProfile } from '../lib/auth';
import { listCanonicalIssues } from '../lib/storage';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Flame,
  Globe,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';

interface UserProfileViewProps {
  username: string;
  onBack: () => void;
  onSelectIssue?: (issue: CanonicalIssue) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  username,
  onBack,
  onSelectIssue,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Issues associated with this user
  const [claimedIssues, setClaimedIssues] = useState<CanonicalIssue[]>([]);
  const [solvedIssues, setSolvedIssues] = useState<CanonicalIssue[]>([]);
  const [scopedIssues, setScopedIssues] = useState<CanonicalIssue[]>([]);

  useEffect(() => {
    const cur = getCurrentUser();
    setCurrentUser(cur);

    const loaded = getProfileByUsername(username);
    if (loaded) {
      setProfile(loaded);
      setBioInput(loaded.bio || '');
      setSkillsInput(loaded.skills.join(', '));
      setIsPublic(loaded.isPublicProfile);
    }

    // Load actual issues linked to this user from storage
    const { issues } = listCanonicalIssues();
    const cleanUser = username.replace(/^@/, '').toLowerCase();

    const claimed = issues.filter(
      (i) => i.claimedSolver?.username?.toLowerCase() === cleanUser && i.status !== 'SOLVED'
    );
    const solved = issues.filter(
      (i) =>
        i.status === 'SOLVED' &&
        (i.closedBy?.username?.toLowerCase() === cleanUser ||
          i.claimedSolver?.username?.toLowerCase() === cleanUser ||
          i.solutions.some((s) => s.status === 'ACCEPTED'))
    );
    const scoped = issues.filter(
      (i) =>
        i.reporterUserId === loaded?.id ||
        i.observedFrictions.some((f) => f.statement.toLowerCase().includes(cleanUser))
    );

    setClaimedIssues(claimed);
    setSolvedIssues(solved);
    setScopedIssues(scoped);
  }, [username]);

  const isOwner = currentUser && profile && currentUser.id === profile.id;

  const handleSaveProfile = () => {
    if (!profile) return;
    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updated = updateProfile(profile.id, {
      bio: bioInput,
      skills,
      isPublicProfile: isPublic,
    });

    if (updated) {
      setProfile(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (!profile) {
    return (
      <div className="page-container py-24 text-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#111622] border border-[#27354A]">
          <h2 className="text-xl font-bold text-white mb-2 font-display">User Not Found</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            The profile for <span className="font-mono text-[#38BDF8]">@{username}</span> does not exist or has not been registered yet.
          </p>
          <button onClick={onBack} className="btn btn-secondary btn-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Discovery</span>
          </button>
        </div>
      </div>
    );
  }

  // If profile is private and viewer is not the owner
  if (!profile.isPublicProfile && !isOwner) {
    return (
      <div className="page-container py-24 text-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#111622] border border-[#27354A]">
          <Lock className="w-10 h-10 text-[#94A3B8] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2 font-display">Private Solver Profile</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            This user has configured their profile to be private. Only the profile owner can view details and stats.
          </p>
          <button onClick={onBack} className="btn btn-secondary btn-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Discovery</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-12 sm:py-16 animate-fade-in text-[#F8FAFC]">
      {/* Top Navigation Bar */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] hover:text-[#22C55E] transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        {isOwner && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-secondary btn-sm text-xs font-mono"
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="mb-6 p-3.5 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="card p-6 sm:p-10 mb-10 bg-gradient-to-br from-[#161F30] to-[#0F172A] border border-[#27354A]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#27354A]">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#22C55E]/40 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-[#22C55E] text-[#0F172A] rounded-full" title="Verified Solver">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  {profile.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8]">
                  @{profile.username}
                </span>
                {profile.isPublicProfile ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-[#22C55E]">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-[#94A3B8]">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 max-w-xl leading-relaxed">
                {profile.bio || 'MendSeed Solver & Problem Scoper.'}
              </p>

              <div className="flex items-center gap-4 mt-3 text-xs text-[#64748B] font-mono">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </span>
                {profile.githubUsername && (
                  <a
                    href={profile.githubUrl || `https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#38BDF8] hover:underline"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>github.com/{profile.githubUsername}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Gamification Key Metrics Badges */}
          <div className="flex items-center gap-3 sm:gap-4 self-stretch md:self-auto justify-between md:justify-end">
            <div className="px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#334155] text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-[#F59E0B] font-mono font-bold text-lg">
                <Flame className="w-4 h-4 fill-[#F59E0B]" />
                {profile.streakDays}d
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8]">Streak</div>
            </div>

            <div className="px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#334155] text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-[#22C55E] font-mono font-bold text-lg">
                <ShieldCheck className="w-4 h-4" />
                {profile.verifiedSolutionsCount}
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8]">Solved</div>
            </div>

            <div className="px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#334155] text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-[#A855F7] font-mono font-bold text-lg">
                <Zap className="w-4 h-4" />
                {profile.points}
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8]">Points</div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="pt-6 space-y-4 border-b border-[#27354A] pb-6">
            <h3 className="text-sm font-bold font-display text-white">Edit Your Profile</h3>
            <div>
              <label className="block text-xs font-mono text-[#94A3B8] mb-1">Bio</label>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={3}
                className="w-full p-3 bg-[#0B0F19] border border-[#334155] rounded-xl text-sm text-white placeholder-[#64748B] focus:border-[#22C55E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#94A3B8] mb-1">
                Skills & Technologies (comma-separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-[#334155] rounded-xl text-sm text-white focus:border-[#22C55E] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 accent-[#22C55E] cursor-pointer"
              />
              <label htmlFor="isPublic" className="text-xs text-[#94A3B8] cursor-pointer">
                Make profile publicly discoverable on MendSeed leaderboards & directories
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleSaveProfile} className="btn btn-primary btn-sm">
                Save Profile Changes
              </button>
            </div>
          </div>
        )}

        {/* Skills & Badges */}
        <div className="pt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-[#64748B] mr-2">Expertise:</span>
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="text-xs font-mono px-3 py-1 rounded-lg bg-[#1B2336] border border-[#334155] text-[#94A3B8]"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs / Activity Sections: Solved Solutions, Claims, Scoped Problems */}
      <div className="space-y-10">
        {/* Verified Solutions Section */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
            <h2 className="text-lg font-bold font-display text-white">
              Verified Solutions ({solvedIssues.length})
            </h2>
          </div>

          {solvedIssues.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#111622] border border-[#27354A] text-center text-xs text-[#94A3B8]">
              No verified closed solutions yet. Claim an open problem to build your track record!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solvedIssues.map((iss) => (
                <div
                  key={iss.id}
                  onClick={() => onSelectIssue && onSelectIssue(iss)}
                  className="card p-5 cursor-pointer hover:border-[#22C55E]/50 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-semibold">
                      VERIFIED SOLVED
                    </span>
                    <span className="text-xs font-mono text-[#64748B]">
                      {new Date(iss.lastActivityAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#22C55E] transition-colors mb-2 line-clamp-1">
                    {iss.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed mb-3">
                    {iss.description}
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono text-[#64748B] pt-2 border-t border-[#27354A]">
                    <span>{iss.category}</span>
                    <span className="text-[#22C55E] flex items-center gap-1 font-semibold">
                      +50 pts awarded
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* In-Progress Claims Section */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <Sparkles className="w-5 h-5 text-[#38BDF8]" />
            <h2 className="text-lg font-bold font-display text-white">
              Active Claims & Investigations ({claimedIssues.length})
            </h2>
          </div>

          {claimedIssues.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#111622] border border-[#27354A] text-center text-xs text-[#94A3B8]">
              No active claims currently in progress.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claimedIssues.map((iss) => (
                <div
                  key={iss.id}
                  onClick={() => onSelectIssue && onSelectIssue(iss)}
                  className="card p-5 cursor-pointer hover:border-[#38BDF8]/50 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-semibold">
                      CLAIMED & BUILDING
                    </span>
                    <span className="text-xs font-mono text-[#64748B]">
                      Lease Active
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#38BDF8] transition-colors mb-2 line-clamp-1">
                    {iss.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {iss.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scoped Problems Section */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <MessageSquare className="w-5 h-5 text-[#A855F7]" />
            <h2 className="text-lg font-bold font-display text-white">
              Scoped Problems ({scopedIssues.length})
            </h2>
          </div>

          {scopedIssues.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#111622] border border-[#27354A] text-center text-xs text-[#94A3B8]">
              No community problems scoped by this user yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopedIssues.map((iss) => (
                <div
                  key={iss.id}
                  onClick={() => onSelectIssue && onSelectIssue(iss)}
                  className="card p-5 cursor-pointer hover:border-[#A855F7]/50 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30 font-semibold">
                      {iss.status}
                    </span>
                    <span className="text-xs font-mono text-[#64748B]">
                      {iss.supportCount} Upvotes
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#A855F7] transition-colors mb-2 line-clamp-1">
                    {iss.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {iss.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
