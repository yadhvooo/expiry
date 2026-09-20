import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const POPULAR_LOCATIONS = [
  { name: 'Indiranagar, Bangalore', lat: 12.9784, lng: 77.6408, label: 'Indiranagar' },
  { name: 'Koramangala 4th Block', lat: 12.9345, lng: 77.6200, label: 'Koramangala' },
  { name: 'HSR Layout Sector 1', lat: 12.9121, lng: 77.6446, label: 'HSR Layout' },
  { name: 'Whitefield Main Road', lat: 12.9856, lng: 77.7289, label: 'Whitefield' },
  { name: 'Jayanagar 4th T Block', lat: 12.9308, lng: 77.5838, label: 'Jayanagar' },
  { name: 'MG Road, Central Bangalore', lat: 12.9716, lng: 77.5946, label: 'Central Bangalore' }
];

export async function reverseGeocodeCoords(lat, lng) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

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
      const addr = data.address || {};
      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.subdivision ||
        addr.road ||
        addr.city_district ||
        '';
      const city = addr.city || addr.town || addr.village || addr.county || 'Bangalore';

      const shortLabel = locality ? `${locality}, ${city}` : (city || data.display_name?.split(',')[0]);
      const fullName = locality ? `${locality}, ${city}` : (data.display_name?.split(',').slice(0, 3).join(',') || shortLabel);

      return {
        name: fullName || 'Detected Area',
        label: locality || shortLabel || 'Detected Area',
        lat,
        lng
      };
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err);
  }

  // Fallback: match closest known popular hub if nearby
  for (const hub of POPULAR_LOCATIONS) {
    const dLat = Math.abs(hub.lat - lat);
    const dLng = Math.abs(hub.lng - lng);
    if (dLat < 0.025 && dLng < 0.025) {
      return {
        name: hub.name,
        label: hub.label,
        lat,
        lng
      };
    }
  }

  return {
    name: `Area near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    label: `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
    lat,
    lng
  };
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('user_location');
    return saved
      ? JSON.parse(saved)
      : {
          name: 'Indiranagar, Bangalore',
          lat: 12.9784,
          lng: 77.6408,
          label: 'Indiranagar'
        };
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState(null);

  useEffect(() => {
    localStorage.setItem('user_location', JSON.stringify(location));
  }, [location]);

  function selectLocation(loc) {
    setLocation(loc);
    setIsModalOpen(false);
  }

  function detectBrowserLocation() {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resolvedLocation = await reverseGeocodeCoords(latitude, longitude);
          setLocation(resolvedLocation);
        } catch {
          setLocation({
            name: `Area near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            label: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
            lat: latitude,
            lng: longitude
          });
        } finally {
          setIsLocating(false);
          setIsModalOpen(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocError('Unable to detect location. Please choose from the map or list.');
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  return (
    <LocationContext.Provider
      value={{
        location,
        selectLocation,
        detectBrowserLocation,
        isModalOpen,
        setIsModalOpen,
        isLocating,
        locError,
        popularLocations: POPULAR_LOCATIONS
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}

export default LocationContext;
