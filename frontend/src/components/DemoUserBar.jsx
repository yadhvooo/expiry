import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Store, ShieldCheck, RefreshCw } from 'lucide-react';

export default function DemoUserBar() {
  const { user, switchDemoRole } = useAuth();

  return (
    <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-4 flex flex-wrap items-center justify-between gap-2 border-b border-stone-800">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-emerald-400 uppercase tracking-wide text-[10px]">Active Session:</span>
        <span className="text-white font-medium">
          {user ? `${user.fullName} (${user.role.toUpperCase()})` : 'Guest Browsing'}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-stone-400 text-[11px] hidden sm:inline">1-Click Role Switcher:</span>
        <button
          onClick={() => switchDemoRole('customer')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
            user?.role === 'customer'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
          title="Switch to Customer: Rahul Verma"
        >
          <User className="w-3 h-3 text-emerald-300" />
          <span>Customer</span>
        </button>

        <button
          onClick={() => switchDemoRole('provider')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
            user?.role === 'provider'
              ? 'bg-amber-600 text-white font-semibold'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
          title="Switch to Provider: The Daily Crumb Bakery"
        >
          <Store className="w-3 h-3 text-amber-300" />
          <span>Provider</span>
        </button>

        <button
          onClick={() => switchDemoRole('admin')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
            user?.role === 'admin'
              ? 'bg-purple-600 text-white font-semibold'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
          title="Switch to Admin: Marketplace Ops"
        >
          <ShieldCheck className="w-3 h-3 text-purple-300" />
          <span>Admin</span>
        </button>
      </div>
    </div>
  );
}
