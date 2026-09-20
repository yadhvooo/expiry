import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import UrgencyBadge from './UrgencyBadge';
import StoreMiniMap from './StoreMiniMap';
import {
  X,
  MapPin,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Store,
  Plus,
  Minus,
  ShoppingBag,
  Zap
} from 'lucide-react';


export default function ProductDetailModal({ product, onClose, onBuyNow }) {
  const { addItem } = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  if (!product) return null;

  const originalPrice = Math.round(product.original_price);
  const discountedPrice = Math.round(product.discounted_price);
  const discountPercent = Math.round(product.discount_percent);
  const savings = (originalPrice - discountedPrice) * selectedQuantity;

  function handleAddToCart() {
    addItem(product, selectedQuantity);
    onClose();
  }

  function handleBuyNowClick() {
    addItem(product, selectedQuantity);
    onClose();
    if (onBuyNow) onBuyNow();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-stone-500 hover:text-stone-900 rounded-full bg-white/80 backdrop-blur hover:bg-white shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {/* Large Image Header */}
          <div className="relative aspect-[16/9] w-full bg-stone-100">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <UrgencyBadge
                status={product.expiry_status}
                badge={product.expiry_badge}
                daysRemaining={product.days_remaining}
              />
            </div>
            <div className="absolute bottom-3 right-4 bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full text-sm shadow-lg">
              {discountPercent}% OFF
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Title & Provider */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">
                <span>{product.category_name}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-stone-500 font-medium">
                  <Store className="w-3.5 h-3.5" />
                  {product.provider_name}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {product.name}
              </h2>
            </div>

            {/* MANDATORY FOOD SAFETY WARNING BANNER */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <strong className="font-bold block mb-0.5 text-amber-950">Food Safety Notice:</strong>
                Please check the best-before/expiry information before purchasing. All items on RescueBites are verified quality surplus food products approaching their date.
              </div>
            </div>

            {/* Price & Shelf-life Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
              <div>
                <div className="text-[11px] text-stone-500">Deal Price</div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-stone-900">₹{discountedPrice}</span>
                  <span className="text-xs text-stone-400 line-through">₹{originalPrice}</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-bold">MRP ₹{product.mrp || originalPrice}</div>
              </div>

              <div>
                <div className="text-[11px] text-stone-500">Best Before Date</div>
                <div className="text-sm font-bold text-stone-900 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {product.best_before_date}
                </div>
                <div className="text-[11px] text-amber-700 font-medium">
                  {product.days_remaining === 0 ? 'Ending Today!' : `${product.days_remaining} day(s) left`}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="text-[11px] text-stone-500">Available Stock</div>
                <div className="text-sm font-bold text-stone-900 mt-1">
                  {product.quantity} units left
                </div>
                <div className="text-[11px] text-stone-500">Rescue before it expires</div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Product Description
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Storage Instructions */}
            {product.storage_instructions && (
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <strong>Storage Instructions:</strong> {product.storage_instructions}
                </div>
              </div>
            )}

            {/* Provider & Pickup Location Details */}
            <div className="p-4 rounded-2xl border border-stone-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                Pickup Location & Hours
              </h4>
              <div className="text-xs sm:text-sm font-semibold text-stone-900">
                {product.provider_name}
              </div>
              <div className="text-xs text-stone-500 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>{product.provider_address}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-stone-600">
                <span>Pickup Window: <strong>{product.pickup_start_time || '10:00'} - {product.pickup_end_time || '21:00'}</strong></span>
                {product.distance_km != null && (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    📍 {product.distance_km} km from your selected area
                  </span>
                )}
              </div>

              {/* Real Interactive Pickup Mini-Map */}
              {product.provider_lat && product.provider_lng && (
                <div className="pt-2">
                  <StoreMiniMap
                    lat={product.provider_lat}
                    lng={product.provider_lng}
                    storeName={product.provider_name}
                    address={product.provider_address}
                    height="160px"
                  />
                </div>
              )}
            </div>


            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-stone-800">Select Quantity:</span>
              <div className="flex items-center gap-3 bg-stone-100 rounded-2xl p-1">
                <button
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  disabled={selectedQuantity <= 1}
                  className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors shadow-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm w-6 text-center">{selectedQuantity}</span>
                <button
                  onClick={() => setSelectedQuantity(Math.min(product.quantity, selectedQuantity + 1))}
                  disabled={selectedQuantity >= product.quantity}
                  className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-stone-500">Total Price</div>
            <div className="text-lg sm:text-xl font-extrabold text-stone-900">
              ₹{discountedPrice * selectedQuantity}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold">
              Total Savings ₹{savings}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-emerald-600 text-emerald-700 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNowClick}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
            >
              <Zap className="w-4 h-4" />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
