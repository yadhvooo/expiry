/**
 * Geolocation & Distance Calculation Service
 * Uses Haversine formula to compute great-circle distance between two coordinates in kilometers.
 */

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  // Round to 1 decimal place (e.g. 1.2 km)
  return Math.round(d * 10) / 10;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export default {
  calculateDistanceKm
};
