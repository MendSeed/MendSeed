// ============================================================================
// MENDSEED MASTER APPLICATION
// The public problem-discovery and solution-development platform
// Realtime Synced with Neon PostgreSQL & pgvector (Zero Dummy Data)
// Spacious Layout with Generous Gaps & Breathing Room
// ============================================================================

import React, { useEffect, useState } from 'react';
import type { CanonicalIssue, Category, IssueEvent, IssueStatus } from './types';
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

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<'privacy' | 'moderation' | 'retention' | 'security' | 'conduct' | null>(null);

  // Voter state
  const [voterHash, setVoterHash] = useState<string>('');
  const [userVotes, setUserVotes] = useState<Record<string, 'UP' | 'DOWN' | null>>({});

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
    <div className="min-h-screen flex flex-col bg-[var(--color-ink)] text-[var(--color-paper)]">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={() => setIsReportModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (activeTab !== 'explore') setActiveTab('explore');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
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

            {/* Dashboard 2-Column Section with Spacious Gap */}
            <div id="feed-section" className="page-container py-16 sm:py-20 lg:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
                {/* Primary Column: Problem Stream & Controls (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-10">
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

                {/* Secondary Column: Live Stream & Architecture Widgets (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-8">
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
                  <div className="card p-7 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Compass className="w-4 h-4 text-[var(--color-lime)]" />
                        <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-gray-light)] font-bold">
                          Friction Landscape
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('friction-map')}
                        className="text-xs font-mono text-[var(--color-lime)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                      >
                        <span>Full Map</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--color-gray)] leading-relaxed">
                      Cross-category distribution of obstacles verified by the community.
                    </p>

                    <div className="flex flex-col gap-2.5">
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
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-md)] text-xs sm:text-sm cursor-pointer transition-all ${
                              selectedCategory === cat
                                ? 'bg-[var(--color-lime)]/15 text-[var(--color-lime)] border border-[var(--color-lime)]/40 font-medium'
                                : 'bg-[var(--color-surface)] text-[var(--color-gray-light)] hover:text-white border border-[var(--color-border)]'
                            }`}
                          >
                            <span className="truncate">{CATEGORY_LABELS[cat]}</span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/40">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* QuietFray Model Telemetry Widget */}
                  <div className="card p-7 flex flex-col gap-4 bg-gradient-to-b from-[#131612] to-[#0D100C]">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-[var(--color-lime)]" />
                      <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-gray-light)] font-bold">
                        QuietFray v0.1 Engine
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--color-gray)] leading-relaxed">
                      Temporal point-process scoring with dual-timescale Hawkes excitation (subcritical mass $\nu = 0.5049$) protects genuine problems from viral manipulation.
                    </p>

                    <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-[var(--color-gray-dark)]">
                      <span>Verified Closure: Sec 8.5</span>
                      <button
                        onClick={() => setActiveTab('observatory')}
                        className="text-[var(--color-lime)] hover:underline bg-transparent border-0 p-0 cursor-pointer font-bold"
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

        {activeTab === 'top10' && (
          <div className="py-16 sm:py-24">
            <TopTen
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onVote={handleVote}
              userVotes={userVotes}
            />
          </div>
        )}

        {activeTab === 'friction-map' && (
          <div className="py-16 sm:py-24">
            <FrictionMap
              issues={issues}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveTab('explore');
              }}
            />
          </div>
        )}

        {activeTab === 'observatory' && (
          <ObservatoryView
            issues={issues}
            onSelectIssue={setSelectedIssue}
          />
        )}

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
