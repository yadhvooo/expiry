import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage({ setView }) {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'provider') setView('provider-dashboard');
      else if (user.role === 'admin') setView('admin-dashboard');
      else setView('home');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-stone-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-stone-900">Sign In to RescueBites</h1>
          <p className="text-xs text-stone-500">Access your rescue pickups, store dashboard, or admin console</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="pt-4 border-t border-stone-100 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 text-center">
            Or Click to Sign In with Demo Account
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={async () => {
                await switchDemoRole('customer');
                setView('home');
              }}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={async () => {
                await switchDemoRole('provider');
                setView('provider-dashboard');
              }}
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors"
            >
              Provider
            </button>
            <button
              type="button"
              onClick={async () => {
                await switchDemoRole('admin');
                setView('admin-dashboard');
              }}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-stone-500">
          Don't have an account?{' '}
          <button
            onClick={() => setView('register')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
}
