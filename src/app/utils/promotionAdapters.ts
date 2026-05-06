/**
 * Promotion Adapters
 *
 * Derives runtime promotion data structures from the Single Source of Truth:
 *   src/data/promotions.ts
 *
 * Consumers:
 *   - src/app/api/mock/promotions.ts    → deriveBillPromotions()
 *   - src/app/api/mock/brandPromotions.ts → deriveBrandPromotions()
 *   - src/app/api/mock/products.ts      → buildPromoMap()
 *   - src/data/coupons.ts               → imports promotions.ts directly
 */

import { PROMOTIONS } from '../../data/promotions';
import { PRODUCTS as MASTER_PRODUCTS } from '../../data/products';

// ─── Metadata for reward items ─────────────────────────────────────────────────
// Fields that are not stored in the promotions catalog (barcode, price, unit, image).
// Keyed by SKU_OID (same as Promotion.Rewards.Reward_Items[].SKU).
const REWARD_META: Record<string, {
  barcode: string;
  price: number;
  unit: string;
  image: string;
}> = {
  '70000719': {
    barcode: '99802158',
    price: 90,
    unit: 'ชุด',
    image: 'https://www.yongcharoen.co.th/img/product/998/99802158_1.webp',
  },
  '70000720': {
    barcode: '99802165',
    price: 140,
    unit: 'ชุด',
    image: 'https://www.yongcharoen.co.th/img/product/998/99802165_1.webp',
  },
  '70000721': {
    barcode: '99802172',
    price: 280,
    unit: 'ชุด',
    image: 'https://www.yongcharoen.co.th/img/product/998/99802172_1.webp',
  },
  '10008770': {
    barcode: '18851907107335',
    price: 170,
    unit: 'โหล',
    image: 'https://www.yongcharoen.co.th/img/product/188/18851907107335_1.webp',
  },
  '40003279': {
    barcode: '08000163',
    price: 665,
    unit: 'แพ็ค',
    image: 'https://www.yongcharoen.co.th/img/product/080/08000163_1.webp',
  },
  '70001749': {
    barcode: '00100175',
    price: 100,
    unit: 'แพ็ค',
    image: 'https://www.yongcharoen.co.th/img/product/001/00100175_1.webp',
  },
  '40003367': {
    barcode: '30000742',
    price: 82,
    unit: 'ห่อ',
    image: 'https://www.yongcharoen.co.th/img/product/300/30000742_1.webp',
  },
  '10011590': {
    barcode: '18851907148697',
    price: 192,
    unit: 'โหล',
    image: 'https://www.yongcharoen.co.th/img/product/188/18851907148697_1.webp',
  },
};

// ─── Reward-SKU_OID → FREE_ITEMS_DATABASE key ─────────────────────────────────
// Maps the free-item's SKU_OID (as recorded in Reward_Items[].SKU) to
// the 'free-N' id used in FREE_ITEMS_DATABASE and PROMO_MAP.
const SKU_TO_FREE_ID: Record<string, string> = {
  '70006031': 'free-2',   // เชือกคล้องคอ คลิปเหล็ก (ของแถมกับ Champ กระดาษสีพื้น)
  '70001749': 'free-3',   // นกฮูก กบเหลาดินสอ 2 รู No.349
  '70000719': 'free-4',   // ชุดเครื่องเขียน สังฆทาน ชุดเล็ก
  '10008770': 'free-5',   // Quantum ปากกาเน้นข้อความ QH-710
};

// ─── Lazy SKU_OID → Barcode_ID reverse-lookup ────────────────────────────────
let _skuToBarcodeCache: Map<string, string> | null = null;
function getSkuToBarcodeMap(): Map<string, string> {
  if (!_skuToBarcodeCache) {
    _skuToBarcodeCache = new Map(
      MASTER_PRODUCTS.map(p => [p.SKU_OID, p.Barcode_ID ?? ''])
    );
  }
  return _skuToBarcodeCache;
}

// ─── Type definitions mirroring the consumer interfaces ──────────────────────
// (Defined here to avoid circular imports — TypeScript structural typing
//  ensures these are assignable to the types in the consumer files.)

export interface DerivedGiftItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  unit: string;
  image?: string;
  imageUrl?: string;
}

