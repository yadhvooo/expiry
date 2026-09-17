import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ClipboardCheck,
  CheckCircle,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Clock,
  User,
  RefreshCw,
  Search,
  Check,
  XCircle
} from 'lucide-react';

export default function ProviderOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Verification Form State
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await api.getProviderOrders();
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load provider orders', err);
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, status) {
    try {
      await api.updateOrderStatus(orderId, status);
      setSuccessMsg(`Order status updated to ${status}.`);
      loadOrders();
    } catch (err) {
      console.error('Status update error', err);
      alert(err.message || 'Failed to update status.');
    }
  }

  async function handleVerifyPickup(e) {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const res = await api.verifyPickup({
        code: verificationCode.trim()
      });

      setVerificationResult({
        success: true,
        message: res.message,
        order: res.order
      });
      setVerificationCode('');
      loadOrders();
    } catch (err) {
      console.error('Verification failed', err);
      setVerificationResult({
        success: false,
        message: err.message || 'Pickup verification failed.'
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            <span>Store Order Fulfillment & Pickup</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Accept incoming rescue orders, mark them ready, and verify customer collection codes
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

      {/* PICKUP VERIFICATION SYSTEM WIDGET */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold">Counter Pickup Verification System</h2>
          </div>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            When customer arrives, ask for their <strong>4-digit Pickup Code</strong> or QR code string to verify order authenticity, ensure payment is complete, and prevent double collection.
          </p>

          <form onSubmit={handleVerifyPickup} className="flex flex-wrap items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Enter 4-digit code (e.g. 7392)..."
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="flex-1 max-w-xs text-sm sm:text-base font-mono tracking-wider font-bold px-4 py-3 rounded-2xl bg-white text-stone-900 border-2 border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-400/30 shadow-md"
            />
            <button
              type="submit"
              disabled={isVerifying || !verificationCode.trim()}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-sm shadow-lg transition-all disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Complete Pickup'}
            </button>
          </form>

          {/* Verification Result Feedback Box */}
          {verificationResult && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 mt-3 animate-in fade-in duration-200 ${
                verificationResult.success
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-white'
                  : 'bg-rose-500/20 border-rose-400/50 text-rose-100'
              }`}
            >
              {verificationResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{verificationResult.message}</p>
                {verificationResult.order && (
                  <p className="text-xs text-emerald-200 mt-1">
                    Customer: {verificationResult.order.customerName} • Total: ₹{verificationResult.order.totalAmount}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table & Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-base">All Customer Orders ({orders.length})</h3>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-stone-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-400">
            No orders placed yet.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 text-sm sm:text-base">
                      ORDER #{order.order_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        order.status === 'PICKED_UP'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'READY_FOR_PICKUP'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'CONFIRMED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-stone-600 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      {order.customer_name || 'Customer'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      Pickup: {order.pickup_start_time} - {order.pickup_end_time}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-stone-500 pt-1">
                    {order.items?.map((it) => (
                      <span key={it.id} className="mr-2 inline-block font-medium text-stone-700">
                        {it.product_name} × {it.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-stone-400">Total Bill</div>
                    <div className="text-base font-extrabold text-stone-900">
                      ₹{order.total_amount}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700 font-bold">
                      Code: {order.pickup_code}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'READY_FOR_PICKUP')}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'READY_FOR_PICKUP' && (
                      <button
                        onClick={() => {
                          setVerificationCode(order.pickup_code);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        Verify Pickup
                      </button>
                    )}

                    {order.status !== 'PICKED_UP' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancel order"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
