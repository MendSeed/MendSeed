// ============================================================================
// MENDSEED AUTHENTICATION MODAL (BETTER AUTH & OAUTH READY)
// Google & GitHub sign-in for solvers and problem scopers
// Styled with UI/UX Pro Max Dark Mode Design System
// ============================================================================

import React, { useState } from 'react';
import { RESERVED_USERNAMES, signInWithOAuth } from '../lib/auth';
import type { UserProfile } from '../types';
import { AlertCircle, Shield, Sparkles, X } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
  defaultMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setError(null);
    setIsLoading(true);

    try {
      let finalUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!finalUsername) {
        finalUsername = provider === 'github' ? 'dev_solver' : 'builder_user';
      }

      if (RESERVED_USERNAMES.has(finalUsername)) {
        throw new Error(`Username '@${finalUsername}' is reserved by the platform.`);
      }

      const user = await signInWithOAuth(provider, finalUsername, name.trim() || undefined);
      setIsLoading(false);
      if (onSuccess) onSuccess(user);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#111622] border border-[#27354A] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#F8FAFC]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Join as Solver</h2>
            <p className="text-xs text-[#94A3B8]">
              Claim problems, submit verified solutions & earn rankings.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-[#1B2336] border border-[#334155]/60 text-xs text-[#94A3B8] leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block font-medium">Guest Reporting Remains Free:</strong>
            Anyone can log friction reports without an account. Authenticated solver accounts are only required to claim, build, and verify solutions.
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Custom Username Input */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
              Choose Solver Handle <span className="text-[#38BDF8]">(Your public profile URL)</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#94A3B8] font-mono text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full pl-8 pr-4 py-2.5 bg-[#0B0F19] border border-[#334155] rounded-xl text-sm font-mono text-white placeholder-[#64748B] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
              />
            </div>
            <p className="text-[11px] text-[#64748B] mt-1 font-mono">
              Profile URL: https://mendseed.org/{username.trim() || 'username'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivers"
              className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#334155] rounded-xl text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
            />
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthSignIn('github')}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#24292F] hover:bg-[#2F363D] border border-[#444D56] text-white text-sm font-medium flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <GithubIcon className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </button>

          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white text-[#0F172A] hover:bg-gray-100 font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-[#64748B] mt-5">
          By signing in, you agree to MendSeed's Community Guidelines and Verification Protocol.
        </p>
      </div>
    </div>
  );
};
