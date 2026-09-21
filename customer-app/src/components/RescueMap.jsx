import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Store,
  Navigation,
  Flame,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  Check,
  Maximize2
} from 'lucide-react';
import UrgencyBadge from './UrgencyBadge';
import { useCart } from '../context/CartContext';

export default function RescueMap({
  products = [],
  userLocation,
  isSearching = false,
  onViewProductDetails,
  onBuyNow
}) {

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);

  const { addItem, items } = useCart();
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [addedIds, setAddedIds] = useState({});


  // Group products by provider
  const stores = useMemo(() => {
    const storeMap = {};

    products.forEach((product) => {
      const pId = product.provider_id;
      if (!pId) return;

      if (!storeMap[pId]) {
        storeMap[pId] = {
          id: pId,
          name: product.provider_name || 'Neighborhood Store',
          address: product.provider_address || '',
          lat: parseFloat(product.provider_lat),
          lng: parseFloat(product.provider_lng),
          phone: product.provider_phone,
          distance_km: product.distance_km,
          pickup_start_time: product.pickup_start_time,
          pickup_end_time: product.pickup_end_time,
          products: []
        };
      }
      storeMap[pId].products.push(product);
    });

    return Object.values(storeMap).filter(
      (s) => !isNaN(s.lat) && !isNaN(s.lng)
    );
  }, [products]);

  const activeStore = useMemo(() => {
    if (!selectedStoreId && stores.length > 0) return stores[0];
    return stores.find((s) => s.id === selectedStoreId) || stores[0] || null;
  }, [stores, selectedStoreId]);

  // Handle Quick Add to Cart
  function handleQuickAdd(e, product) {
    e.stopPropagation();
    try {
      addItem(product, 1);
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 1800);
    } catch (err) {
      alert(err.message || 'Could not add to cart');
    }
  }


  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = userLocation?.lat || 12.9716;
    const initialLng = userLocation?.lng || 77.5946;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });
    mapInstanceRef.current = map;

    // Tile Layer: OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Add customer location marker with pulse animation
    const userIcon = L.divIcon({
      className: 'customer-pos-icon',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div class="animate-map-pulse" style="
            position: absolute;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #10b981;
          "></div>
          <div style="
            position: relative;
            z-index: 2;
            width: 16px;
            height: 16px;
            background: #047857;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const userMarker = L.marker([initialLat, initialLng], {
      icon: userIcon,
      zIndexOffset: 1000
    }).addTo(map);
    userMarker.bindTooltip(
      `<strong>You are here</strong><br/>${userLocation?.name || 'Selected Area'}`,
      { direction: 'top', offset: [0, -12] }
    );
    userMarkerRef.current = userMarker;

    // 5 km primary local rescue radius circle
    L.circle([initialLat, initialLng], {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 6',
      radius: 5000 // 5 km local boundary
    }).addTo(map);

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update or sync user marker when userLocation changes
  useEffect(() => {
    if (userLocation && mapInstanceRef.current && userMarkerRef.current) {
      const { lat, lng } = userLocation;
      userMarkerRef.current.setLatLng([lat, lng]);
      userMarkerRef.current.setTooltipContent(
        `<strong>You are here</strong><br/>${userLocation.name || userLocation.label || 'Selected Area'}`
      );
    }
  }, [userLocation]);

  // Update store markers whenever stores change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous store markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    stores.forEach((store) => {
      const hasUrgent = store.products.some((p) => p.expiry_status === 'URGENT');
      const isSelected = store.id === selectedStoreId;
      const isLongPickup = store.distance_km != null && store.distance_km > 5;
      const count = store.products.length;

      const borderColor = isSelected
        ? '#10b981'
        : isLongPickup
        ? '#f59e0b'
        : hasUrgent
        ? '#f43f5e'
        : '#10b981';

      const badgeBg = isLongPickup ? '#d97706' : hasUrgent ? '#f43f5e' : '#059669';
      const badgeIcon = isLongPickup ? '🚗' : hasUrgent ? '🔥' : '🏪';

      const storeIcon = L.divIcon({
        className: `store-marker-${store.id}`,
        html: `
          <div style="
            display: flex;
            align-items: center;
            background: ${isSelected ? '#065f46' : '#ffffff'};
            color: ${isSelected ? '#ffffff' : '#1f2937'};
            border: 2px solid ${borderColor};
            border-radius: 9999px;
            padding: 4px 10px 4px 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            gap: 5px;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            <span style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: ${badgeBg};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
            ">
              ${badgeIcon}
            </span>
            <span>${store.name.length > 18 ? store.name.substring(0, 16) + '...' : store.name}</span>
            <span style="
              background: ${isSelected ? '#047857' : isLongPickup ? '#fef3c7' : '#f3f4f6'};
              color: ${isSelected ? '#a7f3d0' : isLongPickup ? '#92400e' : '#4b5563'};
              padding: 1px 6px;
              border-radius: 9999px;
              font-size: 10px;
            ">
              ${isLongPickup ? `${store.distance_km}km` : `${count} deals`}
            </span>
          </div>
        `,
        iconSize: [170, 32],
        iconAnchor: [85, 16]
      });


      const marker = L.marker([store.lat, store.lng], {
        icon: storeIcon,
        zIndexOffset: isSelected ? 500 : 100
      }).addTo(map);

      marker.on('click', () => {
        setSelectedStoreId(store.id);
        map.flyTo([store.lat, store.lng], 14, { duration: 0.8 });
      });

      markersRef.current[store.id] = marker;
    });
  }, [stores, selectedStoreId]);

  // Recenter on user
  function handleRecenter() {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 13, {
        duration: 1
      });
    }
  }

  // Fit all markers in view
  function handleFitAll() {
    if (!mapInstanceRef.current) return;
    const points = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    stores.forEach((s) => points.push([s.lat, s.lng]));

    if (points.length > 0) {
      mapInstanceRef.current.fitBounds(points, { padding: [40, 40] });
    }
  }

  return (
    <div className="space-y-4">
      {/* Map Card */}
      <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-md bg-white">
        {/* Floating Map Controls & Info Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-stone-200/80 shadow-md text-xs font-semibold text-stone-700 flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              <strong>{stores.length}</strong> {isSearching ? 'Stores Found (Search)' : 'Stores Under 5 km'}
            </span>
            <span className="text-stone-300">•</span>
            <span>
              <strong>{products.length}</strong> Discounted Deals
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={handleRecenter}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-stone-700 hover:text-emerald-700 rounded-xl text-xs font-bold border border-stone-200/80 shadow-md transition-all hover:scale-105"
              title="Recenter to my location"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>My Location</span>
            </button>

            <button
              onClick={handleFitAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-stone-700 hover:text-emerald-700 rounded-xl text-xs font-bold border border-stone-200/80 shadow-md transition-all hover:scale-105"
              title="Fit all stores"
            >
              <Maximize2 className="w-3.5 h-3.5 text-stone-500" />
              <span>View All Stores</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-[460px] z-10" />

        {/* Quick Legend at bottom right of map */}
        <div className="absolute bottom-3 right-3 z-20 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-stone-200/80 shadow-sm text-[11px] text-stone-600 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Under 5 km</span>
          </div>
          {isSearching && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Long Pickup (&gt;5km)</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Urgent Deal 🔥</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-600 inline-block" />
            <span>Your Area</span>
          </div>
        </div>
      </div>

      {/* Selected Store Surplus Deal Showcase */}
      {activeStore ? (
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-stone-900 text-lg sm:text-xl">
                  {activeStore.name}
                </h4>
                {activeStore.distance_km != null && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      activeStore.distance_km > 5
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    📍 {activeStore.distance_km} km away {activeStore.distance_km > 5 ? '• Long Pickup' : '• Under 5 km'}
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{activeStore.address}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  Pickup:{' '}
                  <strong>
                    {activeStore.pickup_start_time || '10:00'} -{' '}
                    {activeStore.pickup_end_time || '21:00'}
                  </strong>
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                {activeStore.products.length} surplus{' '}
                {activeStore.products.length === 1 ? 'deal' : 'deals'}
              </span>
            </div>
          </div>

          {/* Horizontal scroll of products from this store */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeStore.products.map((product) => {
              const inCart = items.some((i) => i.id === product.id);
              const isJustAdded = addedIds[product.id];


              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (onViewProductDetails) onViewProductDetails(product);
                  }}
                  className="group bg-stone-50 hover:bg-white rounded-2xl p-3 border border-stone-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Image & Discount Badge */}
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-stone-200">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] shadow-sm">
                          {Math.round(product.discount_percent)}% OFF
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <UrgencyBadge
                          status={product.expiry_status}
                          daysRemaining={product.days_remaining}
                        />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div>
                      <h5 className="font-bold text-stone-900 text-xs line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </h5>
                      <p className="text-[11px] text-stone-500 line-clamp-1">
                        {product.category_name}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-2 mt-2 border-t border-stone-200/70 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-stone-900">
                        ₹{product.discounted_price}
                      </div>
                      <div className="text-[10px] text-stone-400 line-through">
                        ₹{product.original_price}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewProductDetails) onViewProductDetails(product);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : inCart
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-900 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : inCart ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>In Cart</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Rescue</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-xs text-stone-500">
          No stores match the current filter selection. Try changing category or discount filters.
        </div>
      )}
    </div>
  );
}
