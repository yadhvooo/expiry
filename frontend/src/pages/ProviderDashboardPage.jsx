import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  TrendingUp,
  PackageCheck,
  Store,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Plus,
  QrCode
} from 'lucide-react';

export default function ProviderDashboardPage({ setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const res = await api.getProviderDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load provider dashboard', err);
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-40 bg-stone-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      </div>
    );
  }

  const { provider, metrics } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Provider Portal
            </span>
            <span className="text-xs text-stone-400">Status: <strong className="text-emerald-400 uppercase">{provider.status}</strong></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {provider.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300">
            Monitor surplus inventory, prevent food waste, and verify customer pickups
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setView('provider-products')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Listing</span>
          </button>
          <button
            onClick={() => setView('provider-orders')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur transition-all"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Verify Pickups</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Rescue Sales */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Today's Rescue Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            ₹{metrics.todayRescueSales}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            Direct recovered revenue
          </p>
        </div>

        {/* Products Rescued */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Products Rescued</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {metrics.productsRescued} <span className="text-sm font-normal text-stone-400">items</span>
          </div>
          <p className="text-[11px] text-stone-500">
            Saved from ending in waste
          </p>
        </div>

        {/* Active Listings */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Active Listings</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {metrics.activeListings}
          </div>
          <p className="text-[11px] text-stone-500">
            {metrics.approachingExpiry} approaching expiry
          </p>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Orders Pending Pickup</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {metrics.pendingOrders}
          </div>
          <p className="text-[11px] text-purple-700 font-semibold">
            {metrics.completedOrders} completed so far
          </p>
        </div>
      </div>

      {/* Expiry Alert Card */}
      {metrics.urgentExpiry > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-950 text-sm sm:text-base">
                {metrics.urgentExpiry} Products Ending in 1–2 Days!
              </h3>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                Automatic shelf-life discounting is active. Review listings in your catalog to ensure prices are attractive for end-of-day customer rescues before expiration.
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('provider-products')}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shrink-0 transition-colors"
          >
            Review Catalog
          </button>
        </div>
      )}

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setView('provider-products')}
          className="p-6 rounded-3xl bg-white border border-stone-200 hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Manage Surplus Catalog</h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Create new surplus food listings with auto-calculated discounts, update stock, and modify expiry dates.
          </p>
        </div>

        <div
          onClick={() => setView('provider-orders')}
          className="p-6 rounded-3xl bg-white border border-stone-200 hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-blue-600" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Fulfill Orders & Verify Pickups</h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Scan QR codes or enter customer 4-digit pickup codes to verify store collections with automated double-claim prevention.
          </p>
        </div>
      </div>
    </div>
  );
}
