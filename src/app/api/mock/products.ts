/**
 * Product database — PROMO_MAP is derived from the Single Source of Truth:
 *   src/data/promotions.ts  (SKU_IN_LIST promotions)
 *
 * To add / edit / deactivate a product-level promotion, update promotions.ts.
 */
import { PRODUCTS as MASTER_PRODUCTS } from '../../../data/products';
import { MOCK_ORDERS } from '../../../data/orders';
import { buildPromoMap } from '../../utils/promotionAdapters';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  prices?: {
    P1?: number;
    P2?: number;
    P3?: number;
    P4?: number;
    P5?: number; // Highest price (retail/walk-in)
  };
  barcode?: string;         // Barcode / Barcode_ID (แยกจาก sku)
  unit: string;
  tax: 'V' | 'I';
  attr: string[];
  image: string;
  stock: number;
  variant: string;
  category: string;
  brand: string;
  promo?: {
    type: 'B2G1' | 'DISCOUNT' | 'BUNDLE' | 'FREE_ITEM';
    desc: string;
    freeItemId?: string;
    sameSku?: boolean;   // true = ของแถมเป็น SKU เดียวกับสินค้าหลัก
    threshold?: number;
    discountPercent?: number;
    minQty?: number;
    freeQty?: number;
  };
  lastOrderDate?: string;
  lastOrderId?: string;
  purchaseCount?: number;
  medianQty?: number;
  preorderType?: 'out_of_stock' | 'made_to_order' | 'import';
  estimatedDays?: number; // Lead time in working days
}

// Promotion map — keyed by Barcode_ID — derived from src/data/promotions.ts
// (SKU_IN_LIST promotions only; bill-level and brand-level promos are separate)
const PROMO_MAP: Record<string, Product['promo']> = buildPromoMap() as Record<string, Product['promo']>;

// สร้าง PRODUCT_DATABASE จากข้อมูลจริงใน Master Products (Excel)
export const PRODUCT_DATABASE: Product[] = MASTER_PRODUCTS.map((p) => {
  // Auto-detect preorder: ชื่อขึ้นต้นด้วย "Pre-Order" → made_to_order
  const isPreorder = p.ProductName_TH.startsWith('Pre-Order');

  return {
    id: p.SKU_OID,
    sku: p.SKU_OID,
    barcode: p.Barcode_ID,
    name: p.ProductName_TH,
    price: p.Price_P5,
    prices: {
      P1: p.Price_P1,
      P2: p.Price_P2,
      P3: p.Price_P3,
      P4: p.Price_P4,
      P5: p.Price_P5,
    },
    unit: p.UnitName_TH,
    tax: p.Tax_Type,
    attr: [
      ...(p.Is_Oversize ? ['Oversize'] : []),
      ...(p.Is_Fragile ? ['Fragile'] : []),
    ],
    image: p.Barcode_ID ? `https://www.yongcharoen.co.th/img/product/${p.Barcode_ID.substring(0, 3)}/${p.Barcode_ID}_1.webp` : '',
    stock: p.Stock_Online,
    variant: '',
    category: p.Category_L1,
    brand: p.Brand,
    promo: PROMO_MAP[p.Barcode_ID],
    ...(isPreorder ? { preorderType: 'made_to_order' as const, estimatedDays: 14 } : {}),
  };
});

