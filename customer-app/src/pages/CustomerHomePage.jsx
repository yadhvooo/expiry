import React, { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import RescueMap from '../components/RescueMap';
import {
  Sparkles,
  Flame,
  Percent,
  MapPin,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  Map
} from 'lucide-react';

export default function CustomerHomePage({ searchTerm, onBuyNow }) {
  const { location } = useLocation();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [minDiscount, setMinDiscount] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Selected product for detail modal
  const [detailProduct, setDetailProduct] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedUrgency, sortBy, minDiscount, searchTerm, location]);

  async function loadCategories() {
    try {
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);

      const params = {
        category: selectedCategory,
        urgency: selectedUrgency,
        sortBy,
        minDiscount: minDiscount || undefined,
        search: searchTerm || undefined,
        maxDistance: searchTerm ? undefined : 5, // Local pickup under 5km; long pickup only when searching
        lat: location.lat,
        lng: location.lng
      };

      const res = await api.getProducts(params);
      setProducts(res.products || []);
    } catch (err) {
      console.error('Failed to load products', err);
      setError('Unable to load surplus food products. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Quick category filters
  const urgentDeals = products.filter((p) => p.expiry_status === 'URGENT');
  const bestDeals = products.filter((p) => p.discount_percent >= 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Hero Banner with Sustainability Tagline */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur border border-emerald-400/30 text-emerald-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Zero Food Waste • Deep Everyday Savings</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Rescue Premium Food Near You at up to <span className="text-emerald-300">50%–70% OFF</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Bakeries, dairy parlours, and cloud kitchens list certified near-expiry surplus food daily. Check the best-before date, purchase at discount, and collect from your neighborhood store.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>
                {searchTerm ? (
                  <>Showing results across all distances for <strong>"{searchTerm}"</strong> (Long Pickup enabled)</>
                ) : (
                  <>Showing local pickup deals under <strong>5 km</strong> near <strong>{location.label || location.name}</strong></>
                )}
              </span>
            </div>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold text-xs transition-all shadow-sm"
            >
              {viewMode === 'grid' ? (
                <>
                  <Map className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Open Interactive Map</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Switch to Grid Catalog</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Category Pills (STRICTLY NO FRUITS OR VEGETABLES) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Explore Surplus Categories
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Reset to All
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            All Categories
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Sort Controls Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Urgency Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setSelectedUrgency('all')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                selectedUrgency === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Shelf-life
            </button>
            <button
              onClick={() => setSelectedUrgency('URGENT')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                selectedUrgency === 'URGENT' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Urgent (1–2d)</span>
            </button>
            <button
              onClick={() => setSelectedUrgency('APPROACHING')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                selectedUrgency === 'APPROACHING' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Approaching (3–7d)
            </button>
          </div>

          {/* 50%+ OFF Quick toggle */}
          <button
            onClick={() => setMinDiscount(minDiscount === '50' ? '' : '50')}
            className={`flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-bold border transition-colors ${
              minDiscount === '50'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-emerald-600" />
            <span>50%+ OFF Deals</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Grid vs Map */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'map'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-3 py-2 rounded-xl border-none outline-none cursor-pointer text-xs"
            >
              <option value="distance">Distance (Nearest First)</option>
              <option value="discount">Highest Discount %</option>
              <option value="expiry">Ending Soonest (Urgent)</option>
              <option value="price_asc">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>


      {/* View Mode Switching: Map View vs Grid View */}
      {viewMode === 'map' ? (
        <RescueMap
          products={products}
          userLocation={location}
          isSearching={Boolean(searchTerm)}
          onViewProductDetails={setDetailProduct}
          onBuyNow={onBuyNow}
        />
      ) : (

        <>
          {/* Highlight Sections (When showing all and no specific search) */}
          {!searchTerm && selectedCategory === 'all' && selectedUrgency === 'all' && (
            <>
              {/* Urgent Rescue Deals Row */}
              {urgentDeals.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                        <Flame className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                        Ending Today & Tomorrow (Urgent Rescue 🔥)
                      </h3>
                    </div>
                    <span className="text-xs text-rose-600 font-bold">
                      {urgentDeals.length} items ending soon
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {urgentDeals.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onViewDetails={setDetailProduct}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Main Product Catalog Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-stone-900 text-lg sm:text-xl flex items-center gap-2">
                <span>Available Deals Near You</span>
                <span className="text-xs font-semibold text-stone-400">
                  ({products.length} {products.length === 1 ? 'deal' : 'deals'})
                </span>
              </h3>

              <button
                onClick={loadProducts}
                disabled={loading}
                className="p-2 text-stone-400 hover:text-emerald-700 transition-colors"
                title="Refresh listings"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-3xl p-4 border border-stone-200/80 animate-pulse space-y-3">
                    <div className="aspect-[4/3] bg-stone-200 rounded-2xl" />
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                    <div className="h-8 bg-stone-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-stone-200/80 space-y-3 p-6">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
                  <SlidersHorizontal className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-stone-800 text-base">
                  {searchTerm ? `No deals found matching "${searchTerm}"` : 'No active deals found under 5 km'}
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {searchTerm
                    ? 'Try adjusting your search keywords, category filters, or urgency.'
                    : 'Only stores within 5 km of your location are shown by default. Search for a specific food item above to discover deals from stores across the city (Long Pickup).'}
                </p>

                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedUrgency('all');
                    setMinDiscount('');
                  }}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={setDetailProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}


      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onBuyNow={() => {
            if (onBuyNow) onBuyNow();
          }}
        />
      )}
    </div>
  );
}
