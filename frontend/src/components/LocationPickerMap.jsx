import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Navigation, Compass } from 'lucide-react';

export default function LocationPickerMap({
  currentLocation,
  onLocationSelected,
  height = '320px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [activeCoords, setActiveCoords] = useState({
    lat: currentLocation?.lat || 12.9784,
    lng: currentLocation?.lng || 77.6408,
    name: currentLocation?.name || 'Indiranagar, Bangalore'
  });

  // Reverse geocode lat/lng to human-readable address
  async function reverseGeocode(lat, lng) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const suburb =
          address.suburb ||
          address.neighbourhood ||
          address.residential ||
          address.city_district ||
          address.road ||
          '';
        const city = address.city || address.town || address.county || 'Bangalore';
        const label = suburb ? `${suburb}, ${city}` : (data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        const fullName = data.display_name || `${label} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        return {
          name: fullName,
          label: suburb || label,
          lat,
          lng
        };
      }
    } catch (e) {
      console.warn('Reverse geocode fallback:', e);
    }

    // Fallback if offline / rate-limited
    return {
      name: `Pinned Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      label: `Coordinates: ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
      lat,
      lng
    };
  }

  // Handle location update from map interaction
  async function updatePinLocation(lat, lng) {
    setActiveCoords((prev) => ({ ...prev, lat, lng }));

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
    }

    const locData = await reverseGeocode(lat, lng);
    setActiveCoords(locData);
    if (onLocationSelected) {
      onLocationSelected(locData);
    }
  }

  // Handle address text search using Nominatim
  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Append Bangalore/India to search context if not specified
      const query = searchQuery.includes(',') ? searchQuery : `${searchQuery}, Bangalore`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (!res.ok) throw new Error('Search failed');
      const results = await res.json();

      if (results && results.length > 0) {
        const item = results[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLng], 14, { duration: 1.2 });
        }
        await updatePinLocation(newLat, newLng);
      } else {
        setSearchError('No matching areas found. Try another landmark.');
      }
    } catch (err) {
      console.error('Location search error:', err);
      setSearchError('Search failed. Please click directly on the map.');
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = currentLocation?.lat || 12.9784;
    const initialLng = currentLocation?.lng || 77.6408;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // Tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Custom Draggable Pin
    const pinIcon = L.divIcon({
      className: 'user-pin-icon',
      html: `
        <div style="position: relative; width: 36px; height: 44px; display: flex; flex-direction: column; align-items: center;">
          <div style="
            width: 32px;
            height: 32px;
            background: #059669;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #059669;
            margin-top: -2px;
          "></div>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 42]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);
    markerRef.current = marker;

    // 10 km rescue radius circle
    const circle = L.circle([initialLat, initialLng], {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.1,
      weight: 1.5,
      radius: 10000 // 10 km
    }).addTo(map);
    circleRef.current = circle;

    // Marker drag event
    marker.on('dragend', async (e) => {
      const position = e.target.getLatLng();
      await updatePinLocation(position.lat, position.lng);
    });

    // Map click event
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      await updatePinLocation(lat, lng);
    });

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

  // When external currentLocation changes
  useEffect(() => {
    if (currentLocation && mapInstanceRef.current && markerRef.current) {
      const { lat, lng } = currentLocation;
      mapInstanceRef.current.panTo([lat, lng]);
      markerRef.current.setLatLng([lat, lng]);
      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lng]);
      }
      setActiveCoords(currentLocation);
    }
  }, [currentLocation]);

  return (
    <div className="space-y-3">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area (e.g., Koramangala, Indiranagar)..."
              className="w-full pl-9 pr-4 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>
        {searchError && (
          <p className="text-[11px] text-rose-600 mt-1 pl-1">{searchError}</p>
        )}
      </form>

      {/* Real Map Container */}
      <div
        className="w-full rounded-2xl overflow-hidden border border-stone-200 shadow-inner relative"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Hint Overlay */}
        <div className="absolute top-2 left-2 z-20 pointer-events-none bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-stone-200 shadow-sm text-[11px] text-stone-600 flex items-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Click anywhere or drag pin to choose area</span>
        </div>
      </div>

      {/* Selected Location Pill */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="truncate">
            <span className="font-bold text-stone-800 block truncate">
              {activeCoords.name || 'Selected Location'}
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              {activeCoords.lat.toFixed(4)}, {activeCoords.lng.toFixed(4)} • 10 km rescue radius
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
