import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import {
  Store,
  LayoutDashboard,
  Package,
  QrCode,
  LogOut,
  User,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function StoreNavbar({ currentView, setView }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Store Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">
                  RescueBites
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-400 -mt-1">
                  Store Manager Portal
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links for Authenticated Store Managers */}
          {user && (
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                onClick={() => setView('products')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'products'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Inventory Catalog</span>
              </button>

              <button
                onClick={() => setView('orders')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'orders'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Fulfillment & Counter Pickup</span>
              </button>
            </nav>
          )}

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationDropdown />
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">
                    {user.fullName || user.businessName || 'Store Manager'}
                  </span>
                  <span className="text-[10px] text-amber-400 flex items-center justify-end gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3" /> FSSAI Verified
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-stone-400 hover:text-rose-400 rounded-full hover:bg-stone-800 transition-colors"
                  title="Logout Store Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-sm transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Store Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
