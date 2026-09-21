import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, LogOut, Terminal, Activity } from 'lucide-react';

export default function AdminNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Admin Console Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">
                  RescueBites
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                  Ops Console
                </span>
              </div>
              <span className="block text-[10px] text-stone-400 -mt-0.5">
                Marketplace Compliance & Supervision System
              </span>
            </div>
          </div>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800/80 border border-stone-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-stone-300 font-medium text-[11px]">System Health: Normal</span>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="block text-xs font-bold text-stone-200">
                    {user.fullName || 'Ops Administrator'}
                  </span>
                  <span className="block text-[10px] text-purple-400 font-mono">
                    {user.email}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-stone-400 hover:text-rose-400 rounded-xl hover:bg-stone-800 transition-colors"
                  title="Logout Administrator Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