export const FREE_ITEMS_DATABASE = {
  // free-1: เชือกคล้องคอ คลิปเหล็ก สีม่วง (SKU: 70006031 | Barcode: 99804046)
  'free-1': {
    id: 'free-1',
    name: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
    price: 50,
    unit: 'เส้น',
    image: 'https://www.yongcharoen.co.th/img/product/998/99804046_1.webp',
    stock: 500,   // D-019: ตรวจสต็อกก่อนแจก
  },
  // free-2: เชือกคล้องคอ คลิปเหล็ก สีม่วง (SKU: 70006031 | Barcode: 99804046) — ของแถมกับ Champ กระดาษสีพื้น
  'free-2': {
    id: 'free-2',
    name: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
    price: 50,
    unit: 'เส้น',
    image: 'https://www.yongcharoen.co.th/img/product/998/99804046_1.webp',
    stock: 500,
  },
  // free-3: นกฮูก กบเหลาดินสอ 2 รู No.349 (SKU: 70001749 | Barcode: 00100175) — ของแถมกับ แฟ้ม 3 ห่วง
  'free-3': {
    id: 'free-3',
    name: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
    price: 100,
    unit: 'แพ็ค',
    image: 'https://www.yongcharoen.co.th/img/product/001/00100175_1.webp',
    stock: 200,
  },
  // free-4: ชุดเครื่องเขียน สังฆทาน ชุดเล็ก (SKU: 70000719 | Barcode: 99802158) — ของแถมกับ ชุดสังฆทานกลาง
  'free-4': {
    id: 'free-4',
    name: 'ชุดเครื่องเขียน สังฆทาน ชุดเล็ก (แพ็ค1ชุด)',
    price: 90,
    unit: 'ชุด',
    image: 'https://www.yongcharoen.co.th/img/product/998/99802158_1.webp',
    stock: 150,
  },
  // free-5: Quantum ปากกาเน้นข้อความ QH-710 สีเหลือง (SKU: 10008770 | Barcode: 18851907107335)
  'free-5': {
    id: 'free-5',
    name: 'Quantum ปากกาเน้นข้อความ QH-710 สีเหลือง (แพ็ค12ด้าม)',
    price: 170,
    unit: 'โหล',
    image: 'https://www.yongcharoen.co.th/img/product/188/18851907107335_1.webp',
    stock: 80,
  },
  // free-6: Staedtler เขียนแผ่นใส 4 สี No.318 F ลบไม่ได้ (SKU: 1695 | Barcode: 4007817310809)
  'free-6': {
    id: 'free-6',
    name: 'Staedtler เขียนแผ่นใส 4 สี No.318 F ลบไม่ได้ (แพ็ค4ด้าม)',
    price: 160,
    unit: 'ชุด',
    image: 'https://www.yongcharoen.co.th/img/product/400/4007817310809_1.webp',
    stock: 60,
  },
};

// ──────────────────────────────────────────────
// Mock Pre-order Products
// ──────────────────────────────────────────────
export const PREORDER_PRODUCTS: Product[] = [
  // ── out_of_stock: ข้อมูลจาก real API (stockQty = 0) ──────────────────────
  {
    id: 'PRE-001', sku: '70009919', barcode: '6954851213741',
    name: 'Remax แบตสำรอง Power Bank 5000mAh Type-C RPP-632',
    price: 364, prices: { P1: 300, P2: 320, P3: 340, P4: 355, P5: 364 },
    unit: 'อัน', tax: 'V', attr: [],
    image: 'https://www.yongcharoen.co.th/img/product/695/6954851213741_1.webp',
    stock: 0, variant: 'สีม่วง', category: 'อิเล็กทรอนิกส์', brand: 'Remax',
    preorderType: 'out_of_stock', estimatedDays: 7,
  },
  {
    id: 'PRE-002', sku: '70007658', barcode: '8858702094719',
    name: 'COMAX ชุดน้ำหมึกเติมสำหรับแคนนอน ชุด 4 สี + กระดาษ',
    price: 465, prices: { P1: 380, P2: 400, P3: 420, P4: 445, P5: 465 },
    unit: 'ชุด', tax: 'V', attr: [],
    image: 'https://www.yongcharoen.co.th/img/product/885/8858702094719_1.webp',
    stock: 0, variant: '', category: 'หมึกพิมพ์', brand: 'COMAX',
    preorderType: 'out_of_stock', estimatedDays: 5,
  },
  {
    id: 'PRE-003', sku: '70007919', barcode: '6954851247753',
    name: 'Remax หูฟังบลูทูธ Alloy Buds M6',
    price: 489, prices: { P1: 400, P2: 420, P3: 445, P4: 465, P5: 489 },
    unit: 'อัน', tax: 'V', attr: [],
    image: 'https://www.yongcharoen.co.th/img/product/695/6954851247753_1.webp',
    stock: 0, variant: 'สีดำ', category: 'อิเล็กทรอนิกส์', brand: 'Remax',
    preorderType: 'out_of_stock', estimatedDays: 7,
  },
  // ── made_to_order: สั่งผลิตพิเศษ ─────────────────────────────────────────
  {
    id: 'PRE-004', sku: 'PRE-004',
    name: 'ตรายางชื่อบริษัท (สั่งทำพิเศษ)',
    price: 450, prices: { P1: 380, P2: 390, P3: 400, P4: 420, P5: 450 },
    unit: 'อัน', tax: 'V', attr: [],
    image: '', stock: 0,
    variant: 'พิมพ์ชื่อ+ที่อยู่', category: 'ตรายาง', brand: 'Made to Order',
    preorderType: 'made_to_order', estimatedDays: 14,
  },
  // ── import: สินค้านำเข้า ──────────────────────────────────────────────────
  {
    id: 'PRE-005', sku: 'PRE-005',
    name: 'เก้าอี้ Ergonomic Herman Miller Aeron (นำเข้า USA)',
    price: 89000, prices: { P1: 78000, P2: 80000, P3: 82000, P4: 85000, P5: 89000 },
    unit: 'ตัว', tax: 'V', attr: ['Oversize', 'Fragile'],
    image: '', stock: 0,
    variant: 'สี Graphite / ขนาด B', category: 'เฟอร์นิเจอร์', brand: 'Herman Miller',
    preorderType: 'import', estimatedDays: 60,
  },
];

