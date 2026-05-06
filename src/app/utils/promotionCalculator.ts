import { Product, FREE_ITEMS_DATABASE } from '../api/mock/products';
import { BillPromotion, ProductPromotion } from '../api/mock/promotions';
import { PRODUCT_DATABASE } from '../api/mock/products';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  qty: number;
  discount: number;
  total: number;
  freeItems?: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
    unit: string;
    image: string;
    sku: string;
  }>;
  upsellMsg?: string;
  /** รหัส Promotion ที่ถูก Apply กับ line item นี้ (สำหรับ SO tracking) */
  appliedPromoIds?: string[];
}

export interface PromotionResult {
  cartItems: CartItem[];
  billGifts: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    qty: number;
    unit: string;
    image?: string;
    threshold?: number;  // ยอดซื้อขั้นต่ำที่ unlock ของแถมนี้
  }>;
  totalDiscount: number;
  subtotal: number;
  /**
   * ส่วนลดระดับบิล (BILL_DISCOUNT type) เช่น ซื้อครบ 25k ลด 5%
   * แยกออกมาจาก totalDiscount เพื่อแสดงในหน้า Order Summary
   */
  billDiscount: number;
  /** Promotion ID ทุกตัวที่ถูก apply ในออเดอร์นี้ (สำหรับ campaign attribution) */
  appliedPromoIds: string[];
}

// ─── Item-level ───────────────────────────────────────────────────────────────

/**
 * Calculate item-level promotions (B2G1, quantity discounts, etc.)
 */
export const calculateItemPromotions = (
  product: Product,
  qty: number
): {
  discount: number;
  freeItems: Array<{ id: string; name: string; price: number; qty: number; unit: string; image: string; sku: string }>;
  upsellMsg?: string;
  appliedPromoIds: string[];
} => {
  let discount = 0;
  const freeItems: Array<{ id: string; name: string; price: number; qty: number; unit: string; image: string; sku: string }> = [];
  let upsellMsg: string | undefined;
  const appliedPromoIds: string[] = [];

  if (!product.promo) {
    return { discount, freeItems, upsellMsg, appliedPromoIds };
  }

  const promo = product.promo;

  switch (promo.type) {
    case 'FREE_ITEM':
    case 'B2G1':
      if (promo.minQty && qty >= promo.minQty) {
        const sets = Math.floor(qty / promo.minQty);
        const freeQtyTotal = sets * (promo.freeQty || 1);

        if (promo.sameSku) {
          // ของแถม = SKU เดียวกัน → หักจาก stock เดียวกัน
          freeItems.push({
            id: product.sku,
            name: product.name,
            price: product.price,
            qty: freeQtyTotal,
            unit: product.unit,
            image: product.image,
            sku: product.sku,
          });
          appliedPromoIds.push(`item-promo-${product.sku}`);
        } else if (promo.freeItemId) {
          // ของแถม = สินค้าต่างชนิด → lookup FREE_ITEMS_DATABASE
          const freeData = (FREE_ITEMS_DATABASE as any)[promo.freeItemId];
          if (freeData) {
            // D-019: ตรวจสต็อกก่อนแจก — ถ้า stock = 0 ข้ามไป
            if (freeData.stock !== undefined && freeData.stock <= 0) {
              upsellMsg = `ของแถมหมดสต็อกชั่วคราว`;
            } else {
              freeItems.push({
                id: freeData.id,
                name: freeData.name,
                price: freeData.price,
                qty: freeQtyTotal,
                unit: freeData.unit,
                image: freeData.image || '',
                sku: freeData.id,
              });
              appliedPromoIds.push(`item-promo-${product.sku}`);
            }
          }
        }

        // Upsell: แสดงเฉพาะเมื่อยังซื้อไม่ครบรอบต่อไป
        if (qty % promo.minQty !== 0 && freeItems.length > 0) {
          const nextThreshold = (sets + 1) * promo.minQty;
          const remaining = nextThreshold - qty;
          upsellMsg = `ซื้อเพิ่มอีก ${remaining} ชิ้น รับของแถมอีก ${promo.freeQty || 1} ชิ้น!`;
        }
      } else if (promo.minQty) {
        const remaining = promo.minQty - qty;
        upsellMsg = `ซื้อเพิ่มอีก ${remaining} ชิ้น รับของแถมฟรี!`;
      }
      break;

    case 'DISCOUNT':
      // Quantity-based percentage discount
      if (promo.threshold && qty >= promo.threshold && promo.discountPercent) {
        discount = (product.price * qty * promo.discountPercent) / 100;
        appliedPromoIds.push(`item-promo-${product.sku}`);
        if (qty % promo.threshold !== 0) {
          const sets = Math.floor(qty / promo.threshold);
          const nextThreshold = (sets + 1) * promo.threshold;
          const remaining = nextThreshold - qty;
          upsellMsg = `ซื้อเพิ่มอีก ${remaining} ${product.unit} เพิ่มส่วนลดต่อเนื่อง!`;
        }
      } else if (promo.threshold) {
        const remaining = promo.threshold - qty;
        upsellMsg = `ซื้อเพิ่มอีก ${remaining} ${product.unit} รับส่วนลด ${promo.discountPercent}%`;
      }
      break;

    case 'BUNDLE':
      // Bundle discount
      if (promo.threshold && qty >= promo.threshold && promo.discountPercent) {
        discount = (product.price * qty * promo.discountPercent) / 100;
        appliedPromoIds.push(`item-promo-${product.sku}`);
        if (qty % promo.threshold !== 0) {
          const sets = Math.floor(qty / promo.threshold);
          const nextThreshold = (sets + 1) * promo.threshold;
          const remaining = nextThreshold - qty;
          upsellMsg = `ซื้อเพิ่มอีก ${remaining} ${product.unit} รับราคาพิเศษต่อเนื่อง!`;
        }
      } else if (promo.threshold) {
        const remaining = promo.threshold - qty;
        upsellMsg = `ซื้อเพิ่มอีก ${remaining} ${product.unit} รับราคาพิเศษ!`;
      }
      break;
  }

  return { discount, freeItems, upsellMsg, appliedPromoIds };
};

