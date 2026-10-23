// ============================================================================
// MENDSEED MASTER APPLICATION
// Problem-to-Solution Scoping Hub (GitHub + Kaggle + Devpost Hybrid)
// Powered by QuietFray Mathematical Model & Realtime Neon Persistence
// Styled with UI/UX Pro Max Dark Mode Design System
// ============================================================================

import React, { useEffect, useState } from 'react';
import type { CanonicalIssue, Category, IssueEvent, IssueStatus, UserProfile } from './types';
import { CATEGORY_LABELS } from './types';
import {
  castSupportVote,
  getCanonicalIssue,
  getUserVote,
  listCanonicalIssues,
  listPublicEvents,
  syncWithNeon,
} from './lib/storage';
import { getOrCreateVoterToken } from './lib/capabilities';
import { getCurrentUser, onAuthStateChange, RESERVED_USERNAMES, signOut } from './lib/auth';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { RecentActivity } from './components/RecentActivity';
import { TopTen } from './components/TopTen';
import { FrictionMap } from './components/FrictionMap';
import { ProblemStream } from './components/ProblemStream';
import { ProblemEvidenceModal } from './components/ProblemEvidenceModal';
import { ReportProblemModal } from './components/ReportProblemModal';
import { ObservatoryView } from './components/ObservatoryView';
import { HowItWorksView } from './components/HowItWorksView';
import { LeaderboardView } from './components/LeaderboardView';
import { UserProfileView } from './components/UserProfileView';
import { GuidelinesView } from './components/GuidelinesView';
import { AuthModal } from './components/AuthModal';
import { NewsletterModal } from './components/NewsletterModal';
import { PolicyModal } from './components/PolicyModal';
import { Footer } from './components/Footer';
import { ArrowRight, Compass, Zap } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [rankingMode, setRankingMode] = useState<'trending' | 'most_supported' | 'newest' | 'quietfray'>('trending');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'ALL' | 'UNSOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [issues, setIssues] = useState<CanonicalIssue[]>([]);
  const [publicEvents, setPublicEvents] = useState<IssueEvent[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CanonicalIssue | null>(null);

  // Auth & Profile state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewProfileUsername, setViewProfileUsername] = useState<string | null>(null);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<'privacy' | 'moderation' | 'retention' | 'security' | 'conduct' | null>(null);

  // Voter state
  const [voterHash, setVoterHash] = useState<string>('');
  const [userVotes, setUserVotes] = useState<Record<string, 'UP' | 'DOWN' | null>>({});

  // Sync auth state listener
  useEffect(() => {
    const unsub = onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // Parse path for dedicated user profile URL (e.g. /johndoe or /@johndoe)
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+/, '').trim();
    if (path) {
      const clean = path.replace(/^@/, '').toLowerCase();
      if (!RESERVED_USERNAMES.has(clean) && clean.length > 1) {
        setViewProfileUsername(clean);
        setActiveTab('profile');
      }
    }

    const handlePopState = () => {
      const p = window.location.pathname.replace(/^\/+/, '').trim();
      if (!p) {
        setViewProfileUsername(null);
        setActiveTab('explore');
      } else {
        const clean = p.replace(/^@/, '').toLowerCase();
        if (!RESERVED_USERNAMES.has(clean)) {
          setViewProfileUsername(clean);
          setActiveTab('profile');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateToProfile = (username: string) => {
    const clean = username.replace(/^@/, '').trim();
    setViewProfileUsername(clean);
    setActiveTab('profile');
    try {
      window.history.pushState(null, '', `/${clean}`);
    } catch {}
  };

  const handleBackFromProfile = () => {
    setViewProfileUsername(null);
    setActiveTab('explore');
    try {
      window.history.pushState(null, '', '/');
    } catch {}
  };

  // Initialize voter capability token
  useEffect(() => {
    getOrCreateVoterToken().then(({ hash }) => {
      setVoterHash(hash);
    });
  }, []);

  // Fetch / Refresh repository data
  const refreshData = () => {
    const { issues: loadedIssues } = listCanonicalIssues({
      query: searchQuery,
      category: selectedCategory,
      status: statusFilter,
      rankingMode,
    });
    setIssues(loadedIssues);
    setPublicEvents(listPublicEvents(8));

    if (selectedIssue) {
      const refreshed = getCanonicalIssue(selectedIssue.id);
      if (refreshed) setSelectedIssue(refreshed);
    }
  };

  useEffect(() => {
    refreshData();
  }, [searchQuery, selectedCategory, statusFilter, rankingMode]);

  // Periodic background real-time sync with Neon PostgreSQL
  useEffect(() => {
    syncWithNeon().then(() => refreshData());

    const interval = setInterval(() => {
      syncWithNeon().then(() => refreshData());
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Load user vote states for visible issues
  useEffect(() => {
    if (!voterHash) return;
    const votesMap: Record<string, 'UP' | 'DOWN' | null> = {};
    for (const iss of issues) {
      votesMap[iss.id] = getUserVote(iss.id, voterHash);
    }
    setUserVotes(votesMap);
  }, [issues, voterHash]);

  const handleVote = async (issueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { token } = await getOrCreateVoterToken();
      const res = await castSupportVote(issueId, token, 'UP');
      setUserVotes((prev) => ({ ...prev, [issueId]: res.userVote }));
      refreshData();
    } catch (err: any) {
      console.error('Vote failed:', err.message);
    }
  };

  // Metrics
  const totalReportsCount = issues.reduce((acc, curr) => acc + curr.reportCount, 0);
  const totalSolutionsCount = issues.reduce(
    (acc, curr) =>
      acc + curr.solutions.filter((s) => s.status === 'ACCEPTED' || s.stage === 'INDEPENDENTLY_VERIFIED').length,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#080907] text-[#F8FAFC]">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setViewProfileUsername(null);
          setActiveTab(tab);
          try {
            window.history.pushState(null, '', '/');
          } catch {}
        }}
        onOpenReport={() => setIsReportModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (activeTab !== 'explore') setActiveTab('explore');
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSelectUser={handleNavigateToProfile}
        onSignOut={() => signOut()}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Profile Page View */}
        {activeTab === 'profile' && viewProfileUsername && (
          <UserProfileView
            username={viewProfileUsername}
            onBack={handleBackFromProfile}
            onSelectIssue={(iss) => setSelectedIssue(iss)}
          />
        )}

        {/* Explore Feed */}
        {activeTab === 'explore' && (
          <>
            <Hero
              onOpenReport={() => setIsReportModalOpen(true)}
              onExplore={() => {
                const el = document.getElementById('feed-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              totalIssues={issues.length}
              totalReports={totalReportsCount}
              totalSolutions={totalSolutionsCount}
              isNeonConnected={true}
            />

            {/* Dashboard 2-Column Section */}
            <div id="feed-section" className="page-container py-14 sm:py-16 lg:py-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
                {/* Primary Column: Problem Stream & Controls (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                  <ProblemStream
                    issues={issues}
                    rankingMode={rankingMode}
                    setRankingMode={setRankingMode}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    onSelectIssue={setSelectedIssue}
                    onVote={handleVote}
                    userVotes={userVotes}
                    searchQuery={searchQuery}
                    onOpenReport={() => setIsReportModalOpen(true)}
                  />
                </div>

                {/* Secondary Column: Live Stream & Widgets (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Solver Callout Card */}
                  <div className="card p-6 bg-gradient-to-br from-[#1B2336] to-[#111622] border border-[#27354A]">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#22C55E]" />
                      <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                        Solve & Earn Reputation
                      </h3>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
                      Developers can claim open community friction, link GitHub PRs, and earn verified solver rankings.
                    </p>
                    {currentUser ? (
                      <button
                        onClick={() => handleNavigateToProfile(currentUser.username)}
                        className="btn btn-secondary btn-sm w-full font-mono text-xs text-[#22C55E] border-[#22C55E]/40"
                      >
                        View My Solver Profile (@{currentUser.username})
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="btn btn-primary btn-sm w-full font-mono text-xs"
                      >
                        Join as Verified Solver
                      </button>
                    )}
                  </div>

                  {/* Live Activity Feed Widget */}
                  <RecentActivity
                    events={publicEvents}
                    onSelectIssueId={(id) => {
                      const iss = getCanonicalIssue(id);
                      if (iss) setSelectedIssue(iss);
                    }}
                    compact={true}
                  />

                  {/* Friction Landscape Mini Widget */}
                  <div className="card p-6 flex flex-col gap-4 border border-[#22281F]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#22C55E]" />
                        <h3 className="font-mono text-xs uppercase tracking-wider text-[#94A3B8] font-bold">
                          Friction Landscape
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('friction-map')}
                        className="text-xs font-mono text-[#22C55E] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                      >
                        <span>Full Map</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {(Object.keys(CATEGORY_LABELS) as Category[]).slice(0, 5).map((cat) => {
                        const count = issues.filter((i) => i.category === cat).length;
                        return (
                          <div
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              const el = document.getElementById('feed-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                              selectedCategory === cat
                                ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/40 font-medium'
                                : 'bg-[#111622] text-[#94A3B8] hover:text-white border border-[#27354A]'
                            }`}
                          >
                            <span className="truncate">{CATEGORY_LABELS[cat]}</span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* QuietFray Engine Telemetry Widget */}
                  <div className="card p-6 flex flex-col gap-3 bg-gradient-to-b from-[#131612] to-[#0D100C] border border-[#22281F]">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#22C55E]" />
                      <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                        QuietFray v0.1 Engine
                      </h3>
                    </div>

                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Pure-mathematics marked Hawkes point process (\(\nu = 0.5049\)) prioritizes chronic community suffering over transient viral outrage.
                    </p>

                    <div className="pt-2 border-t border-[#22281F] flex items-center justify-between text-xs font-mono text-[#64748B]">
                      <span>SPRT Hypotheses: H1 vs H0</span>
                      <button
                        onClick={() => setActiveTab('observatory')}
                        className="text-[#22C55E] hover:underline bg-transparent border-0 p-0 cursor-pointer font-bold"
                      >
                        Observatory &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Leaderboards Tab */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            onSelectUser={handleNavigateToProfile}
            onOpenNewsletter={() => setIsNewsletterModalOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Community Guidelines Tab */}
        {activeTab === 'guidelines' && <GuidelinesView />}

        {/* Top 10 View */}
        {activeTab === 'top10' && (
          <div className="py-14 sm:py-20">
            <TopTen
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onVote={handleVote}
              userVotes={userVotes}
            />
          </div>
        )}

        {/* Friction Map View */}
        {activeTab === 'friction-map' && (
          <div className="py-14 sm:py-20">
            <FrictionMap
              issues={issues}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveTab('explore');
              }}
            />
          </div>
        )}

        {/* Observatory View */}
        {activeTab === 'observatory' && (
          <ObservatoryView
            issues={issues}
            onSelectIssue={setSelectedIssue}
          />
        )}

        {/* How It Works View */}
        {activeTab === 'how-it-works' && (
          <HowItWorksView
            onOpenReport={() => setIsReportModalOpen(true)}
            onExplore={() => setActiveTab('explore')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenNewsletter={() => setIsNewsletterModalOpen(true)}
        onOpenPolicy={(tab) => setPolicyTab(tab)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Modals */}
      <ReportProblemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportSubmitted={(canonicalId) => {
          refreshData();
          if (canonicalId) {
            const match = getCanonicalIssue(canonicalId);
            if (match) setSelectedIssue(match);
          }
        }}
      />

      <ProblemEvidenceModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onVote={handleVote}
        userVote={selectedIssue ? userVotes[selectedIssue.id] : null}
        onRefresh={refreshData}
        onSelectUser={handleNavigateToProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          handleNavigateToProfile(user.username);
        }}
      />

      <NewsletterModal
        isOpen={isNewsletterModalOpen}
        onClose={() => setIsNewsletterModalOpen(false)}
      />

      <PolicyModal
        isOpen={policyTab !== null}
        onClose={() => setPolicyTab(null)}
        initialTab={policyTab || 'privacy'}
      />
    </div>
  );
}

export default App;
