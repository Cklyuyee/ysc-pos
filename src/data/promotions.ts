/**
 * Yongcharoen Promotion Catalog — Single Source of Truth
 *
 * โปรโมชั่นทั้งหมดในระบบ รวม 3 กลุ่ม:
 *   1. Product-level  — ตรงกับ PROMO_MAP ใน src/app/api/mock/products.ts
 *   2. Bill-level     — ตรงกับ BILL_PROMOTIONS ใน src/app/api/mock/promotions.ts
 *   3. Brand-level    — ตรงกับ BRAND_PROMOTIONS ใน src/app/api/mock/brandPromotions.ts
 */

export type PromoType =
  | 'BUY_X_GET_Y_QTY'          // ซื้อ X แถม Y
  | 'THRESHOLD_AMOUNT'          // ช้อปครบ X บาท (บิล)
  | 'BUNDLE_ONE_PRICE'          // ชิ้นที่ N ราคาพิเศษ
  | 'VOLUME_DISCOUNT'           // ซื้อมากลดมาก
  | 'CROSS_SELL_BUNDLE'         // Bundle Set (A+B)
  | 'BRAND_THRESHOLD'           // ยอดตามแบรนด์
  | 'COUPON_CODE';              // Coupon Code (Q-017 open — เงื่อนไข stacking กับ VAT ยังไม่ได้ข้อสรุป)

export type MatchType =
  | 'SKU_IN_LIST'               // SKU ที่กำหนด
  | 'CART_SUBTOTAL'             // ยอดรวมตะกร้า
  | 'BRAND_SUBTOTAL'            // ยอดรวมตาม Brand
  | 'REQUIRED_SKU_COMBINATION'  // ต้องมี SKU ครบ
  | 'SYSTEM_EVENT'              // Event (เลขบิล, วันเกิด)
  | 'CATEGORY_IN_LIST';         // หมวดหมู่ที่กำหนด

export type RewardType =
  | 'FREE_ITEM'                 // ของแถมฟรี
  | 'FIXED_PRICE'               // ราคาคงที่
  | 'ITEM_DISCOUNT'             // ลดราคาสินค้า
  | 'BILL_DISCOUNT'             // ลดยอดบิล
  | 'MULTIPLY_POINTS';          // คูณคะแนน

export type DiscountType = 'PERCENT' | 'AMOUNT';

export type CustomerTier =
  | 'ALL'
  | 'Prospect'
  | 'Member'
  | 'Silver'
  | 'Gold 1'
  | 'Gold 2'
  | 'Platinum 1'
  | 'Platinum 2'
  | 'Diamond'
  | 'Coronet';

export interface RequiredSKU {
  SKU: string;
  Min_Qty: number;
}

export interface Conditions {
  Match_Type: MatchType;
  Target_SKUs?: string[];           // สำหรับ SKU_IN_LIST
  Target_Categories?: string[];     // สำหรับ CATEGORY_IN_LIST
  Target_Brand?: string;            // สำหรับ BRAND_SUBTOTAL
  Required_SKUs?: RequiredSKU[];    // สำหรับ REQUIRED_SKU_COMBINATION
  Exclude_SKUs?: string[];          // ยกเว้น SKU
  Minimum_Qty?: number;             // จำนวนขั้นต่ำ
  Minimum_Amount?: number;          // ยอดขั้นต่ำ
  Trigger_At_Qty?: number;          // จำนวนที่ Trigger
  Usage_Limit_Per_User?: number;    // จำกัดครั้ง/คน
  Event_Key?: string;               // Event Type
  Event_Value?: string;             // Event Value
}

export interface RewardItem {
  SKU: string;
  ProductName: string;
  Qty?: number;
  Discount_Value?: number;
  Discount_Type?: DiscountType;
  Fixed_Price_Value?: number;
}

export interface Rewards {
  Reward_Type: RewardType;
  Reward_Items?: RewardItem[];
  Discount_Value?: number;
  Discount_Type?: DiscountType;
  Max_Discount_Amount?: number;
  Multiplier_Value?: number;
}