export interface DerivedBillPromotion {
  id: string;
  type: 'FREE_GIFT' | 'BILL_DISCOUNT' | 'TIER_UPGRADE';
  name: string;
  description: string;
  threshold: number;
  reward: {
    type: 'GIFT' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'TIER_UPGRADE';
    value?: number;
    giftItem?: DerivedGiftItem;
  };
  targetTiers?: string[];
  active: boolean;
  priority: number;
  stackable?: boolean;
}

export interface DerivedBrandPromotion {
  id: string;
  brandName: string;
  threshold: number;
  reward: {
    type: 'FREE_GIFT' | 'DISCOUNT';
    giftItem?: DerivedGiftItem;
    discountPercent?: number;
  };
  description: string;
  active: boolean;
}

export interface DerivedPromoEntry {
  type: 'B2G1' | 'DISCOUNT' | 'BUNDLE' | 'FREE_ITEM';
  desc: string;
  freeItemId?: string;
  sameSku?: boolean;
  threshold?: number;
  discountPercent?: number;
  minQty?: number;
  freeQty?: number;
}

// ─── deriveBillPromotions ──────────────────────────────────────────────────────
/**
 * Returns BillPromotion-compatible objects derived from THRESHOLD_AMOUNT promos.
 * Sorted ascending by threshold so priority aligns with the array index.
 * Note: TIER_UPGRADE entries must be added separately (not stored in promotions.ts).
 */
export function deriveBillPromotions(): DerivedBillPromotion[] {
  const thresholdPromos = PROMOTIONS
    .filter(p => p.Promo_Type === 'THRESHOLD_AMOUNT' && p.Status === 'Active')
    .sort((a, b) => (a.Conditions.Minimum_Amount ?? 0) - (b.Conditions.Minimum_Amount ?? 0));

  return thresholdPromos
    .map((p, index): DerivedBillPromotion | null => {
      const threshold = p.Conditions.Minimum_Amount ?? 0;
      const targetTiers = p.Target_Audience.includes('ALL')
        ? undefined
        : (p.Target_Audience as string[]);

      // FREE_ITEM reward → FREE_GIFT bill promo
      if (p.Rewards.Reward_Type === 'FREE_ITEM' && p.Rewards.Reward_Items?.[0]) {
        const item = p.Rewards.Reward_Items[0];
        const meta = REWARD_META[item.SKU] ?? { barcode: item.SKU, price: 0, unit: 'ชิ้น', image: '' };
        return {
          id: p.Promo_ID,
          type: 'FREE_GIFT',
          name: p.Promo_Name,
          description: `ซื้อครบ ${threshold.toLocaleString('en-US')} ฿ รับ${item.ProductName} ฟรี`,
          threshold,
          reward: {
            type: 'GIFT',
            giftItem: {
              id: item.SKU,
              name: item.ProductName,
              sku: meta.barcode,
              price: meta.price,
              qty: item.Qty ?? 1,
              unit: meta.unit,
              image: meta.image,
            },
          },
          targetTiers,
          active: true,
          priority: index + 1,
          stackable: false,
        };
      }

      // BILL_DISCOUNT reward → BILL_DISCOUNT bill promo
      if (p.Rewards.Reward_Type === 'BILL_DISCOUNT') {
        const rewardType = p.Rewards.Discount_Type === 'PERCENT'
          ? 'DISCOUNT_PERCENT' as const
          : 'DISCOUNT_AMOUNT' as const;
        return {
          id: p.Promo_ID,
          type: 'BILL_DISCOUNT',
          name: p.Promo_Name,
          description: p.Promo_Name,
          threshold,
          reward: { type: rewardType, value: p.Rewards.Discount_Value },
          targetTiers,
          active: true,
          priority: index + 1,
          stackable: false,
        };
      }

      return null;
    })
    .filter((x): x is DerivedBillPromotion => x !== null);
}

// ─── deriveBrandPromotions ─────────────────────────────────────────────────────
/**
 * Returns BrandPromotion-compatible objects derived from BRAND_THRESHOLD promos.
 */
