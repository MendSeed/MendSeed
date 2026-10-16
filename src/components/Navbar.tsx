// ============================================================================
// MENDSEED NAVBAR
// Editorial-brutalist navigation with mobile responsiveness
// ============================================================================

import React, { useState } from 'react';
import { Menu, Plus, Search, X } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReport: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReport,
  searchQuery,
  setSearchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems = [
    { id: 'explore', label: 'Explore' },
    { id: 'top10', label: 'Top 10' },
    { id: 'friction-map', label: 'Friction Map' },
    { id: 'observatory', label: 'Observatory' },
    { id: 'how-it-works', label: 'How It Works' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-ink)] border-b border-[var(--color-border)]">
      <div className="page-container flex items-center justify-between h-16 gap-4">
        {/* Brand Wordmark & Typographic Mark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-2.5 text-left bg-transparent border-0 cursor-pointer p-0"
          >
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-ink-light)] border border-[var(--color-border)] flex items-center justify-center p-1.5 shadow-sm">
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
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tight text-[var(--color-paper)] leading-none">
                MEND<span className="text-[var(--color-lime)]">SEED</span>
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-gray)] leading-tight mt-0.5">
                Problem Discovery
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] font-display text-sm tracking-wide transition-colors cursor-pointer border-0 bg-transparent ${
                activeTab === item.id
                  ? 'text-[var(--color-lime)] font-semibold bg-[var(--color-surface)]'
                  : 'text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Search & Report Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Input */}
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-[var(--color-gray)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[var(--color-surface)] text-[var(--color-paper)] text-xs font-mono pl-9 pr-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-lime)] w-36 lg:w-48 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-gray)] hover:text-[var(--color-paper)] bg-transparent border-0 cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="sm:hidden p-2 text-[var(--color-gray)] hover:text-[var(--color-paper)] bg-transparent border border-[var(--color-border)] rounded-[var(--radius-sm)] cursor-pointer"
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Primary Action: Report a Problem */}
          <button
            onClick={onOpenReport}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Report a problem</span>
            <span className="xs:hidden">Report</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--color-gray)] hover:text-[var(--color-paper)] bg-transparent border border-[var(--color-border)] rounded-[var(--radius-sm)] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search expandable */}
      {searchOpen && (
        <div className="sm:hidden px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--color-gray)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problems by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-mono pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-lime)]"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-ink)] px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-[var(--radius-sm)] font-display text-base transition-colors border-0 bg-transparent ${
                activeTab === item.id
                  ? 'text-[var(--color-lime)] font-semibold bg-[var(--color-surface)]'
                  : 'text-[var(--color-gray)] hover:text-[var(--color-paper)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
