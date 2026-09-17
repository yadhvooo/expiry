import React, { useState, useEffect } from 'react';
import api from '../services/api';
import QRCodeModal from '../components/QRCodeModal';
import {
  ClipboardList,
  Store,
  Clock,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Package,
  AlertCircle
} from 'lucide-react';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQrOrder, setSelectedQrOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await api.getCustomerOrders();
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError('Unable to load your orders.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Confirmed</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">Ready for Pickup ⚡</span>;
      case 'PICKED_UP':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Picked Up (Completed)</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Cancelled</span>;
      case 'REFUNDED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Refunded</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800">{status}</span>;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" />
            <span>My Food Rescue Pickups</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Track your pickup status, retrieve your 4-digit code, and display your QR code
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="p-2 text-stone-400 hover:text-emerald-700 transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 bg-white rounded-3xl border border-stone-200 animate-pulse space-y-3">
              <div className="h-4 bg-stone-200 rounded w-1/4" />
              <div className="h-6 bg-stone-200 rounded w-1/2" />
              <div className="h-16 bg-stone-100 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-stone-800 text-base">No orders yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You haven't rescued any surplus food yet. Explore fresh daily deals and make your first eco-friendly pickup!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm space-y-4"
            >
              {/* Top Order Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 text-base">
                      ORDER #{order.order_number}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{order.provider_name}</strong>
                    <span className="hidden sm:inline">• {order.provider_address}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-stone-900">
                    ₹{order.total_amount}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-stone-50"
                  >
                    <div className="font-semibold text-stone-800">
                      {item.product_name} <span className="text-stone-400">× {item.quantity}</span>
                    </div>
                    <div className="font-bold text-stone-900">₹{item.subtotal}</div>
                  </div>
                ))}
              </div>

              {/* Pickup Verification Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Counter Pickup Code:
                  </div>
                  <div className="text-2xl font-black tracking-widest text-emerald-950 font-mono">
                    {order.pickup_code}
                  </div>
                  <div className="text-xs text-stone-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Pickup Window: {order.pickup_start_time || '10:00'} - {order.pickup_end_time || '21:00'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedQrOrder(order)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Show QR Code</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQrOrder && (
        <QRCodeModal
          order={selectedQrOrder}
          onClose={() => setSelectedQrOrder(null)}
        />
      )}
    </div>
  );
}