export interface Promotion {
  Promo_ID: string;
  Promo_Name: string;
  Promo_Type: PromoType;
  Coupon_Code?: string;
  Start_Date: string;               // ISO 8601
  End_Date: string;
  Status: 'Active' | 'Inactive' | 'Expired';
  Target_Audience: CustomerTier[];
  Conditions: Conditions;
  Rewards: Rewards;
}

/**
 * โปรโมชั่นทั้งหมด — Single Source of Truth
 */
export const PROMOTIONS: Promotion[] = [

  // ══════════════════════════════════════════════════════════════════
  // กลุ่ม A: Product-level Promotions (ตรงกับ PROMO_MAP)
  // ══════════════════════════════════════════════════════════════════

  // A-1. นกฮูก กบเหลาดินสอ 2 รู No.349 — ซื้อ 2 แพ็ค แถม 1 แพ็ค
  //      → PROMO_MAP barcode: 00100175 | type: B2G1, sameSku: true
  {
    Promo_ID: 'PRM-2604-001',
    Promo_Name: 'นกฮูก กบเหลาดินสอ ซื้อ 2 แถม 1',
    Promo_Type: 'BUY_X_GET_Y_QTY',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-06-30T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['70001749'],   // Barcode: 00100175
      Minimum_Qty: 2,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70001749',
          ProductName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // A-2. เชือกคล้องคอ คลิปเหล็ก — ลด 10% เมื่อซื้อ ≥ 50 เส้น
  //      → PROMO_MAP barcode: 99804046 | type: DISCOUNT, threshold: 50
  {
    Promo_ID: 'PRM-2604-002',
    Promo_Name: 'เชือกคล้องคอ ซื้อ 50+ เส้น ลด 10%',
    Promo_Type: 'VOLUME_DISCOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['70006031'],   // Barcode: 99804046
      Minimum_Qty: 50,
    },
    Rewards: {
      Reward_Type: 'ITEM_DISCOUNT',
      Reward_Items: [
        {
          SKU: '70006031',
          ProductName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
          Discount_Value: 10,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // A-3. Champ กระดาษสีพื้น 2 สี A4 — ซื้อ 3 ห่อ แถมเชือกคล้องคอ 1 เส้น
  //      → PROMO_MAP barcodes: 30000742, 30000759, 30000766 | type: FREE_ITEM
  {
    Promo_ID: 'PRM-2604-003',
    Promo_Name: 'Champ กระดาษสีพื้น A4 ซื้อ 3 ห่อ แถมเชือกคล้องคอ',
    Promo_Type: 'BUY_X_GET_Y_QTY',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-06-30T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['40003367', '40003368', '40003369'],  // สีฟ้า สีชมพู สีเขียวอ่อน
      Minimum_Qty: 3,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70006031',
          ProductName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // A-4. แฟ้ม 3 ห่วง A4 No.205 — ซื้อ 2 ห่อ แถมนกฮูก กบเหลาดินสอ 1 แพ็ค
  //      → PROMO_MAP barcode: 29800032 | type: FREE_ITEM
  {
    Promo_ID: 'PRM-2604-004',
    Promo_Name: 'แฟ้ม 3 ห่วง A4 ซื้อ 2 ห่อ แถมกบเหลาดินสอ',
    Promo_Type: 'BUY_X_GET_Y_QTY',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-06-30T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['12152'],      // Barcode: 29800032
      Minimum_Qty: 2,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70001749',
          ProductName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // A-5. Staedtler ปากกาเขียนแผ่นใส — ลด 15%
  //      → PROMO_MAP barcodes: 4007817332313, 4007817331651, 4007817332177 | type: DISCOUNT, 15%
  {
    Promo_ID: 'PRM-2604-005',
    Promo_Name: 'Staedtler ปากกาเขียนแผ่นใส ลด 15%',
    Promo_Type: 'VOLUME_DISCOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['1691', '1740', '10011017'],  // No.318F, No.313S, No.317M (สีน้ำเงิน)
      Minimum_Qty: 1,
    },
    Rewards: {
      Reward_Type: 'ITEM_DISCOUNT',
      Reward_Items: [
        {
          SKU: '1691',
          ProductName: 'Staedtler ปากกาเขียนแผ่นใส (หลายรุ่น)',
          Discount_Value: 15,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // A-6. ชุดเครื่องเขียนสังฆทาน ชุดกลาง — ซื้อ 2 ชุด แถมชุดเล็ก 1 ชุด
  //      → PROMO_MAP barcode: 99802165 | type: B2G1, freeItemId: free-4
  {
    Promo_ID: 'PRM-2604-006',
    Promo_Name: 'ชุดสังฆทาน ชุดกลาง ซื้อ 2 แถมชุดเล็ก',
    Promo_Type: 'BUY_X_GET_Y_QTY',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-05-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['70000720'],   // Barcode: 99802165
      Minimum_Qty: 2,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70000719',
          ProductName: 'ชุดเครื่องเขียน สังฆทาน ชุดเล็ก (แพ็ค1ชุด)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // A-7. Suzuki สายกีตาร์ไฟฟ้า No.1 — ลด 5% เมื่อซื้อ ≥ 3 โหล
  //      → PROMO_MAP barcode: 01500011 | type: DISCOUNT, threshold: 3
  {
    Promo_ID: 'PRM-2604-007',
    Promo_Name: 'Suzuki สายกีตาร์ ซื้อ 3+ โหล ลด 5%',
    Promo_Type: 'VOLUME_DISCOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['1158'],       // Barcode: 01500011
      Minimum_Qty: 3,
    },
    Rewards: {
      Reward_Type: 'ITEM_DISCOUNT',
      Reward_Items: [
        {
          SKU: '1158',
          ProductName: 'Suzuki สายกีตาร์ไฟฟ้า No.1 (แพ็ค12เส้น)',
          Discount_Value: 5,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // กลุ่ม B: Bill-level Promotions (ตรงกับ BILL_PROMOTIONS)
  // ══════════════════════════════════════════════════════════════════

  // B-1. ซื้อครบ 3,000 ฿ รับชุดสังฆทาน ชุดเล็ก ฟรี
  {
    Promo_ID: 'PRM-BILL-3K',
    Promo_Name: 'ช้อปครบ 3,000 ฿ รับชุดสังฆทานเล็กฟรี',
    Promo_Type: 'THRESHOLD_AMOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 3000,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70000719',
          ProductName: 'ชุดเครื่องเขียน สังฆทาน ชุดเล็ก (แพ็ค1ชุด)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // B-2. ซื้อครบ 5,000 ฿ รับชุดสังฆทาน ชุดกลาง ฟรี
  {
    Promo_ID: 'PRM-BILL-5K',
    Promo_Name: 'ช้อปครบ 5,000 ฿ รับชุดสังฆทานกลางฟรี',
    Promo_Type: 'THRESHOLD_AMOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 5000,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70000720',
          ProductName: 'ชุดเครื่องเขียน สังฆทาน ชุดกลาง (แพ็ค1ชุด)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // B-3. ซื้อครบ 10,000 ฿ รับชุดสังฆทาน ชุดใหญ่ ฟรี
  {
    Promo_ID: 'PRM-BILL-10K',
    Promo_Name: 'ช้อปครบ 10,000 ฿ รับชุดสังฆทานใหญ่ฟรี',
    Promo_Type: 'THRESHOLD_AMOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 10000,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70000721',
          ProductName: 'ชุดเครื่องเขียน สังฆทาน ชุดใหญ่ (แพ็ค1ชุด)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // B-4. ซื้อครบ 15,000 ฿ รับ Quantum ปากกาเน้นข้อความ QH-710 โหลฟรี
  {
    Promo_ID: 'PRM-BILL-15K',
    Promo_Name: 'ช้อปครบ 15,000 ฿ รับ Quantum ปากกาเน้นข้อความ 1 โหลฟรี',
    Promo_Type: 'THRESHOLD_AMOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 15000,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '10008770',
          ProductName: 'Quantum ปากกาเน้นข้อความ QH-710 สีเหลือง (แพ็ค12ด้าม)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // B-5. ซื้อครบ 20,000 ฿ รับ MEE แผ่นอะครีลิคใส 30x30 แพ็ค20แผ่น ฟรี
  {
    Promo_ID: 'PRM-BILL-20K',
    Promo_Name: 'ช้อปครบ 20,000 ฿ รับ MEE แผ่นอะครีลิคใส แพ็คฟรี',
    Promo_Type: 'THRESHOLD_AMOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 20000,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '40003279',
          ProductName: 'MEE แผ่นอะครีลิคใส 30 x 30 ซม. หนา 1 มม. (แพ็ค20แผ่น)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // B-6. ซื้อครบ 25,000 ฿ รับส่วนลด 5%
  {
    Promo_ID: 'PRM-BILL-25K',
    Promo_Name: 'ช้อปครบ 25,000 ฿ รับส่วนลด 5%',
    Promo_Type: 'THRESHOLD_AMOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 25000,
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 5,
      Discount_Type: 'PERCENT',
    },
  },

  // B-7. ซื้อครบ 50,000 ฿ รับส่วนลด 8%
  {
    Promo_ID: 'PRM-BILL-50K',
    Promo_Name: 'ช้อปครบ 50,000 ฿ รับส่วนลด 8%',
    Promo_Type: 'THRESHOLD_AMOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['Silver', 'Gold 1', 'Gold 2', 'Platinum 1', 'Platinum 2', 'Diamond', 'Coronet'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 50000,
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 8,
      Discount_Type: 'PERCENT',
    },
  },

  // B-8. ซื้อครบ 100,000 ฿ รับส่วนลด 10%
  {
    Promo_ID: 'PRM-BILL-100K',
    Promo_Name: 'ช้อปครบ 100,000 ฿ รับส่วนลด 10%',
    Promo_Type: 'THRESHOLD_AMOUNT',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['Platinum 1', 'Platinum 2', 'Diamond', 'Coronet'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 100000,
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 10,
      Discount_Type: 'PERCENT',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // กลุ่ม C: Brand-level Promotions (ตรงกับ BRAND_PROMOTIONS)
  // ══════════════════════════════════════════════════════════════════

  // C-1. Champ ครบ 400 ฿ รับกบเหลาดินสอ นกฮูก ฟรี
  {
    Promo_ID: 'BRAND-CHAMP-400',
    Promo_Name: 'Champ ครบ ฿400 รับกบเหลาดินสอ นกฮูก ฟรี',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'Champ',
      Minimum_Amount: 400,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70001749',
          ProductName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // C-2. Champ ครบ 800 ฿ รับ Quantum ปากกาเน้นข้อความ QH-710 ฟรี 1 โหล
  {
    Promo_ID: 'BRAND-CHAMP-800',
    Promo_Name: 'Champ ครบ ฿800 รับ Quantum ปากกาเน้นข้อความ โหลฟรี',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'Champ',
      Minimum_Amount: 800,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '10008770',
          ProductName: 'Quantum ปากกาเน้นข้อความ QH-710 สีเหลือง (แพ็ค12ด้าม)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // C-3. Staedtler ครบ 600 ฿ รับส่วนลดเพิ่ม 15%
  {
    Promo_ID: 'BRAND-STAEDTLER-600',
    Promo_Name: 'Staedtler ครบ ฿600 รับส่วนลดเพิ่ม 15%',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'Staedtler',
      Minimum_Amount: 600,
    },
    Rewards: {
      Reward_Type: 'ITEM_DISCOUNT',
      Reward_Items: [
        {
          SKU: '1691',
          ProductName: 'Staedtler ปากกาเขียนแผ่นใส (ทุกรุ่น)',
          Discount_Value: 15,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // C-4. Staedtler ครบ 1,000 ฿ รับ Champ กระดาษสีพื้น A4 ฟรี 2 ห่อ
  {
    Promo_ID: 'BRAND-STAEDTLER-1K',
    Promo_Name: 'Staedtler ครบ ฿1,000 รับกระดาษสี Champ A4 ฟรี 2 ห่อ',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'Staedtler',
      Minimum_Amount: 1000,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '40003367',
          ProductName: 'Champ กระดาษสีพื้น 2 สี A4 สีฟ้า (แพ็ค50แผ่น)',
          Qty: 2,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // C-5. Quantum ครบ 300 ฿ รับกบเหลาดินสอ นกฮูก ฟรี 1 แพ็ค
  {
    Promo_ID: 'BRAND-QUANTUM-300',
    Promo_Name: 'Quantum ครบ ฿300 รับกบเหลาดินสอ นกฮูก ฟรี',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'Quantum',
      Minimum_Amount: 300,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '70001749',
          ProductName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // C-6. Quantum ครบ 700 ฿ รับส่วนลดเพิ่ม 10%
  {
    Promo_ID: 'BRAND-QUANTUM-700',
    Promo_Name: 'Quantum ครบ ฿700 รับส่วนลดเพิ่ม 10%',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'Quantum',
      Minimum_Amount: 700,
    },
    Rewards: {
      Reward_Type: 'ITEM_DISCOUNT',
      Reward_Items: [
        {
          SKU: '10011590',
          ProductName: 'Quantum ปากกา (ทุกรุ่น)',
          Discount_Value: 10,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // C-7. MEE ครบ 1,500 ฿ รับส่วนลด 8%
  {
    Promo_ID: 'BRAND-MEE-1500',
    Promo_Name: 'MEE แผ่นอะครีลิค ครบ ฿1,500 รับส่วนลด 8%',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'MEE',
      Minimum_Amount: 1500,
    },
    Rewards: {
      Reward_Type: 'ITEM_DISCOUNT',
      Reward_Items: [
        {
          SKU: '40003279',
          ProductName: 'MEE แผ่นอะครีลิคใส (ทุกขนาด)',
          Discount_Value: 8,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // กลุ่ม E: Bundle One Price — ราคาพิเศษชิ้นที่ N
  // ══════════════════════════════════════════════════════════════════

  // E-1. Quantum ปากกาเน้นข้อความ QH-710 — ซื้อ 3 โหล โหลที่ 3 ราคา 1 บาท
  {
    Promo_ID: 'BUNDLE-QUANTUM-3RD',
    Promo_Name: 'Quantum QH-710 ซื้อ 3 โหล โหลที่ 3 ราคา 1 บาท',
    Promo_Type: 'BUNDLE_ONE_PRICE',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-06-30T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['10008770'],    // Quantum ปากกาเน้นข้อความ QH-710 สีเหลือง
      Trigger_At_Qty: 3,
    },
    Rewards: {
      Reward_Type: 'FIXED_PRICE',
      Reward_Items: [
        {
          SKU: '10008770',
          ProductName: 'Quantum ปากกาเน้นข้อความ QH-710 สีเหลือง (แพ็ค12ด้าม)',
          Qty: 1,
          Fixed_Price_Value: 1,
        },
      ],
    },
  },

  // E-2. Champ กระดาษสีพื้น A4 — ซื้อ 2 ห่อ ห่อที่ 2 ลด 50%
  {
    Promo_ID: 'BUNDLE-CHAMP-2ND',
    Promo_Name: 'Champ กระดาษสีพื้น A4 ซื้อ 2 ห่อ ห่อที่ 2 ลด 50%',
    Promo_Type: 'BUNDLE_ONE_PRICE',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-05-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['Silver', 'Gold 1', 'Gold 2', 'Platinum 1', 'Platinum 2', 'Diamond', 'Coronet'],
    Conditions: {
      Match_Type: 'SKU_IN_LIST',
      Target_SKUs: ['40003367', '40003368', '40003369'],  // Champ สีฟ้า สีชมพู สีเขียวอ่อน
      Trigger_At_Qty: 2,
    },
    Rewards: {
      Reward_Type: 'ITEM_DISCOUNT',
      Reward_Items: [
        {
          SKU: '40003367',
          ProductName: 'Champ กระดาษสีพื้น 2 สี A4 (แพ็ค50แผ่น)',
          Qty: 1,
          Discount_Value: 50,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // กลุ่ม F: Cross-sell Bundle Set — ซื้อครบชุด ราคาพิเศษ
  // ══════════════════════════════════════════════════════════════════

  // F-1. Office Starter Pack: Champ กระดาษ A4 + นกฮูก กบเหลาดินสอ + เชือกคล้องคอ ลด ฿150
  {
    Promo_ID: 'BUNDLE-OFFICE-STARTER',
    Promo_Name: 'Office Starter Pack ลด ฿150',
    Promo_Type: 'CROSS_SELL_BUNDLE',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'REQUIRED_SKU_COMBINATION',
      Required_SKUs: [
        { SKU: '40003367', Min_Qty: 1 },   // Champ กระดาษสีพื้น A4 สีฟ้า
        { SKU: '70001749', Min_Qty: 1 },   // นกฮูก กบเหลาดินสอ 2 รู No.349
        { SKU: '70006031', Min_Qty: 1 },   // เชือกคล้องคอ คลิปเหล็ก สีม่วง
      ],
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 150,
      Discount_Type: 'AMOUNT',
    },
  },

  // F-2. Sangkathan Complete Set: สังฆทานกลาง + Quantum ปากกาเน้นข้อความ ลด 10%
  {
    Promo_ID: 'BUNDLE-SANGKATHAN-COMPLETE',
    Promo_Name: 'ชุดสังฆทาน Complete — ซื้อคู่ลด 10%',
    Promo_Type: 'CROSS_SELL_BUNDLE',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-06-30T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'REQUIRED_SKU_COMBINATION',
      Required_SKUs: [
        { SKU: '70000720', Min_Qty: 1 },   // ชุดเครื่องเขียน สังฆทาน ชุดกลาง
        { SKU: '10008770', Min_Qty: 1 },   // Quantum ปากกาเน้นข้อความ QH-710
      ],
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 10,
      Discount_Type: 'PERCENT',
      Max_Discount_Amount: 500,
    },
  },

  // F-3. Staedtler Pro Kit: Staedtler ปากกาเขียนแผ่นใส + MEE แผ่นอะครีลิค ลด 12%
  {
    Promo_ID: 'BUNDLE-STAEDTLER-MEE',
    Promo_Name: 'Staedtler + MEE Pro Kit ลด 12%',
    Promo_Type: 'CROSS_SELL_BUNDLE',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['Silver', 'Gold 1', 'Gold 2', 'Platinum 1', 'Platinum 2', 'Diamond', 'Coronet'],
    Conditions: {
      Match_Type: 'REQUIRED_SKU_COMBINATION',
      Required_SKUs: [
        { SKU: '1691', Min_Qty: 1 },       // Staedtler ปากกาเขียนแผ่นใส No.318F
        { SKU: '40003279', Min_Qty: 1 },   // MEE แผ่นอะครีลิคใส 30 x 30 ซม.
      ],
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 12,
      Discount_Type: 'PERCENT',
      Max_Discount_Amount: 800,
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // กลุ่ม D: Coupon Code Promotions (ตรงกับ AVAILABLE_COUPONS ใน src/data/coupons.ts)
  // ══════════════════════════════════════════════════════════════════

  // D-1. COUPON100 — ส่วนลด ฿100 เมื่อซื้อครบ ฿1,000
  {
    Promo_ID: 'CPN-100',
    Promo_Name: 'คูปองส่วนลด ฿100 (ซื้อครบ ฿1,000)',
    Promo_Type: 'COUPON_CODE',
    Coupon_Code: 'COUPON100',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-06-30T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 1000,
      Usage_Limit_Per_User: 1,
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 100,
      Discount_Type: 'AMOUNT',
    },
  },

  // D-2. COUPON300 — ส่วนลด ฿300 เมื่อซื้อครบ ฿3,000
  {
    Promo_ID: 'CPN-300',
    Promo_Name: 'คูปองส่วนลด ฿300 (ซื้อครบ ฿3,000)',
    Promo_Type: 'COUPON_CODE',
    Coupon_Code: 'COUPON300',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-06-30T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 3000,
      Usage_Limit_Per_User: 1,
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 300,
      Discount_Type: 'AMOUNT',
    },
  },

  // D-3. COUPON500 — ส่วนลด ฿500 เมื่อซื้อครบ ฿5,000
  {
    Promo_ID: 'CPN-500',
    Promo_Name: 'คูปองส่วนลด ฿500 (ซื้อครบ ฿5,000)',
    Promo_Type: 'COUPON_CODE',
    Coupon_Code: 'COUPON500',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-06-30T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 5000,
      Usage_Limit_Per_User: 1,
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 500,
      Discount_Type: 'AMOUNT',
    },
  },

  // D-4. WELCOME200 — ส่วนลด ฿200 ลูกค้าใหม่ ซื้อครบ ฿2,000
  {
    Promo_ID: 'CPN-WELCOME200',
    Promo_Name: 'คูปองต้อนรับ ฿200 (ลูกค้าใหม่ ซื้อครบ ฿2,000)',
    Promo_Type: 'COUPON_CODE',
    Coupon_Code: 'WELCOME200',
    Start_Date: '2026-01-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['Prospect', 'Member'],
    Conditions: {
      Match_Type: 'CART_SUBTOTAL',
      Minimum_Amount: 2000,
      Usage_Limit_Per_User: 1,
    },
    Rewards: {
      Reward_Type: 'BILL_DISCOUNT',
      Discount_Value: 200,
      Discount_Type: 'AMOUNT',
    },
  },

  // C-8. นกฮูก ครบ 200 ฿ รับ Quantum ปากกาลูกลื่น เจลโล่พลัส ฟรี 1 โหล
  {
    Promo_ID: 'BRAND-NOKHOOK-200',
    Promo_Name: 'นกฮูก ครบ ฿200 รับ Quantum ปากกาลูกลื่น เจลโล่พลัส ฟรี 1 โหล',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'นกฮูก',
      Minimum_Amount: 200,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '10011590',
          ProductName: 'Quantum ปากกาลูกลื่น เจลโล่พลัส ทัช No.500S 0.7 สีน้ำเงิน (แพ็ค12ด้าม)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },

  // C-10. YSC ชุดสังฆทาน ครบ 300 ฿ รับกระดาษสี Champ A4 ฟรี 1 ห่อ
  {
    Promo_ID: 'BRAND-YSC-300',
    Promo_Name: 'YSC ชุดสังฆทาน ครบ ฿300 รับกระดาษ Champ A4 ฟรี',
    Promo_Type: 'BRAND_THRESHOLD',
    Start_Date: '2026-04-01T00:00:00Z',
    End_Date: '2026-12-31T23:59:59Z',
    Status: 'Active',
    Target_Audience: ['ALL'],
    Conditions: {
      Match_Type: 'BRAND_SUBTOTAL',
      Target_Brand: 'YSC',
      Minimum_Amount: 300,
    },
    Rewards: {
      Reward_Type: 'FREE_ITEM',
      Reward_Items: [
        {
          SKU: '40003367',
          ProductName: 'Champ กระดาษสีพื้น 2 สี A4 สีฟ้า (แพ็ค50แผ่น)',
          Qty: 1,
          Discount_Value: 100,
          Discount_Type: 'PERCENT',
        },
      ],
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────────────────────

export function getPromotionById(promoId: string): Promotion | undefined {
  return PROMOTIONS.find(p => p.Promo_ID === promoId);
}

export function getPromotionByCoupon(couponCode: string): Promotion | undefined {
  return PROMOTIONS.find(p =>
    p.Promo_Type === 'COUPON_CODE' &&
    p.Coupon_Code?.toUpperCase() === couponCode.toUpperCase()
  );
}

export function getActivePromotions(now: Date = new Date()): Promotion[] {
  return PROMOTIONS.filter(p => {
    if (p.Status !== 'Active') return false;
    const start = new Date(p.Start_Date);
    const end = new Date(p.End_Date);
    return now >= start && now <= end;
  });
}

export function getPromotionsForTier(tier: CustomerTier): Promotion[] {
  const active = getActivePromotions();
  return active.filter(p =>
    p.Target_Audience.includes('ALL') || p.Target_Audience.includes(tier)
  );
}

export function getPromotionsBySKU(sku: string, tier: CustomerTier): Promotion[] {
  const promos = getPromotionsForTier(tier);
  return promos.filter(p => {
    const c = p.Conditions;
    if (c.Target_SKUs?.includes(sku)) return true;
    if (c.Required_SKUs?.some(r => r.SKU === sku)) return true;
    return false;
  });
}

export function getPromotionsByBrand(brand: string, tier: CustomerTier): Promotion[] {
  const promos = getPromotionsForTier(tier);
  return promos.filter(p => p.Conditions.Target_Brand === brand);
}

export function isPromotionActive(promo: Promotion, now: Date = new Date()): boolean {
  if (promo.Status !== 'Active') return false;
  const start = new Date(promo.Start_Date);
  const end = new Date(promo.End_Date);
  return now >= start && now <= end;
}

export function calculateDiscount(
  discount: number,
  type: DiscountType,
  amount: number,
  maxDiscount?: number
): number {
  if (type === 'AMOUNT') return discount;
  const discountAmount = (amount * discount) / 100;
  if (maxDiscount && discountAmount > maxDiscount) return maxDiscount;
  return discountAmount;
}

export function groupPromotionsByType(): Map<PromoType, Promotion[]> {
  const groups = new Map<PromoType, Promotion[]>();
  PROMOTIONS.forEach(promo => {
    if (!groups.has(promo.Promo_Type)) groups.set(promo.Promo_Type, []);
    groups.get(promo.Promo_Type)!.push(promo);
  });
  return groups;
}

export function getCouponCodes(): Promotion[] {
  return PROMOTIONS.filter(p => p.Promo_Type === 'COUPON_CODE');
}

export function getCouponPromotion(couponCode: string): Promotion | undefined {
  return getPromotionByCoupon(couponCode);
}

// ──────────────────────────────────────────────────────────────────────────────
// UI Display Constants
// (single source — import these instead of defining locally in page files)
// ──────────────────────────────────────────────────────────────────────────────

/** ป้ายกำกับสำหรับแสดงประเภทโปรโมชั่นใน UI */
export const PROMO_TYPE_LABEL: Record<PromoType, string> = {
  BUY_X_GET_Y_QTY:   'ซื้อ X แถม Y',
  THRESHOLD_AMOUNT:  'ช้อปครบรับของ',
  BUNDLE_ONE_PRICE:  'ราคาพิเศษชิ้นที่ N',
  VOLUME_DISCOUNT:   'ซื้อมากลดมาก',
  CROSS_SELL_BUNDLE: 'Bundle Set',
  BRAND_THRESHOLD:   'ยอดตามแบรนด์',
  COUPON_CODE:       'คูปอง',
};

/** Tailwind color classes สำหรับ badge แต่ละประเภทโปรโมชั่น */
export const PROMO_TYPE_COLOR: Record<PromoType, string> = {
  BUY_X_GET_Y_QTY:   'bg-pink-100 text-pink-700',
  THRESHOLD_AMOUNT:  'bg-blue-100 text-blue-700',
  BUNDLE_ONE_PRICE:  'bg-violet-100 text-violet-700',
  VOLUME_DISCOUNT:   'bg-emerald-100 text-emerald-700',
  CROSS_SELL_BUNDLE: 'bg-orange-100 text-orange-700',
  BRAND_THRESHOLD:   'bg-amber-100 text-amber-700',
  COUPON_CODE:       'bg-rose-100 text-rose-700',
};

/** ป้ายกำกับ Customer Tier ใน UI (รวม ALL สำหรับ filter) */
export const TIER_LABEL: Record<CustomerTier, string> = {
  ALL:          'ทุกระดับ',
  Prospect:     'Prospect',
  Member:       'Member',
  Silver:       'Silver',
  'Gold 1':     'Gold 1',
  'Gold 2':     'Gold 2',
  'Platinum 1': 'Platinum 1',
  'Platinum 2': 'Platinum 2',
  Diamond:      'Diamond',
  Coronet:      'Coronet',
};
