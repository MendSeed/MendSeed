// ============================================================================
// MENDSEED NAVBAR & SOLVER REPUTATION HEADER
// Styled with UI/UX Pro Max Dark Mode Design System
// Seamless OAuth / Better Auth Profile Status & Global Navigation
// ============================================================================

import React, { useState } from 'react';
import type { UserProfile } from '../types';
import {
  Flame,
  LogOut,
  Menu,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  User,
  X,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReport: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSelectUser?: (username: string) => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReport,
  searchQuery,
  setSearchQuery,
  currentUser,
  onOpenAuth,
  onSelectUser,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'explore', label: 'Explore' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'friction-map', label: 'Friction Map' },
    { id: 'observatory', label: 'Observatory' },
    { id: 'guidelines', label: 'Guidelines' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#080907]/90 backdrop-blur-xl border-b border-[#22281F]">
      <div className="page-container flex items-center justify-between h-20 gap-4 sm:gap-6">
        {/* Brand Wordmark & Typographic Mark */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-3 text-left bg-transparent border-0 cursor-pointer p-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#111622] border border-[#27354A] flex items-center justify-center p-2 shadow-sm group-hover:border-[#22C55E]/50 transition-all">
              <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                <path
                  d="M8 24V12l4-4 4 8 4-8 4 4v12"
                  stroke="#22C55E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="10" r="2.5" fill="#22C55E" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-tight text-white leading-none">
                MEND<span className="text-[#22C55E]">SEED</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] leading-tight mt-1">
                Problem Scoping & Solvers
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-2 rounded-xl font-display text-sm tracking-wide transition-all cursor-pointer border-0 bg-transparent ${
                activeTab === item.id
                  ? 'text-[#22C55E] font-semibold bg-[#111622] border border-[#27354A] shadow-sm'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#111622]/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Search & Report Actions & Solver Profile */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          {/* Quick Search Input */}
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111622] text-[#F8FAFC] text-xs font-mono pl-10 pr-4 py-2 rounded-xl border border-[#27354A] focus:outline-none focus:border-[#22C55E] w-36 lg:w-56 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white bg-transparent border-0 cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Profile / Auth State Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[#111622] border border-[#27354A] hover:border-[#22C55E]/50 transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover border border-[#22C55E]"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-none">
                    @{currentUser.username}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[#94A3B8]">
                    <span className="text-[#F59E0B] flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-[#F59E0B]" />
                      {currentUser.streakDays}d
                    </span>
                    <span className="text-[#A855F7] flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      {currentUser.points}
                    </span>
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#111622] border border-[#27354A] shadow-2xl py-2 z-50 text-xs text-[#F8FAFC] animate-fade-in">
                  <div className="px-3.5 py-2 border-b border-[#27354A] mb-1">
                    <p className="font-bold text-white">{currentUser.name}</p>
                    <p className="font-mono text-[#38BDF8]">@{currentUser.username}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onSelectUser) onSelectUser(currentUser.username);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#1B2336] flex items-center gap-2.5 text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#22C55E]" />
                    <span>My Solver Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setActiveTab('leaderboard');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#1B2336] flex items-center gap-2.5 text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#A855F7]" />
                    <span>View Rankings</span>
                  </button>

                  <div className="border-t border-[#27354A] my-1"></div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onSignOut) onSignOut();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#EF4444]/10 text-[#EF4444] flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 rounded-xl bg-[#111622] hover:bg-[#1B2336] border border-[#27354A] hover:border-[#38BDF8] text-xs font-mono text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#38BDF8]" />
              <span className="hidden sm:inline">Sign In / Join</span>
              <span className="sm:hidden">Join</span>
            </button>
          )}

          {/* Primary Action: Log Problem (Guest or User) */}
          <button
            onClick={onOpenReport}
            className="btn btn-primary btn-sm flex items-center gap-1.5 px-3.5 py-2 text-xs tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Log Problem</span>
            <span className="xs:hidden">Log</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#94A3B8] hover:text-white bg-transparent border border-[#27354A] rounded-xl cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#22281F] bg-[#0E131F] px-4 py-6 flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`text-left px-4 py-3 rounded-xl font-display text-sm transition-colors ${
                activeTab === item.id
                  ? 'text-[#22C55E] font-bold bg-[#111622] border border-[#27354A]'
                  : 'text-[#94A3B8] hover:text-white'
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
