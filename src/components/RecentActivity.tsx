// ============================================================================
// RECENT ACTIVITY FEED
// Traceable public event stream (Section 9.2 C of Master Product Brief)
// Supports full section and compact sidebar modes
// ============================================================================

import React from 'react';
import { Activity, CheckCircle, Clock, FileText, Hammer, RefreshCw } from 'lucide-react';
import type { IssueEvent } from '../types';

interface RecentActivityProps {
  events: IssueEvent[];
  onSelectIssueId?: (issueId: string) => void;
  compact?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  events,
  onSelectIssueId,
  compact = false,
}) => {
  const getEventIcon = (type: IssueEvent['type']) => {
    switch (type) {
      case 'MARKED_SOLVED':
        return <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />;
      case 'SOLUTION_SUBMITTED':
      case 'CLAIM_CREATED':
        return <Hammer className="w-3.5 h-3.5 text-[var(--color-info)]" />;
      case 'REOPENED':
        return <RefreshCw className="w-3.5 h-3.5 text-[var(--color-danger)]" />;
      case 'REPORT_ASSOCIATED':
      case 'PUBLISHED':
      default:
        return <FileText className="w-3.5 h-3.5 text-[var(--color-lime)]" />;
    }
  };

  if (compact) {
    return (
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-lime)] animate-pulse" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-gray-light)] font-bold">
              Live Audit Stream
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[var(--color-gray-dark)]">Neon Sync</span>
        </div>

        {events.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-[var(--color-gray)]">
            No public events registered yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {events.slice(0, 5).map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectIssueId && onSelectIssueId(evt.canonicalIssueId)}
                className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[var(--color-lime)]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getEventIcon(evt.type)}
                    <span className="text-[10px] font-mono text-[var(--color-gray)] truncate">
                      {evt.actorDescription}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-gray-dark)] shrink-0">
                    {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-paper)] group-hover:text-[var(--color-lime)] transition-colors line-clamp-2 leading-relaxed">
                  {evt.details}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full-width mode
  return (
    <section className="py-6 border-b border-[var(--color-border)] bg-[var(--color-ink)]">
      <div className="page-container">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[var(--color-lime)]" />
          <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--color-gray)] font-bold">
            Live Public Activity Stream
          </h2>
        </div>

        {events.length === 0 ? (
          <div className="empty-state py-8">
            <Activity className="w-8 h-8 empty-state-icon mx-auto" />
            <p className="text-sm font-mono text-[var(--color-gray)]">No recent activity logged yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.slice(0, 6).map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectIssueId && onSelectIssueId(evt.canonicalIssueId)}
                className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] flex items-start gap-3 hover:border-[var(--color-lime)] transition-colors cursor-pointer group"
              >
                <div className="p-1.5 bg-[var(--color-ink)] rounded-[var(--radius-sm)] border border-[var(--color-border)] shrink-0 mt-0.5">
                  {getEventIcon(evt.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--color-gray)] truncate">
                      {evt.actorDescription}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-gray-dark)] flex items-center gap-0.5 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(evt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-paper)] group-hover:text-[var(--color-lime)] transition-colors line-clamp-2 leading-snug">
                    {evt.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
