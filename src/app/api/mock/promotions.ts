/**
 * Bill-level promotions — catalog-sourced entries are derived from
 * src/data/promotions.ts via promotionAdapters. Only TIER_UPGRADE entries
 * (which are operational config, not in the marketing catalog) are static.
 */
import { deriveBillPromotions } from '../../utils/promotionAdapters';

export interface BillPromotion {
  id: string;
  type: 'BILL_DISCOUNT' | 'FREE_GIFT' | 'TIER_UPGRADE';
  name: string;
  description: string;
  threshold: number;
  reward: {
    type: 'GIFT' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'TIER_UPGRADE';
    value?: number;
    giftItem?: {
      id: string;
      name: string;
      sku: string;
      price: number;
      qty: number;
      unit: string;
      image?: string;
    };
  };
  /** ถ้าไม่ระบุ = ใช้ได้ทุก Tier */
  targetTiers?: string[];
  active: boolean;
  priority: number;
  stackable?: boolean; // true = รวมกับโปรชั้นอื่นได้
}

// ── Static TIER_UPGRADE entries (operational config — not in marketing catalog) ─
const TIER_UPGRADE_PROMOS: BillPromotion[] = [
  {
    id: 'promo-p4-offline',
    type: 'TIER_UPGRADE',
    name: 'P4 Pricing (Offline)',
    description: 'ซื้อครบ 4,000 ฿ อัพเกรดเป็นราคา P4',
    threshold: 4000,
    reward: { type: 'TIER_UPGRADE', value: 4 },
    active: true,
    priority: 100,
  },
  {
    id: 'promo-p4-online',
    type: 'TIER_UPGRADE',
    name: 'P4 Pricing (Online)',
    description: 'ซื้อครบ 10,000 ฿ อัพเกรดเป็นราคา P4',
    threshold: 10000,
    reward: { type: 'TIER_UPGRADE', value: 4 },
    active: true,
    priority: 101,
  },
];

// ── Derived from promotions.ts (THRESHOLD_AMOUNT promos) + static TIER_UPGRADE ─
export const BILL_PROMOTIONS: BillPromotion[] = [
  ...(deriveBillPromotions() as BillPromotion[]),
  ...TIER_UPGRADE_PROMOS,
];

// Product-specific promotions
export interface ProductPromotion {
  id: string;
  productId: string;
  type: 'B2G1' | 'DISCOUNT' | 'BUNDLE';
  description: string;
  minQty?: number;
  discountPercent?: number;
  freeItemId?: string;
  active: boolean;
}

