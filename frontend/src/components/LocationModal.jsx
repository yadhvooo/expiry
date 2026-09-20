import React, { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { MapPin, Navigation, X, Check, Map, Compass } from 'lucide-react';
import LocationPickerMap from './LocationPickerMap';

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

  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'hubs'
  const [pinnedLocation, setPinnedLocation] = useState(location);

  // Sync with current context location when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setPinnedLocation(location);
    }
  }, [isModalOpen, location]);

  if (!isModalOpen) return null;

  function handleConfirmLocation() {
    if (pinnedLocation) {
      selectLocation(pinnedLocation);
    }
  }

  function handleSelectHub(loc) {
    setPinnedLocation(loc);
    selectLocation(loc);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">Select Pickup Area</h2>
            <p className="text-xs text-stone-500">Pick your neighborhood on the real map to see nearby deals</p>
          </div>
        </div>

        {/* Tab Switcher: Map Pinpoint vs Hubs */}
        <div className="flex items-center bg-stone-100 p-1 rounded-2xl text-xs font-bold mb-4">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              activeTab === 'map'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real Map Pinpoint</span>
          </button>
          <button
            onClick={() => setActiveTab('hubs')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              activeTab === 'hubs'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Popular Hubs</span>
          </button>
        </div>

        {/* GPS Button */}
        <button
          onClick={detectBrowserLocation}
          disabled={isLocating}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-50 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 border border-emerald-200 transition-all mb-4"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Detecting GPS & Resolving Area Name...' : 'Use Current Device Location (GPS)'}

        </button>

        {locError && (
          <p className="text-xs text-rose-600 mb-3 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            {locError}
          </p>
        )}

        {/* Interactive Map Mode */}
        {activeTab === 'map' ? (
          <div className="space-y-4">
            <LocationPickerMap
              currentLocation={pinnedLocation}
              onLocationSelected={(loc) => setPinnedLocation(loc)}
              height="280px"
            />

            {/* Quick Hub Pills under map for fast jumping */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Quick Jump to Hub:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {popularLocations.map((loc) => {
                  const isSelected =
                    pinnedLocation?.label === loc.label ||
                    pinnedLocation?.name === loc.name;
                  return (
                    <button
                      key={loc.label}
                      onClick={() => setPinnedLocation(loc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {loc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm Location Button */}
            <button
              onClick={handleConfirmLocation}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Discover Deals Here</span>
            </button>
          </div>
        ) : (
          /* Hubs List Mode */
          <div className="border-t border-stone-100 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
              Popular City Hubs
            </p>
            <div className="space-y-2">
              {popularLocations.map((loc) => {
                const isSelected = location.label === loc.label;
                return (
                  <button
                    key={loc.label}
                    onClick={() => handleSelectHub(loc)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-900 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin
                        className={`w-4 h-4 ${
                          isSelected ? 'text-emerald-600' : 'text-stone-400'
                        }`}
                      />
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
        )}
      </div>
    </div>
  );
}
