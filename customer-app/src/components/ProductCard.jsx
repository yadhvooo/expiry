import React from 'react';
import { useCart } from '../context/CartContext';
import UrgencyBadge from './UrgencyBadge';
import { MapPin, Clock, Plus, Check } from 'lucide-react';

export default function ProductCard({ product, onViewDetails }) {
  const { addItem, items } = useCart();
  const isInCart = items.some((i) => i.id === product.id);

  const discountPercent = Math.round(product.discount_percent);
  const originalPrice = Math.round(product.original_price);
  const discountedPrice = Math.round(product.discounted_price);

  function handleQuickAdd(e) {
    e.stopPropagation();
    addItem(product, 1);
  }

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="group relative bg-white rounded-3xl overflow-hidden border border-stone-200/80 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Top Media & Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
          <UrgencyBadge
            status={product.expiry_status}
            badge={product.expiry_badge}
            daysRemaining={product.days_remaining}
          />
          {product.quantity <= 3 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm">
              Only {product.quantity} Left
            </span>
          )}
        </div>

        {/* Discount Badge */}
        <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md">
          {discountPercent}% OFF
        </div>

        {/* Distance Overlay */}
        {product.distance_km != null && (
          <div
            className={`absolute bottom-2 left-2.5 backdrop-blur-md text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm ${
              product.distance_km > 5
                ? 'bg-amber-950/85 text-amber-200 border border-amber-500/50'
                : 'bg-black/60 text-white'
            }`}
          >
            <MapPin
              className={`w-3 h-3 ${
                product.distance_km > 5 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            />
            <span>
              {product.distance_km} km {product.distance_km > 5 ? '• Long Pickup' : 'away'}
            </span>
          </div>
        )}
      </div>


      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Provider name */}
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="truncate">{product.provider_name}</span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
              {product.category_name}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          {/* Best Before info */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Best before: <strong className="text-stone-700 font-semibold">{product.best_before_date}</strong>
            </span>
          </div>

          <div className="text-[11px] text-stone-500 mt-0.5">
            <span>{product.quantity} available for pickup</span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-stone-900">
                ₹{discountedPrice}
              </span>
              <span className="text-xs text-stone-400 line-through">
                ₹{originalPrice}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block">
              Save ₹{originalPrice - discountedPrice}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleQuickAdd}
              className={`p-2 rounded-2xl transition-all ${
                isInCart
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200'
              }`}
              title="Add to Cart"
            >
              {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onViewDetails(product)}
              className="px-3 py-2 rounded-2xl bg-stone-900 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              View Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
