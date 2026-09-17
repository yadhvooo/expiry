import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import NotificationDropdown from './NotificationDropdown';
import {
  ShoppingBag,
  MapPin,
  Search,
  Store,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ currentView, setView, searchTerm, setSearchTerm }) {
  const { user, logout, isCustomer, isProvider, isAdmin } = useAuth();
  const { totalItemsCount, setIsDrawerOpen } = useCart();
  const { location, setIsModalOpen } = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView(isProvider ? 'provider-dashboard' : isAdmin ? 'admin-dashboard' : 'home')}
              className="flex items-center gap-2 text-left group"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                  RescueBites
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-600 -mt-1">
                  Surplus Marketplace
                </span>
              </div>
            </button>

            {/* Location selector trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors ml-2"
              title="Change your pickup location"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="max-w-[130px] truncate">{location.label || location.name}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>
          </div>

          {/* Search Bar (Customer views) */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search paneer, bread, cake, yogurt, snacks..."
                value={searchTerm || ''}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (currentView !== 'home') setView('home');
                }}
                className="w-full bg-stone-100/90 hover:bg-stone-100 focus:bg-white text-xs sm:text-sm pl-10 pr-4 py-2 rounded-full border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Actions & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switchers based on role */}
            {isProvider && (
              <div className="hidden lg:flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setView('provider-dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    currentView === 'provider-dashboard' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setView('provider-products')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    currentView === 'provider-products' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Catalog
                </button>
                <button
                  onClick={() => setView('provider-orders')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    currentView === 'provider-orders' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Orders & Pickup
                </button>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={() => setView('admin-dashboard')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  currentView === 'admin-dashboard'
                    ? 'bg-purple-50 text-purple-700 border-purple-300'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                Admin Panel
              </button>
            )}

            {/* Customer Orders link */}
            <button
              onClick={() => setView('customer-orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'customer-orders'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="My Orders & Pickup QR Codes"
            >
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">My Pickups</span>
            </button>

            {/* Notification Bell */}
            <NotificationDropdown />

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors border border-emerald-200 shadow-sm"
              title="Open Cart"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow-md animate-bounce">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* User Profile / Logout */}
            {user ? (
              <button
                onClick={logout}
                className="p-2 text-stone-400 hover:text-rose-600 rounded-full hover:bg-stone-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
