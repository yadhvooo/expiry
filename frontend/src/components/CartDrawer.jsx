import React from 'react';
import { useCart } from '../context/CartContext';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Store,
  ShieldAlert,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function CartDrawer({ onCheckout }) {
  const {
    items,
    currentProvider,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    platformFee,
    total,
    isDrawerOpen,
    setIsDrawerOpen,
    providerConflict,
    resolveProviderConflict
  } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Your Rescue Cart</h3>
                {currentProvider && (
                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    <Store className="w-3 h-3 text-emerald-600" />
                    Pickup from: <strong className="text-stone-700">{currentProvider.name}</strong>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Provider Conflict Warning Alert */}
          {providerConflict && (
            <div className="p-4 bg-amber-50 border-b border-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold text-amber-950 mb-1">Different Store Detected!</p>
                  <p className="leading-relaxed">
                    Your cart contains items from <strong>{providerConflict.currentProviderName}</strong>.
                    Products from different stores cannot be combined in a single pickup order.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => resolveProviderConflict(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors"
                    >
                      Clear & Switch Store
                    </button>
                    <button
                      onClick={() => resolveProviderConflict(false)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-xs hover:bg-amber-100 transition-colors"
                    >
                      Keep Current Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-stone-800 text-sm">Your cart is empty</h4>
                <p className="text-xs text-stone-500 max-w-xs mt-1">
                  Browse delicious discounted surplus foods near you to rescue food and save money!
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-stone-200 flex items-center gap-3 bg-white"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-stone-900 text-xs truncate">
                      {item.name}
                    </h4>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Best before: {item.best_before_date}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                        ₹{Math.round(item.discounted_price)}
                      </span>
                      <span className="text-[10px] text-stone-400 line-through">
                        ₹{Math.round(item.original_price)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-sm"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Bill Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-semibold text-stone-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    Platform Rescue Contribution
                  </span>
                  <span className="font-semibold text-stone-900">₹{platformFee}</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold text-stone-900">
                  <span>Total Amount</span>
                  <span className="text-base text-emerald-700 font-extrabold">₹{total}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-2.5 rounded-2xl bg-white border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-semibold transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onCheckout();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