export const PRODUCT_PROMOTIONS: ProductPromotion[] = [
  {
    id: 'promo-horse-b2g1',
    productId: '1',
    type: 'B2G1',
    description: 'ซื้อ 2 ฟรี 1 ',
    minQty: 2,
    freeItemId: 'free-1',
    active: true
  },
  {
    id: 'promo-doublea-discount',
    productId: '2',
    type: 'DISCOUNT',
    description: 'ซื้อครบ 5 รีม ลด 10%',
    minQty: 5,
    discountPercent: 10,
    active: true
  },
  {
    id: 'promo-stabilo-b2g1',
    productId: '4',
    type: 'B2G1',
    description: 'ซื้อ 2 แถม 1',
    minQty: 2,
    freeItemId: 'free-2',
    active: true
  },
  {
    id: 'promo-tape-bundle',
    productId: '8',
    type: 'BUNDLE',
    description: 'ซื้อ 10 ม้วน ราคาพิเศษ 250฿',
    minQty: 10,
    discountPercent: 10.7,
    active: true
  },
  {
    id: 'promo-pilot-discount',
    productId: '11',
    type: 'DISCOUNT',
    description: 'ซื้อ 12 ด้าม ลด 15%',
    minQty: 12,
    discountPercent: 15,
    active: true
  },
  {
    id: 'promo-scissors-b2g1',
    productId: '13',
    type: 'B2G1',
    description: 'ซื้อ 3 แถม 1',
    minQty: 3,
    freeItemId: 'free-3',
    active: true
  },
  {
    id: 'promo-calculator-discount',
    productId: '15',
    type: 'DISCOUNT',
    description: 'ซื้อ 3 เครื่อง ลด 20%',
    minQty: 3,
    discountPercent: 20,
    active: true
  },
  {
    id: 'promo-folder-bundle',
    productId: '17',
    type: 'BUNDLE',
    description: 'ซื้อ 50 แผ่น ราคา 500฿',
    minQty: 50,
    discountPercent: 16.67,
    active: true
  },
  {
    id: 'promo-stapler-discount',
    productId: '20',
    type: 'DISCOUNT',
    description: 'ซื้อ 2 เครื่อง ลด 25%',
    minQty: 2,
    discountPercent: 25,
    active: true
  },
  {
    id: 'promo-postit-b2g1',
    productId: '21',
    type: 'B2G1',
    description: 'ซื้อ 6 แพ็ค แถม 2',
    minQty: 6,
    freeItemId: 'free-4',
    active: true
  },
  {
    id: 'promo-pencil-discount',
    productId: '23',
    type: 'DISCOUNT',
    description: 'ซื้อ 5 กล่อง ลด 10%',
    minQty: 5,
    discountPercent: 10,
    active: true
  },
  {
    id: 'promo-punch-discount',
    productId: '25',
    type: 'DISCOUNT',
    description: 'ซื้อ 3 เครื่อง ลด 18%',
    minQty: 3,
    discountPercent: 18,
    active: true
  },
  {
    id: 'promo-sleeve-bundle',
    productId: '27',
    type: 'BUNDLE',
    description: 'ซื้อ 10 แพ็ค ราคา 1,350฿',
    minQty: 10,
    discountPercent: 10,
    active: true
  },
  {
    id: 'promo-correction-b2g1',
    productId: '30',
    type: 'B2G1',
    description: 'ซื้อ 4 แถม 1',
    minQty: 4,
    freeItemId: 'free-5',
    active: true
  },
  {
    id: 'promo-cleaner-discount',
    productId: '33',
    type: 'DISCOUNT',
    description: 'ซื้อ 6 ขวด ลด 12%',
    minQty: 6,
    discountPercent: 12,
    active: true
  },
  {
    id: 'promo-organizer-discount',
    productId: '36',
    type: 'DISCOUNT',
    description: 'ซื้อ 5 ชิ้น ลด 20%',
    minQty: 5,
    discountPercent: 20,
    active: true
  },
  {
    id: 'promo-clip-bundle',
    productId: '38',
    type: 'BUNDLE',
    description: 'ซื้อ 20 กล่อง ราคา 320฿',
    minQty: 20,
    discountPercent: 11.1,
    active: true
  },
  {
    id: 'promo-marker-b2g1',
    productId: '40',
    type: 'B2G1',
    description: 'ซื้อ 5 แถม 2',
    minQty: 5,
    freeItemId: 'free-6',
    active: true
  },
  {
    id: 'promo-whitepen-discount',
    productId: '43',
    type: 'DISCOUNT',
    description: 'ซื้อ 10 ด้าม ลด 15%',
    minQty: 10,
    discountPercent: 15,
    active: true
  },
  {
    id: 'promo-envelope-bundle',
    productId: '46',
    type: 'BUNDLE',
    description: 'ซื้อ 10 แพ็ค ราคา 1,750฿',
    minQty: 10,
    discountPercent: 10.26,
    active: true
  },
  {
    id: 'promo-whiteboard-discount',
    productId: '48',
    type: 'DISCOUNT',
    description: 'ซื้อ 3 แผ่น ลด 15%',
    minQty: 3,
    discountPercent: 15,
    active: true
  },
  {
    id: 'promo-photo-discount',
    productId: '50',
    type: 'DISCOUNT',
    description: 'ซื้อ 5 แพ็ค ลด 10%',
    minQty: 5,
    discountPercent: 10,
    active: true
  }
];

export const getActiveBillPromotions = async (): Promise<BillPromotion[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return BILL_PROMOTIONS.filter(p => p.active).sort((a, b) => a.priority - b.priority);
};

export const getProductPromotions = async (productId: string): Promise<ProductPromotion | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 30));
  return PRODUCT_PROMOTIONS.find(p => p.productId === productId && p.active);
};

export const getAllActivePromotions = async (): Promise<{
  billPromotions: BillPromotion[];
  productPromotions: ProductPromotion[];
}> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    billPromotions: BILL_PROMOTIONS.filter(p => p.active),
    productPromotions: PRODUCT_PROMOTIONS.filter(p => p.active)
  };
};