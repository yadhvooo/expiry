import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ExternalLink, Navigation } from 'lucide-react';

export default function StoreMiniMap({
  lat,
  lng,
  storeName,
  address,
  height = '180px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (lat == null || lng == null) return;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    // Clean up previous map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [parsedLat, parsedLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false
    });
    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Custom store SVG marker icon
    const storeIcon = L.divIcon({
      className: 'store-pin-icon',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: #059669;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -20]
    });

    const marker = L.marker([parsedLat, parsedLng], { icon: storeIcon }).addTo(map);

    if (storeName) {
      marker.bindPopup(`
        <div style="padding: 10px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-weight: 700; font-size: 13px; color: #1c1917; margin-bottom: 2px;">${storeName}</div>
          <div style="font-size: 11px; color: #78716c; line-height: 1.3;">${address || ''}</div>
        </div>
      `);
    }

    // Call invalidateSize after slight delay to guarantee correct sizing in modals
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
  }, [lat, lng, storeName, address]);

  if (lat == null || lng == null) {
    return null;
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="space-y-2">
      <div
        className="w-full rounded-2xl overflow-hidden border border-stone-200 shadow-inner relative"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-emerald-800 text-xs font-bold rounded-xl shadow-md border border-stone-200 transition-all hover:scale-105"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-600" />
          <span>Get Directions</span>
          <ExternalLink className="w-3 h-3 text-stone-400" />
        </a>
      </div>
    </div>
  );
}
