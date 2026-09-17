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
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({
          name: 'Current Device Location',
          lat: latitude,
          lng: longitude,
          label: 'Current Location'
        });
        setIsLocating(false);
        setIsModalOpen(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocError('Unable to detect location. Please choose from the list.');
        setIsLocating(false);
      },
      { timeout: 8000 }
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