// Combined product database (includes pre-order products)
export const ALL_PRODUCTS: Product[] = [...PRODUCT_DATABASE.map(p => ({ ...p })), ...PREORDER_PRODUCTS];

// Mock API Functions
export const searchProducts = async (query: string, category?: string): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 80));
  let results = ALL_PRODUCTS;

  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }

  if (query.trim()) {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    results = results.filter(p => {
      const searchableText = [
        p.name, p.sku, p.barcode ?? '', p.brand, p.variant ?? '', p.category ?? '',
      ].join(' ').toLowerCase();
      return tokens.every(token => searchableText.includes(token));
    });
  }

  return results;
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return PRODUCT_DATABASE.find(p => p.id === id);
};

export const getProductsBySku = async (sku: string): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return PRODUCT_DATABASE.filter(p => p.sku.toLowerCase().includes(sku.toLowerCase()));
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  if (category === 'all') return PRODUCT_DATABASE;
  return PRODUCT_DATABASE.filter(p => p.category === category);
};

/**
 * สินค้าที่ลูกค้าซื้อล่าสุด — derive จาก MOCK_ORDERS (single source of truth)
 */
export const getCustomerRecentPurchases = async (customerId: string): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 150));

  // เรียง order ใหม่ → เก่า แล้ว flatten items เก็บเฉพาะ SKU แรกที่เจอ (distinct)
  const customerOrders = MOCK_ORDERS
    .filter(o => o.customerId === customerId && o.status !== 'cancelled')
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  const seenSkus = new Set<string>();
  const result: Product[] = [];

  for (const order of customerOrders) {
    for (const item of order.items) {
      if (seenSkus.has(item.sku)) continue;
      seenSkus.add(item.sku);
      const product = PRODUCT_DATABASE.find(p => p.sku === item.sku);
      if (product) {
        result.push({ ...product, lastOrderDate: order.orderDate, lastOrderId: order.id });
      }
      if (result.length >= 10) break;
    }
    if (result.length >= 10) break;
  }

  return result;
};

/**
 * Top 10 สินค้าที่ลูกค้าซื้อประจำ (CC-05) — sort by purchase frequency,
 * เก็บ median qty ต่อ order, จำกัดประวัติย้อนหลัง 6 เดือน
 */
export const getCustomerFrequentPurchases = async (customerId: string): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 150));

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);

  const skuQtys = new Map<string, number[]>();
  MOCK_ORDERS
    .filter(o => o.customerId === customerId && o.status !== 'cancelled' && new Date(o.orderDate) >= cutoff)
    .forEach(order => {
      order.items.forEach(item => {
        const arr = skuQtys.get(item.sku) ?? [];
        arr.push(item.quantity);
        skuQtys.set(item.sku, arr);
      });
    });

  const median = (nums: number[]): number => {
    const sorted = [...nums].sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return 0;
    return n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  };

  return Array.from(skuQtys.entries())
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10)
    .map(([sku, qtys]) => {
      const product = PRODUCT_DATABASE.find(p => p.sku === sku);
      return product ? { ...product, purchaseCount: qtys.length, medianQty: median(qtys) } : null;
    })
    .filter((p): p is Product => p !== null);
};

/**
 * Get product price based on customer's price tier
 */
export const getProductPrice = (product: Product, priceTier: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' = 'P5'): number => {
  if (product.prices && product.prices[priceTier] !== undefined) {
    return product.prices[priceTier]!;
  }
  return product.price;
};

/**
 * Apply product with correct price tier to cart
 */
export const applyPriceTier = (product: Product, priceTier: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' = 'P5'): Product => {
  return {
    ...product,
    price: getProductPrice(product, priceTier)
  };
};