export function deriveBrandPromotions(): DerivedBrandPromotion[] {
  return PROMOTIONS
    .filter(p => p.Promo_Type === 'BRAND_THRESHOLD' && p.Status === 'Active')
    .map((p): DerivedBrandPromotion | null => {
      const threshold = p.Conditions.Minimum_Amount ?? 0;
      const brandName = p.Conditions.Target_Brand ?? '';

      // FREE_ITEM reward → FREE_GIFT brand promo
      if (p.Rewards.Reward_Type === 'FREE_ITEM' && p.Rewards.Reward_Items?.[0]) {
        const item = p.Rewards.Reward_Items[0];
        const meta = REWARD_META[item.SKU] ?? { barcode: item.SKU, price: 0, unit: 'ชิ้น', image: '' };
        return {
          id: p.Promo_ID,
          brandName,
          threshold,
          reward: {
            type: 'FREE_GIFT',
            giftItem: {
              id: item.SKU,
              name: item.ProductName,
              sku: meta.barcode,
              price: meta.price,
              qty: item.Qty ?? 1,
              unit: meta.unit,
              imageUrl: meta.image,
            },
          },
          description: p.Promo_Name,
          active: true,
        };
      }

      // ITEM_DISCOUNT reward → DISCOUNT brand promo
      if (p.Rewards.Reward_Type === 'ITEM_DISCOUNT' && p.Rewards.Reward_Items?.[0]) {
        return {
          id: p.Promo_ID,
          brandName,
          threshold,
          reward: {
            type: 'DISCOUNT',
            discountPercent: p.Rewards.Reward_Items[0].Discount_Value,
          },
          description: p.Promo_Name,
          active: true,
        };
      }

      return null;
    })
    .filter((x): x is DerivedBrandPromotion => x !== null);
}

// ─── buildPromoMap ────────────────────────────────────────────────────────────
/**
 * Returns a PROMO_MAP-compatible object (keyed by Barcode_ID) derived from
 * SKU_IN_LIST promotions in the catalog.
 *
 * Uses the SKU_OID → Barcode_ID reverse-lookup from MASTER_PRODUCTS so that
 * changes to promotions.ts automatically propagate to product cards.
 */
export function buildPromoMap(): Record<string, DerivedPromoEntry> {
  const skuToBarcode = getSkuToBarcodeMap();
  const map: Record<string, DerivedPromoEntry> = {};

  const skuListPromos = PROMOTIONS.filter(
    p => p.Conditions.Match_Type === 'SKU_IN_LIST' && p.Status === 'Active'
  );

  for (const promo of skuListPromos) {
    const targetSkus = promo.Conditions.Target_SKUs ?? [];
    const { Rewards, Conditions } = promo;

    for (const sku of targetSkus) {
      const barcode = skuToBarcode.get(sku) ?? '';
      if (!barcode) continue;  // SKU not in master catalog — skip

      if (Rewards.Reward_Type === 'FREE_ITEM' && Rewards.Reward_Items?.[0]) {
        const rewardSku = Rewards.Reward_Items[0].SKU;
        const isSameSku = rewardSku === sku;

        if (isSameSku) {
          map[barcode] = {
            type: 'B2G1',
            desc: promo.Promo_Name,
            sameSku: true,
            minQty: Conditions.Minimum_Qty,
            freeQty: Rewards.Reward_Items[0].Qty ?? 1,
          };
        } else {
          const freeItemId = SKU_TO_FREE_ID[rewardSku];
          if (freeItemId) {
            map[barcode] = {
              type: promo.Promo_Type === 'BUY_X_GET_Y_QTY' ? 'B2G1' : 'FREE_ITEM',
              desc: promo.Promo_Name,
              freeItemId,
              minQty: Conditions.Minimum_Qty,
              freeQty: Rewards.Reward_Items[0].Qty ?? 1,
            };
          }
        }
      } else if (Rewards.Reward_Type === 'ITEM_DISCOUNT' && Rewards.Reward_Items?.[0]) {
        map[barcode] = {
          type: 'DISCOUNT',
          desc: promo.Promo_Name,
          threshold: Conditions.Minimum_Qty,
          discountPercent: Rewards.Reward_Items[0].Discount_Value,
        };
      } else if (Rewards.Reward_Type === 'FIXED_PRICE') {
        map[barcode] = {
          type: 'BUNDLE',
          desc: promo.Promo_Name,
          minQty: Conditions.Trigger_At_Qty ?? Conditions.Minimum_Qty,
        };
      }
    }
  }

  return map;
}
