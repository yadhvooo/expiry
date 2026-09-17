import { calculateDaysRemaining } from './expiryService.js';

/**
 * Dynamic Auto-Discount Recommendation Engine
 *
 * Implements shelf-life tiers:
 * > 7 days: 0%
 * 3-7 days: 20%
 * 2 days:   30%
 * 1 day:    50%
 * Today (0 days): 60%
 *
 * Configurable with future dynamic factors (demand, quantity remaining, minimum floor).
 */
export function calculateRecommendedDiscount(expiryDateStr, originalPrice, options = {}) {
  const daysRemaining = calculateDaysRemaining(expiryDateStr);
  const minFloorPrice = options.minFloorPrice || 0;
  let recommendedPercent = 0;

  if (daysRemaining > 7) {
    recommendedPercent = 0;
  } else if (daysRemaining >= 3) {
    recommendedPercent = 20;
  } else if (daysRemaining === 2) {
    recommendedPercent = 30;
  } else if (daysRemaining === 1) {
    recommendedPercent = 50;
  } else if (daysRemaining === 0) {
    recommendedPercent = 60; // Extra clearance for today
  } else {
    // Expired
    return {
      recommendedPercent: 0,
      discountedPrice: 0,
      isExpired: true
    };
  }

  // Calculate discounted price: Price = Original - (Original * Percent / 100)
  const discountAmount = (originalPrice * recommendedPercent) / 100;
  let discountedPrice = Math.max(minFloorPrice, originalPrice - discountAmount);
  discountedPrice = Math.round(discountedPrice * 100) / 100;

  return {
    recommendedPercent,
    discountedPrice,
    daysRemaining,
    isExpired: false
  };
}

/**
 * Helper to compute discounted price given explicit percent
 */
export function computeDiscountedPrice(originalPrice, discountPercent) {
  const price = Number(originalPrice) || 0;
  const percent = Number(discountPercent) || 0;
  const discounted = price - (price * percent) / 100;
  return Math.max(0, Math.round(discounted * 100) / 100);
}

export default {
  calculateRecommendedDiscount,
  computeDiscountedPrice
};
