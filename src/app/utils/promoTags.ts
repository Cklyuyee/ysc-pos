/**
 * Mock promo-tag helpers — single source of truth so the same product/brand
 * never shows two contradictory promo labels across the UI (cart row,
 * product search, sidebar promo card, free-row badge).
 *
 * Replace with real /promotions API once available.
 */

export type PromoTagColor = 'amber' | 'red' | 'sky' | 'green';

export interface MockPromoTag {
  label: string;
  color: PromoTagColor;
}

/**
 * Deterministic "buy X" qty for buy-X-get-Y promo, derived from brand hash.
 * Must match buygetFreeBySku / sidebar promo card so the same brand never
 * shows two contradictory labels.
 */
export function getBuyGetQty(brand?: string, sku?: string): number {
  const seed = brand ?? sku ?? '';
  const hash = seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return hash % 2 === 0 ? 1 : 2;
}

/** Promo tags shown under product name in cart row, search, etc. */
export function getMockPromoTags(brand?: string): MockPromoTag[] {
  if (!brand || brand === '-') return [];
  const hash = brand.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const tags: MockPromoTag[] = [{ label: `โปรแบรนด์ ${brand}`, color: 'amber' }];
  const n = hash % 5;
  if (n === 0) tags.push({ label: `ซื้อ ${getBuyGetQty(brand)} แถม 1`, color: 'red' });
  else if (n === 1) tags.push({ label: 'ลด 10%', color: 'sky' });
  else if (n === 2) tags.push({ label: 'ลด 15%', color: 'sky' });
  // n === 3 or 4: just the brand tag
  return tags;
}

/** Tailwind class strings for each promo-tag colour. */
export const PROMO_TAG_STYLES: Record<PromoTagColor, string> = {
  amber: 'bg-amber-100 text-amber-700',
  red:   'bg-red-100 text-red-600',
  sky:   'bg-sky-100 text-sky-600',
  green: 'bg-green-100 text-green-700',
};
