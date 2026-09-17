import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import {
  X,
  CreditCard,
  Smartphone,
  Store,
  Clock,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Building2,
  AlertCircle
} from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, onOrderSuccess }) {
  const { user } = useAuth();
  const { items, currentProvider, subtotal, platformFee, total, clearCart } = useCart();

  const [customerName, setCustomerName] = useState(user?.fullName || 'Rahul Verma');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '9876543210');
  const [pickupSlot, setPickupSlot] = useState('16:00 - 18:00');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, CARD, NETBANKING
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleCompletePayment(e) {
    e.preventDefault();
    if (items.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const payload = {
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        customerName,
        customerPhone,
        pickupStartTime: pickupSlot.split(' - ')[0],
        pickupEndTime: pickupSlot.split(' - ')[1],
        paymentMethod
      };

      const res = await api.createOrder(payload);
      clearCart();
      onClose();
      if (onOrderSuccess) {
        onOrderSuccess(res.order);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to complete order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Fast Checkout</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900">Confirm Food Rescue Pickup</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCompletePayment} className="space-y-4">
          {/* Provider Pickup Information */}
          {currentProvider && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                Pickup Location
              </div>
              <div className="text-sm font-bold text-stone-900">{currentProvider.name}</div>
              <div className="text-xs text-stone-500">{currentProvider.address}</div>
            </div>
          )}

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Pickup Window */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Today's Pickup Window
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:30'].map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setPickupSlot(slot)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                    pickupSlot === slot
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-stone-400" />
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector (Mock Razorpay / UPI flow) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Payment Method (Simulator)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">UPI / GPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">Debit/Credit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'NETBANKING'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">Netbanking</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              ⚡ Mock gateway ready for Razorpay/UPI integration. No real money is charged.
            </p>
          </div>

          {/* Order Summary breakdown */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Items Total ({items.length} items)</span>
              <span className="font-semibold text-stone-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Platform Contribution Fee</span>
              <span className="font-semibold text-stone-900">₹{platformFee}</span>
            </div>
            <div className="border-t border-stone-200 pt-1.5 flex justify-between font-bold text-sm text-stone-900">
              <span>Payable Now</span>
              <span className="text-emerald-700 font-extrabold text-base">₹{total}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || items.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Pay ₹{total} & Confirm Rescue Order</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