// ─── Full Cart ────────────────────────────────────────────────────────────────

/**
 * Calculate full cart with all promotions.
 *
 * @param cart           รายการสินค้าในตะกร้า
 * @param billPromotions โปรโมชั่นระดับบิลที่ active (ดึงจาก getActiveBillPromotions)
 * @param customerTier   Tier ของลูกค้า — ใช้กรองโปรฯ ที่จำกัด Tier (เช่น 50k ลด 8% สำหรับ Silver+)
 */
export const calculateCartWithPromotions = (
  cart: Array<{ product: Product; qty: number }>,
  billPromotions: BillPromotion[],
  customerTier?: string
): PromotionResult => {
  const allAppliedPromoIds: string[] = [];

  // ── Step 1: Item-level promotions ──────────────────────────────────────────
  const cartItems: CartItem[] = cart
    .filter(item => item && item.product)
    .map(item => {
      const { discount, freeItems, upsellMsg, appliedPromoIds } =
        calculateItemPromotions(item.product, item.qty);
      const total = item.product.price * item.qty - discount;

      if (appliedPromoIds.length > 0) {
        allAppliedPromoIds.push(...appliedPromoIds);
      }

      return {
        product: item.product,
        qty: item.qty,
        discount,
        total,
        freeItems: freeItems.length > 0 ? freeItems : undefined,
        upsellMsg,
        appliedPromoIds: appliedPromoIds.length > 0 ? appliedPromoIds : undefined,
      };
    });

  // ── Step 2: Subtotals ──────────────────────────────────────────────────────
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + item.discount, 0);
  const cartSubtotal = subtotal - totalDiscount; // ยอดหลังหักส่วนลดสินค้า

  // ── Step 3: Bill-level FREE_GIFT (highest tier only) ───────────────────────
  const billGifts: PromotionResult['billGifts'] = [];

  const sortedGiftPromos = [...billPromotions]
    .filter(p => p.type === 'FREE_GIFT' && p.active)
    .sort((a, b) => b.threshold - a.threshold); // สูงสุดก่อน

  for (const promo of sortedGiftPromos) {
    if (cartSubtotal >= promo.threshold && promo.reward.giftItem) {
      // D-019: Stock check for bill-level gifts ไม่ทำในที่นี้เพราะ
      // bill gifts มาจาก promotions.ts ไม่ใช่ FREE_ITEMS_DATABASE
      // (real system: ส่ง giftItem.sku ไป query stock API)
      billGifts.push({ ...promo.reward.giftItem, threshold: promo.threshold });
      allAppliedPromoIds.push(promo.id);
      break; // Highest tier only
    }
  }

  // ── Step 4: Bill-level BILL_DISCOUNT (highest qualifying tier, with tier filter) ──
  let billDiscount = 0;

  const tierOrder = [
    'Prospect', 'Member', 'Silver',
    'Gold 1', 'Gold 2',
    'Platinum 1', 'Platinum 2',
    'Diamond', 'Coronet',
  ];

  const sortedDiscountPromos = [...billPromotions]
    .filter(p => p.type === 'BILL_DISCOUNT' && p.active)
    .filter(p => {
      // กรองตาม targetTiers: ถ้าไม่ระบุ = ใช้ได้ทุก tier
      if (!p.targetTiers || p.targetTiers.length === 0) return true;
      if (!customerTier) return false; // โปรฯ มี tier gate แต่ไม่รู้ tier ลูกค้า → ข้าม
      return p.targetTiers.includes(customerTier);
    })
    .sort((a, b) => b.threshold - a.threshold); // สูงสุดก่อน

  for (const promo of sortedDiscountPromos) {
    if (cartSubtotal >= promo.threshold && promo.reward.value) {
      if (promo.reward.type === 'DISCOUNT_PERCENT') {
        billDiscount = (cartSubtotal * promo.reward.value) / 100;
      } else if (promo.reward.type === 'DISCOUNT_AMOUNT') {
        billDiscount = promo.reward.value;
      }
      allAppliedPromoIds.push(promo.id);
      break; // Highest tier only (stackable = false)
    }
  }

  return {
    cartItems,
    billGifts,
    totalDiscount,
    subtotal,
    billDiscount,
    appliedPromoIds: [...new Set(allAppliedPromoIds)], // deduplicate
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get next promotion tier info (for "ซื้ออีก X บาท รับ..." banner)
 */
export const getNextPromotionTier = (
  currentAmount: number,
  billPromotions: BillPromotion[]
): {
  nextPromo: BillPromotion | null;
  amountNeeded: number;
  progress: number;
} | null => {
  const sortedPromotions = [...billPromotions]
    .filter(p => p.type === 'FREE_GIFT')
    .sort((a, b) => a.threshold - b.threshold);

  for (const promo of sortedPromotions) {
    if (currentAmount < promo.threshold) {
      const amountNeeded = promo.threshold - currentAmount;
      const progress = (currentAmount / promo.threshold) * 100;
      return {
        nextPromo: promo,
        amountNeeded,
        progress
      };
    }
  }

  return null;
};

/**
 * Get all active bill-gift promotions that are unlocked at current amount
 * (highest tier only)
 */
export const getUnlockedPromotions = (
  currentAmount: number,
  billPromotions: BillPromotion[]
): BillPromotion[] => {
  const sortedPromotions = billPromotions
    .filter(p => p.type === 'FREE_GIFT' && currentAmount >= p.threshold)
    .sort((a, b) => b.threshold - a.threshold);

  return sortedPromotions.length > 0 ? [sortedPromotions[0]] : [];
};

/**
 * Get the best bill discount promo the customer qualifies for
 */
export const getActiveBillDiscount = (
  currentAmount: number,
  billPromotions: BillPromotion[],
  customerTier?: string
): BillPromotion | null => {
  const sortedPromotions = [...billPromotions]
    .filter(p => p.type === 'BILL_DISCOUNT' && p.active)
    .filter(p => {
      if (!p.targetTiers || p.targetTiers.length === 0) return true;
      if (!customerTier) return false;
      return p.targetTiers.includes(customerTier);
    })
    .sort((a, b) => b.threshold - a.threshold);

  for (const promo of sortedPromotions) {
    if (currentAmount >= promo.threshold) return promo;
  }

  return null;
};

/**
 * Get next BILL_DISCOUNT tier the customer hasn't reached yet
 */
export const getNextBillDiscountTier = (
  currentAmount: number,
  billPromotions: BillPromotion[],
  customerTier?: string
): { promo: BillPromotion; amountNeeded: number } | null => {
  const sortedPromotions = [...billPromotions]
    .filter(p => p.type === 'BILL_DISCOUNT' && p.active)
    .filter(p => {
      if (!p.targetTiers || p.targetTiers.length === 0) return true;
      if (!customerTier) return false;
      return p.targetTiers.includes(customerTier);
    })
    .sort((a, b) => a.threshold - b.threshold); // ต่ำสุดก่อน

  for (const promo of sortedPromotions) {
    if (currentAmount < promo.threshold) {
      return { promo, amountNeeded: promo.threshold - currentAmount };
    }
  }

  return null;
};
