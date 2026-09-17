/**
 * Expiry Classification & Food Safety Service
 *
 * Rules:
 * - NORMAL: More than 7 days remaining
 * - APPROACHING: 3 to 7 days remaining
 * - URGENT: 1 to 2 days remaining (or ending today)
 * - EXPIRED: Date has passed
 *
 * CRITICAL FOOD SAFETY:
 * Expired products must automatically be marked inactive and cannot be purchased.
 */

export function calculateDaysRemaining(expiryDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function classifyExpiry(expiryDateStr) {
  const daysRemaining = calculateDaysRemaining(expiryDateStr);

  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      badge: 'Expired - Unsellable',
      daysRemaining,
      isSellable: false,
      urgencyLevel: 0
    };
  } else if (daysRemaining <= 1) {
    return {
      status: 'URGENT',
      badge: daysRemaining === 0 ? 'Ending Today 🔥' : 'Best Before Tomorrow ⚡',
      daysRemaining,
      isSellable: true,
      urgencyLevel: 3
    };
  } else if (daysRemaining <= 2) {
    return {
      status: 'URGENT',
      badge: 'Ending in 2 Days 🔥',
      daysRemaining,
      isSellable: true,
      urgencyLevel: 3
    };
  } else if (daysRemaining <= 7) {
    return {
      status: 'APPROACHING',
      badge: `${daysRemaining} Days Left`,
      daysRemaining,
      isSellable: true,
      urgencyLevel: 2
    };
  } else {
    return {
      status: 'NORMAL',
      badge: `${daysRemaining} Days Left`,
      daysRemaining,
      isSellable: true,
      urgencyLevel: 1
    };
  }
}

/**
 * Validates whether a product is currently sellable based on expiry date
 */
export function isProductSellable(expiryDateStr, quantity) {
  const classification = classifyExpiry(expiryDateStr);
  return classification.isSellable && Number(quantity) > 0;
}

export default {
  calculateDaysRemaining,
  classifyExpiry,
  isProductSellable
};
