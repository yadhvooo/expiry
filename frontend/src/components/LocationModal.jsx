import React from 'react';
import { useLocation } from '../context/LocationContext';
import { MapPin, Navigation, X, Check } from 'lucide-react';

export default function LocationModal() {
  const {
    location,
    selectLocation,
    detectBrowserLocation,
    isModalOpen,
    setIsModalOpen,
    isLocating,
    locError,
    popularLocations
  } = useLocation();

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">Select Pickup Area</h2>
            <p className="text-xs text-stone-500">Discover surplus deals nearest to your location</p>
          </div>
        </div>

        {/* GPS Button */}
        <button
          onClick={detectBrowserLocation}
          disabled={isLocating}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-50 text-emerald-800 font-semibold text-sm hover:bg-emerald-100 border border-emerald-200 transition-all mb-4"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Detecting GPS Coordinates...' : 'Use Current Device Location (GPS)'}
        </button>

        {locError && (
          <p className="text-xs text-rose-600 mb-3 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            {locError}
          </p>
        )}

        <div className="border-t border-stone-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
            Popular City Hubs
          </p>
          <div className="space-y-2">
            {popularLocations.map((loc) => {
              const isSelected = location.label === loc.label;
              return (
                <button
                  key={loc.label}
                  onClick={() => selectLocation(loc)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-900 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-stone-400'}`} />
                    <div>
                      <div className="text-sm font-medium">{loc.label}</div>
                      <div className="text-xs text-stone-400">{loc.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
