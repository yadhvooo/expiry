import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, Mail, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const { login, fillDemoAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setIsSubmitting(true);
    setError(null);
    try {
      await fillDemoAdmin();
    } catch (err) {
      setError(err.message || 'Failed to sign in with demo admin credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-12">
      <div className="bg-stone-900 rounded-3xl p-8 max-w-md w-full border border-stone-800 shadow-2xl space-y-6 text-stone-100">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Marketplace Ops Console</h1>
          <p className="text-xs text-stone-400">Restricted Access • Internal Operations & Compliance Staff Only</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Admin Identity (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Passphrase</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Authenticate Ops Session'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Admin Sign In */}
        <div className="pt-4 border-t border-stone-800 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 text-center">
            Quick Testing
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 text-purple-300 font-bold text-xs border border-purple-800/60 transition-colors flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-purple-400" />
            <span>Sign In as Demo Superadmin (Marketplace Ops)</span>
          </button>
        </div>

        <div className="text-center text-[11px] text-stone-500">
          All administrative actions and FSSAI audits are logged with IP & timestamp.
        </div>
      </div>
    </div>
  );
}
