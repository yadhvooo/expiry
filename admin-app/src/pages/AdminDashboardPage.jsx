import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShieldAlert,
  Users,
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  HeartHandshake,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, providers, users, products, orders
  const [analytics, setAnalytics] = useState(null);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      setMessage(null);

      if (activeTab === 'analytics') {
        const res = await api.getAdminAnalytics();
        setAnalytics(res.analytics);
      } else if (activeTab === 'providers') {
        const res = await api.getAdminProviders();
        setProviders(res.providers || []);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers();
        setUsers(res.users || []);
      } else if (activeTab === 'products') {
        const res = await api.getAdminProducts();
        setProducts(res.products || []);
      } else if (activeTab === 'orders') {
        const res = await api.getAdminOrders();
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProviderStatus(id, status) {
    try {
      await api.updateProviderStatus(id, status);
      setMessage(`Provider status updated to '${status}'.`);
      loadData();
    } catch (err) {
      alert('Failed to update provider status');
    }
  }

  async function handleUserStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(id, newStatus);
      setMessage(`User status changed to '${newStatus}'.`);
      loadData();
    } catch (err) {
      alert('Failed to update user status');
    }
  }

  async function handleProductToggle(id, currentActive) {
    try {
      await api.toggleProductStatus(id, !currentActive);
      setMessage(`Product listing visibility updated.`);
      loadData();
    } catch (err) {
      alert('Failed to update product visibility');
    }
  }

  async function handleRefundOrder(id) {
    if (!window.confirm('Are you sure you want to process a refund for this order?')) return;
    try {
      await api.refundOrder(id);
      setMessage(`Order refunded successfully.`);
      loadData();
    } catch (err) {
      alert('Failed to refund order');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Master Governance Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Marketplace Admin Panel
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-1">
            Supervise providers, approve food licenses, inspect orders, and track sustainability impact
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Refresh view"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-stone-200">
        {[
          { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp },
          { id: 'providers', label: 'Provider Approvals', icon: Store },
          { id: 'products', label: 'Product Moderation', icon: Package },
          { id: 'orders', label: 'Orders & Refunds', icon: ShoppingBag },
          { id: 'users', label: 'User Directory', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-1">
              <div className="text-xs text-stone-400 font-semibold">Gross Transaction Value (GTV)</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">₹{analytics.gtv}</div>
              <p className="text-[11px] text-emerald-600 font-semibold">Total processed GMV</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-1">
              <div className="text-xs text-stone-400 font-semibold">Platform Revenue (Fees)</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">₹{analytics.platformRevenue}</div>
              <p className="text-[11px] text-purple-600 font-semibold">Earned from rescue commissions</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-1">
              <div className="text-xs text-stone-400 font-semibold">Rescued Food Value Saved</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">₹{analytics.foodValueRescued}</div>
              <p className="text-[11px] text-blue-600 font-semibold">{analytics.productsRescued} food packages saved</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-1">
              <div className="text-xs text-stone-400 font-semibold">Active Network</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                {analytics.totalProviders} <span className="text-xs font-normal text-stone-400">Stores</span>
              </div>
              <p className="text-[11px] text-stone-500">{analytics.totalUsers} registered users • {analytics.totalListings} listings</p>
            </div>
          </div>

          {/* Leaderboards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
              <h3 className="font-bold text-stone-900 text-sm">Most Popular Categories Rescued</h3>
              <div className="space-y-2">
                {analytics.popularCategories?.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-xs">
                    <span className="font-semibold text-stone-800">
                      {idx + 1}. {cat.name}
                    </span>
                    <span className="font-bold text-emerald-700">{cat.sales_count} rescues</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
              <h3 className="font-bold text-stone-900 text-sm">Top Sustainable Food Providers</h3>
              <div className="space-y-2">
                {analytics.activeProviders?.map((prov, idx) => (
                  <div key={prov.business_name} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-xs">
                    <span className="font-semibold text-stone-800">
                      {idx + 1}. {prov.business_name}
                    </span>
                    <span className="font-bold text-purple-700">{prov.orders_count} orders completed</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROVIDERS & APPROVALS */}
      {activeTab === 'providers' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm">Provider Onboarding & License Verifications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Store Name & Owner</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">License / FSSAI</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70">
                    <td className="p-4">
                      <div className="font-bold text-stone-900 text-sm">{p.business_name}</div>
                      <div className="text-stone-400 text-[11px]">{p.owner_name} • {p.phone}</div>
                    </td>
                    <td className="p-4 font-semibold text-stone-700">{p.business_type}</td>
                    <td className="p-4 font-mono text-stone-700">{p.license_number || 'N/A'}</td>
                    <td className="p-4 max-w-xs truncate">{p.address}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status !== 'approved' && (
                          <button
                            onClick={() => handleProviderStatus(p.id, 'approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Approve
                          </button>
                        )}
                        {p.status !== 'rejected' && (
                          <button
                            onClick={() => handleProviderStatus(p.id, 'rejected')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                          >
                            Reject
                          </button>
                        )}
                        {p.status !== 'suspended' && (
                          <button
                            onClick={() => handleProviderStatus(p.id, 'suspended')}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS MODERATION */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-sm">Marketplace Product Listings Moderation</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Store</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Original / Discount Price</th>
                  <th className="p-4">Best Before</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70">
                    <td className="p-4 font-bold text-stone-900">{p.name}</td>
                    <td className="p-4 font-medium text-stone-600">{p.provider_name}</td>
                    <td className="p-4">{p.category_name}</td>
                    <td className="p-4">
                      <span className="font-extrabold text-stone-900">₹{p.discounted_price}</span>{' '}
                      <span className="line-through text-stone-400">₹{p.original_price}</span>
                    </td>
                    <td className="p-4 font-mono">{p.best_before_date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                        {p.is_active ? 'Live' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleProductToggle(p.id, p.is_active)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                          p.is_active
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {p.is_active ? 'Disable Listing' : 'Enable Listing'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS & REFUNDS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-sm">Platform Orders & Dispute Refunds</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Store</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50/70">
                    <td className="p-4">
                      <div className="font-bold text-stone-900">#{o.order_number}</div>
                      <div className="text-[11px] text-stone-400">{new Date(o.created_at).toLocaleString()}</div>
                    </td>
                    <td className="p-4 font-semibold text-stone-800">{o.provider_name}</td>
                    <td className="p-4">{o.customer_name || 'Customer'}</td>
                    <td className="p-4 font-bold text-stone-900">₹{o.total_amount}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {o.status !== 'REFUNDED' && o.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleRefundOrder(o.id)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs"
                        >
                          Issue Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-sm">Platform Users (Customers, Providers, Admins)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70">
                    <td className="p-4 font-bold text-stone-900">{u.full_name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4 font-semibold uppercase text-[11px] text-stone-700">{u.role}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleUserStatus(u.id, u.status)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend Account' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
