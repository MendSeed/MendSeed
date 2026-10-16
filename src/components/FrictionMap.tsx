// ============================================================================
// FRICTION MAP — CATEGORY EXPLORER
// Aligned with Section 9.2 E of Master Product Brief
// Dual perspectives: Distribution vs Momentum, with accessible list alternative
// ============================================================================

import React, { useState } from 'react';
import { ArrowRight, BarChart2, Compass, Layers, List, TrendingUp } from 'lucide-react';
import type { CanonicalIssue, Category } from '../types';
import { CATEGORY_LABELS } from '../types';

interface FrictionMapProps {
  issues: CanonicalIssue[];
  onSelectCategory: (cat: Category) => void;
}

export const FrictionMap: React.FC<FrictionMapProps> = ({ issues, onSelectCategory }) => {
  const [viewPerspective, setViewPerspective] = useState<'distribution' | 'momentum'>('distribution');
  const [showListOnly, setShowListOnly] = useState(false);

  // Group by categories
  const allCategories = Object.keys(CATEGORY_LABELS) as Category[];

  const categoryStats = allCategories.map((cat) => {
    const matching = issues.filter((iss) => iss.category === cat);
    const issueCount = matching.length;
    const reportCount = matching.reduce((sum, iss) => sum + iss.reportCount, 0);
    const supportVotes = matching.reduce((sum, iss) => sum + iss.supportCount, 0);

    // Momentum heuristic: activity in the last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentActivityCount = matching.filter(
      (iss) => new Date(iss.lastActivityAt).getTime() > thirtyDaysAgo
    ).length;

    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      issueCount,
      reportCount,
      supportVotes,
      recentActivityCount,
      intensityPercent: Math.min(100, Math.max(10, (reportCount / 40) * 100)),
    };
  });

  // Sort by active perspective
  const sortedStats = [...categoryStats].sort((a, b) => {
    if (viewPerspective === 'momentum') {
      return b.recentActivityCount - a.recentActivityCount || b.reportCount - a.reportCount;
    }
    return b.reportCount - a.reportCount || b.issueCount - a.issueCount;
  });

  return (
    <section className="py-12 border-b border-[var(--color-border)] bg-[var(--color-ink)]">
      <div className="page-container">
        {/* Header and Perspective Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="section-subheader flex items-center gap-1.5 mb-1">
              <Compass className="w-3.5 h-3.5 text-[var(--color-lime)]" />
              <span>Category Landscape</span>
            </div>
            <h2 className="section-header text-[var(--color-paper)]">Friction Map</h2>
            <p className="text-sm text-[var(--color-gray)] max-w-xl mt-1">
              Cross-category distribution of reported obstacles, symptoms, and active problem patterns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode: Matrix vs List */}
            <button
              onClick={() => setShowListOnly(!showListOnly)}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              title="Toggle accessible list format"
            >
              <List className="w-3.5 h-3.5" />
              <span>{showListOnly ? 'Visual Matrix' : 'List View'}</span>
            </button>

            {/* Perspective Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
              <button
                onClick={() => setViewPerspective('distribution')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-0 ${
                  viewPerspective === 'distribution'
                    ? 'bg-[var(--color-lime)] text-[var(--color-ink)] font-bold'
                    : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Total Volume</span>
              </button>
              <button
                onClick={() => setViewPerspective('momentum')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-0 ${
                  viewPerspective === 'momentum'
                    ? 'bg-[var(--color-lime)] text-[var(--color-ink)] font-bold'
                    : 'bg-transparent text-[var(--color-gray)] hover:text-[var(--color-paper)]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>30-Day Momentum</span>
              </button>
            </div>
          </div>
        </div>

        {/* Matrix Visualization or Accessible List */}
        {showListOnly ? (
          <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {sortedStats.map((item) => (
              <div
                key={item.category}
                onClick={() => onSelectCategory(item.category)}
                className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-raised)] cursor-pointer transition-colors"
              >
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-paper)]">{item.label}</h4>
                  <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-gray)] mt-1">
                    <span>{item.issueCount} Problems</span>
                    <span>{item.reportCount} Reports</span>
                    <span>{item.supportVotes} Votes</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-gray)]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedStats.map((item) => {
              const isHigh = item.reportCount > 15;
              return (
                <div
                  key={item.category}
                  onClick={() => onSelectCategory(item.category)}
                  className="card card-hover cursor-pointer p-4 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-lime)] opacity-60 transition-opacity group-hover:opacity-100"
                    style={{ width: `${item.intensityPercent}%` }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="badge badge-lime text-[10px]">{item.category.replace('_', ' ')}</span>
                      {isHigh && (
                        <span className="font-mono text-[10px] uppercase text-[var(--color-lime)] tracking-widest font-bold">
                          Active Hotspot
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-paper)] group-hover:text-[var(--color-lime)] transition-colors mb-2">
                      {item.label}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-[var(--color-gray-light)]">
                      <Layers className="w-3.5 h-3.5 text-[var(--color-gray)]" />
                      <span>{item.issueCount} issues</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--color-lime)] font-bold">
                      <span>{item.reportCount} reports</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
