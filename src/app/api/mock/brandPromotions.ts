/**
 * Brand-level Promotions — derived from the Single Source of Truth:
 *   src/data/promotions.ts  (BRAND_THRESHOLD entries)
 *
 * To add / edit / deactivate a brand promotion, update promotions.ts.
 * Changes propagate here automatically via the adapter.
 */

import { deriveBrandPromotions } from '../../utils/promotionAdapters';

export interface BrandPromotion {
  id: string;
  brandName: string;
  threshold: number; // Minimum spend in THB
  reward: {
    type: 'FREE_GIFT' | 'DISCOUNT';
    giftItem?: {
      id: string;
      name: string;
      sku: string;
      price: number;
      qty: number;
      unit: string;
      imageUrl?: string;
    };
    discountPercent?: number;
  };
  description: string;
  active: boolean;
}

export const BRAND_PROMOTIONS: BrandPromotion[] = deriveBrandPromotions() as BrandPromotion[];

/**
 * Get active brand promotions
 */
export const getActiveBrandPromotions = (): BrandPromotion[] => {
  return BRAND_PROMOTIONS.filter(p => p.active);
};

/**
 * Get brand promotion by brand name
 */
export const getBrandPromotion = (brandName: string): BrandPromotion | undefined => {
  return BRAND_PROMOTIONS.find(p => p.brandName === brandName && p.active);
};

/**
 * Calculate brand spending from cart
 */
export const calculateBrandSpending = (
  cart: Array<{ product: { brand: string; price: number }; qty: number }>
): Map<string, number> => {
  const brandSpending = new Map<string, number>();

  for (const item of cart) {
    const brand = item.product.brand;
    const spending = item.product.price * item.qty;
    brandSpending.set(brand, (brandSpending.get(brand) || 0) + spending);
  }

  return brandSpending;
};
