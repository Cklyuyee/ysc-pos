/**
 * Orders Mock Data
 * Yongcharoen Omnichannel ERP - Order Management System
 * Updated: test data only (C101-C112)
 */

import { calculateRewardPoints } from './customers';

export type OrderStatus =
  | 'pending'           // รอยืนยัน
  | 'confirmed'         // ยืนยันแล้ว
  | 'picking'           // กำลังหยิบสินค้า
  | 'packing'           // กำลังแพ็ค
  | 'ready-to-ship'     // พร้อมส่ง
  | 'shipped'           // จัดส่งแล้ว
  | 'delivered'         // ส่งถึงแล้ว
  | 'cancelled'         // ยกเลิก
  | 'payment-pending'   // รอชำระเงิน
  | 'credit-pending';   // รออนุมัติเครดิต

export type OrderChannel = 'online' | 'pos' | 'phone' | 'line-oa' | 'backoffice';

export type PaymentMethod =
  | 'bank-transfer'     // โอนเงิน/QR (ไม่มี Surcharge)
  | 'credit-card'       // บัตรเครดิต (+3% Surcharge)
  | 'credit-limit'      // เครดิตเทอม (B2B)
  | 'cash';             // ชำระหน้าร้าน (POS)

export type ShippingMethod =
  | 'self-pickup'       // รับเอง
  | 'company-truck'     // รถบริษัท
  | 'flash-express'     // Flash Express
  | '3pl';              // 3PL อื่นๆ

export type DocumentType =
  | 'Y'  // Full Tax Invoice (ใบกำกับภาษีเต็มรูป)
  | 'N'  // No VAT / Standard Receipt (ใบเสร็จรับเงิน)
  | 'M'  // Mixed V/I (สินค้าผสม VAT/Exempt)
  | 'A'; // Abbreviated Tax Invoice (ใบกำกับภาษีอย่างย่อ)

export type TaxType = 'V' | 'I'; // V = Vatable (7%), I = Exempt

export interface OrderItem {
  id: string;
  sku: string;
  productName: string;
  brand: string;
  category: string;
  quantity: number;
  unitPrice: number;           // ราคาต่อหน่วย (ตาม Price Tier)
  subtotal: number;            // quantity × unitPrice (หลังหัก discount แล้ว ถ้ามี)
  taxType: TaxType;            // V = Vatable, I = Exempt
  isOversize?: boolean;
  isFragile?: boolean;
  isFreeItem?: boolean;
  // Promotion fields
  discount?: number;           // ส่วนลดรวมบรรทัด — subtotal หักไว้แล้ว
  promoDesc?: string;          // ป้ายโปรโมชั่น เช่น 'ลด 8฿/แพ็ค ซื้อ 20+ แพ็ค'
  freeItems?: Array<{          // ของแถม B2G1 — ไม่ส่งผลต่อ subtotal
    sku: string;
    name: string;
    qty: number;
    unit: string;
    price: number;
  }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  status: OrderStatus;
  channel: OrderChannel;
  documentType: DocumentType;
  orderDate: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items: OrderItem[];
  totalItems: number;
  subtotal: number;
  vatAmount: number;
  shippingFee: number;
  paymentSurcharge: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'credit_reserved';
  paidAmount?: number;
  shippingMethod: ShippingMethod;
  shippingAddress: {
    address: string;
    district: string;
    province: string;
    postalCode: string;
  };
  trackingNumber?: string;
  pointsEarned: number;
  pointsUsed?: number;
  createdBy: string;
  salesRep?: string;
  notes?: string;
  internalNotes?: string;
  isUrgent?: boolean;           // ออเดอร์ด่วน — แสดงใน Handheld / Picklist / Pack queue
  // Promotion / discount fields
  couponCode?: string;
  couponDiscount?: number;      // ส่วนลดจากคูปอง (บาท)
  totalDiscount?: number;       // ส่วนลดรวมทั้งบิล
  billGifts?: Array<{           // ของแถมตามยอดบิล
    sku: string;
    name: string;
    qty: number;
    unit: string;
    price: number;
    promoId: string;
    promoName: string;
  }>;
  redeemItems?: Array<{         // ของรางวัลแลกคะแนนที่ลูกค้าเลือก จัดส่งพร้อมออเดอร์
    sku?: string;
    name: string;
    qty: number;
    unit: string;
    image?: string;
    pointsPerUnit: number;
  }>;
}

// Mock Orders — ข้อมูลจาก Excel: ข้อมูลลค. YMNA กับสินค้าที่อยากให้ใส่บนระบบ fig.xlsx
// กบเหลาดินสอ 2 รู [V] ราคา P1=75, P2=80, P3=85, P4=90, P5=100
// เชือกคล้องคอ [I]    ราคา P1=30, P2=35, P3=40, P4=45, P5=50
// Y+I → +7% VAT | N/M/A+I → no extra VAT | V → no extra VAT
export const MOCK_ORDERS: Order[] = [

  // ===== C101 [Y-P2] นอบ์พ คอร์ปอเรชั่น กรุ๊ป — ซื้อ V+I, Y customer, ด่วน (รับเอง) =====
  {
    id: 'YSC260401100000',
    orderNumber: 'YSC260401100000',
    customerId: 'C101',
    customerName: 'นอบ์พ คอร์ปอเรชั่น กรุ๊ป',
    customerTier: 'Gold 1',
    status: 'payment-pending',
    channel: 'online',
    documentType: 'Y',
    orderDate: '2026-04-01T10:00:00Z',
    confirmedAt: '2026-04-01T10:05:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 20, unitPrice: 80, subtotal: 1600, taxType: 'V',
        promoDesc: 'ลด 8฿/แพ็ค ซื้อ 20+ แพ็ค',
      },
      {
        id: 'i2', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 22, unitPrice: 35, subtotal: 770, taxType: 'I',
        promoDesc: 'ซื้อ 2 แถม 1',
        freeItems: [
          { sku: '70006031', name: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง', qty: 11, unit: 'เส้น', price: 35 },
        ],
      },
      {
        id: 'i3', sku: '40003367',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีฟ้า (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 10, unitPrice: 58.85, subtotal: 588.50, taxType: 'I',
      },
      {
        id: 'i4', sku: '70000719',
        productName: 'ชุดเครื่องเขียน สังฆทาน ชุดเล็ก (แพ็ค1ชุด)',
        brand: 'YSC', category: 'เครื่องเขียน',
        quantity: 3, unitPrice: 64, subtotal: 192, taxType: 'V',
      },
    ],
    totalItems: 55,
    subtotal: 3150.50,
    vatAmount: Math.round((770 + 588.50) * 0.07), // I products × 7% (Y customer)
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 3150.50 + Math.round((770 + 588.50) * 0.07),
    paymentMethod: 'bank-transfer',
    paymentStatus: 'pending',
    shippingMethod: 'self-pickup',
    pointsEarned: calculateRewardPoints(3150.50 + Math.round((770 + 588.50) * 0.07)),
    createdBy: 'System (Online)',
    notes: '[Y-P2] V+I — โปรลด 8฿/แพ็ค กบเหลา + B2G1 เชือกคล้องคอ 11 เส้น — ด่วน รับเองหน้าร้าน',
    isUrgent: true,
  },

  // ===== C102 [Y-P5] สิราวิชญ์ ทองถาม์พรสุทธิ — V+I, coupon SAVE200 =====
  {
    id: 'YSC260402100000',
    orderNumber: 'YSC260402100000',
    customerId: 'C102',
    customerName: 'สิราวิชญ์ ทองถาม์พรสุทธิ',
    customerTier: 'Member',
    status: 'packing',
    channel: 'online',
    documentType: 'Y',
    orderDate: '2026-04-02T10:00:00Z',
    confirmedAt: '2026-04-02T10:10:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 20, unitPrice: 100, subtotal: 2000, taxType: 'V',
      },
      {
        id: 'i2', sku: '40003368',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีชมพู (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 8, unitPrice: 62, subtotal: 496, taxType: 'I',
      },
      {
        id: 'i3', sku: '10008770',
        productName: 'Quantum ปากกาเน้นข้อความ QH-710 สีเหลือง (แพ็ค12ด้าม)',
        brand: 'Quantum', category: 'ปากกา',
        quantity: 1, unitPrice: 190, subtotal: 190, taxType: 'V',
      },
    ],
    totalItems: 29,
    subtotal: 2686,
    vatAmount: Math.round(496 * 0.07), // I products × 7% (Y customer)
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 2686 + Math.round(496 * 0.07) - 200, // หัก coupon SAVE200
    couponCode: 'SAVE200',
    couponDiscount: 200,
    totalDiscount: 200,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    paidAmount: 2686 + Math.round(496 * 0.07) - 200,
    shippingMethod: 'self-pickup',
    shippingAddress: { address: '-', district: '-', province: 'กรุงเทพมหานคร', postalCode: '-' },
    pointsEarned: calculateRewardPoints(2686 + Math.round(496 * 0.07) - 200),
    createdBy: 'System (Online)',
    notes: '[Y-P5] V+I — ใช้คูปอง SAVE200 ลด 200฿',
  },

  // ===== C103 [Y-P1] เอ็มเอ็มโอเอเซ็นเตอร์(1994) — ซื้อ I เท่านั้น =====
  {
    id: 'YSC260401110000',
    orderNumber: 'YSC260401110000',
    customerId: 'C103',
    customerName: 'เอ็มเอ็มโอเอเซ็นเตอร์(1994)',
    customerTier: 'Platinum 1',
    status: 'picking',
    channel: 'online',
    documentType: 'Y',
    orderDate: '2026-04-01T11:00:00Z',
    confirmedAt: '2026-04-01T11:05:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 96, unitPrice: 30, subtotal: 2880, taxType: 'I',
      },
    ],
    totalItems: 96,
    subtotal: 2880,
    vatAmount: 201.60,   // 2880 × 7% (Y customer + I product)
    shippingFee: 0,
    paymentSurcharge: 90.05, // 3% credit card on 3000
    grandTotal: 3090,
    paymentMethod: 'credit-card',
    paymentStatus: 'paid',
    paidAmount: 3090,
    shippingMethod: 'company-truck',
    shippingAddress: { address: '88 ถนนนวมินทร์', district: 'บึงกุ่ม', province: 'กรุงเทพมหานคร', postalCode: '10240' },
    pointsEarned: calculateRewardPoints(3090),
    createdBy: 'System (Online)',
    notes: '[Y-P1] I only — Y customer: I ราคา × 1.07, P1=30/เส้น',
  },

  // ===== C104 [N-P2] บุญเลิศ วิบูรณ์ภัณฑ์ — ซื้อ V+I, N customer =====
  {
    id: 'YSC260402090000',
    orderNumber: 'YSC260402090000',
    customerId: 'C104',
    customerName: 'บุญเลิศ วิบูรณ์ภัณฑ์',
    customerTier: 'Gold 1',
    status: 'payment-pending',
    channel: 'online',
    documentType: 'N',
    orderDate: '2026-04-02T09:00:00Z',
    confirmedAt: '2026-04-02T09:05:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 20, unitPrice: 80, subtotal: 1600, taxType: 'V',
      },
      {
        id: 'i2', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 40, unitPrice: 35, subtotal: 1400, taxType: 'I',
      },
    ],
    totalItems: 60,
    subtotal: 3000,
    vatAmount: 0,   // N customer — ไม่บวก VAT บน I
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 3000,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'pending',
    shippingMethod: 'flash-express',
    shippingAddress: { address: '55 ถนนลาดพร้าว', district: 'ลาดพร้าว', province: 'กรุงเทพมหานคร', postalCode: '10230' },
    pointsEarned: calculateRewardPoints(3000),
    createdBy: 'System (Online)',
    notes: '[N-P2] V+I — N customer: I ราคาตรง ไม่บวก VAT',
  },

  // ===== C105 [N-P3] ศิริภัณฑ์ — ซื้อ V เท่านั้น =====
  {
    id: 'YSC260328100000',
    orderNumber: 'YSC260328100000',
    customerId: 'C105',
    customerName: 'ศิริภัณฑ์',
    customerTier: 'Silver',
    status: 'delivered',
    channel: 'online',
    documentType: 'N',
    orderDate: '2026-03-28T10:00:00Z',
    confirmedAt: '2026-03-28T10:05:00Z',
    deliveredAt: '2026-03-30T14:00:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 10, unitPrice: 85, subtotal: 850, taxType: 'V',
      },
    ],
    totalItems: 10,
    subtotal: 850,
    vatAmount: 0,
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 850,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 850,
    shippingMethod: 'self-pickup',
    shippingAddress: { address: '23 ถนนรามคำแหง', district: 'สะพานสูง', province: 'กรุงเทพมหานคร', postalCode: '10250' },
    trackingNumber: undefined,
    pointsEarned: calculateRewardPoints(850),
    createdBy: 'สมศรี รักงาน',
    notes: '[N-P3] V only',
  },

  // ===== C106 [N-P1] สุรศักดิ์ แซ่ลิ้ม — ซื้อ I เท่านั้น =====
  {
    id: 'YSC260403090000',
    orderNumber: 'YSC260403090000',
    customerId: 'C106',
    customerName: 'สุรศักดิ์ แซ่ลิ้ม',
    customerTier: 'Gold 2',
    status: 'picking',
    channel: 'online',
    documentType: 'N',
    orderDate: '2026-04-03T09:00:00Z',
    confirmedAt: '2026-04-03T09:10:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 100, unitPrice: 30, subtotal: 3000, taxType: 'I',
      },
    ],
    totalItems: 100,
    subtotal: 3000,
    vatAmount: 0,   // N customer — I ราคาตรง
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 3000,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    shippingMethod: '3pl',
    shippingAddress: { address: '-', district: '-', province: 'กรุงเทพมหานคร', postalCode: '-' },
    pointsEarned: calculateRewardPoints(3000),
    createdBy: 'สมศรี รักงาน',
    notes: '[N-P1] I only — N customer: ราคาตรง P1=30/เส้น',
  },

  // ===== C107 [M-P2] อิทธิวิน — ซื้อ V+I, M customer =====
  {
    id: 'YSC260404093000',
    orderNumber: 'YSC260404093000',
    customerId: 'C107',
    customerName: 'อิทธิวิน',
    customerTier: 'Gold 1',
    status: 'pending',
    channel: 'online',
    documentType: 'M',
    orderDate: '2026-04-04T09:30:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 15, unitPrice: 80, subtotal: 1200, taxType: 'V',
      },
      {
        id: 'i2', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 30, unitPrice: 35, subtotal: 1050, taxType: 'I',
      },
    ],
    totalItems: 45,
    subtotal: 2250,
    vatAmount: 0,   // M customer: I ตามประเภทสินค้า ไม่บวก VAT
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 2250,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'pending',
    shippingMethod: 'flash-express',
    shippingAddress: { address: '45 ถนนพระราม 9', district: 'ห้วยขวาง', province: 'กรุงเทพมหานคร', postalCode: '10310' },
    pointsEarned: calculateRewardPoints(2250),
    createdBy: 'System (Online)',
    notes: '[M-P2] V+I — M customer',
  },

  // ===== C108 [M-P3] สมบูรณ์พานิช =====
  {
    id: 'YSC260330140000',
    orderNumber: 'YSC260330140000',
    customerId: 'C108',
    customerName: 'สมบูรณ์พานิช (ตั้งซำคุง)',
    customerTier: 'Silver',
    status: 'delivered',
    channel: 'phone',
    documentType: 'M',
    orderDate: '2026-03-30T14:00:00Z',
    deliveredAt: '2026-04-01T10:00:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 8, unitPrice: 85, subtotal: 680, taxType: 'V',
      },
    ],
    totalItems: 8,
    subtotal: 680,
    vatAmount: 0,
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 680,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 680,
    shippingMethod: 'self-pickup',
    shippingAddress: { address: '12 ถนนยาวราช', district: 'สัมพันธวงศ์', province: 'กรุงเทพมหานคร', postalCode: '10100' },
    pointsEarned: calculateRewardPoints(680),
    createdBy: 'สมศรี รักงาน',
    notes: '[M-P3] V only',
  },

  // ===== C109 [M-P1] เจเอส เทรดดิ้ง =====
  {
    id: 'YSC260406080000',
    orderNumber: 'YSC260406080000',
    customerId: 'C109',
    customerName: 'เจเอส เทรดดิ้ง',
    customerTier: 'Gold 2',
    status: 'picking',
    channel: 'online',
    documentType: 'M',
    orderDate: '2026-04-06T08:00:00Z',
    confirmedAt: '2026-04-06T08:05:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 120, unitPrice: 30, subtotal: 3600, taxType: 'I',
      },
    ],
    totalItems: 120,
    subtotal: 3600,
    vatAmount: 0,   // M customer: I ไม่บวก VAT
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 3600,
    paymentMethod: 'credit-limit',
    paymentStatus: 'credit_reserved',
    shippingMethod: '3pl',
    shippingAddress: { address: '77 ถนนพหลโยธิน', district: 'จตุจักร', province: 'กรุงเทพมหานคร', postalCode: '10900' },
    pointsEarned: calculateRewardPoints(3600),
    createdBy: 'สมศรี รักงาน',
    notes: '[M-P1] I only',
  },

  // ===== C110 [A-P2] สุรกิจ สิทธิกุลวาณิชย์ =====
  {
    id: 'YSC260403100000',
    orderNumber: 'YSC260403100000',
    customerId: 'C110',
    customerName: 'สุรกิจ สิทธิกุลวาณิชย์',
    customerTier: 'Gold 1',
    status: 'payment-pending',
    channel: 'online',
    documentType: 'A',
    orderDate: '2026-04-03T10:00:00Z',
    confirmedAt: '2026-04-03T10:05:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 12, unitPrice: 80, subtotal: 960, taxType: 'V',
      },
      {
        id: 'i2', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 25, unitPrice: 35, subtotal: 875, taxType: 'I',
      },
    ],
    totalItems: 37,
    subtotal: 1835,
    vatAmount: 0,   // A customer: ไม่บวก VAT บน I
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 1835,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'pending',
    shippingMethod: 'flash-express',
    shippingAddress: { address: '34 ถนนสีลม', district: 'บางรัก', province: 'กรุงเทพมหานคร', postalCode: '10500' },
    pointsEarned: calculateRewardPoints(1835),
    createdBy: 'System (Online)',
    notes: '[A-P2] V+I — A customer: ใบกำกับย่อ ไม่บวก VAT',
  },

  // ===== C111 [A-P4] ท่าใหม่บุ๊คส์ =====
  {
    id: 'YSC260325110000',
    orderNumber: 'YSC260325110000',
    customerId: 'C111',
    customerName: 'ท่าใหม่บุ๊คส์',
    customerTier: 'Member',
    status: 'delivered',
    channel: 'phone',
    documentType: 'A',
    orderDate: '2026-03-25T11:00:00Z',
    deliveredAt: '2026-03-27T14:00:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 5, unitPrice: 90, subtotal: 450, taxType: 'V',
      },
    ],
    totalItems: 5,
    subtotal: 450,
    vatAmount: 0,
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 450,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 450,
    shippingMethod: '3pl',
    shippingAddress: { address: '8 ถนนท่าใหม่', district: 'ท่าใหม่', province: 'จันทบุรี', postalCode: '22120' },
    pointsEarned: calculateRewardPoints(450),
    createdBy: 'สมศรี รักงาน',
    notes: '[A-P4] V only',
  },

  // ===== C112 [A-P1] สันติ (เอส.พี.เซอร์วิส) =====
  {
    id: 'YSC260407090000',
    orderNumber: 'YSC260407090000',
    customerId: 'C112',
    customerName: 'สันติ (เอส.พี.เซอร์วิส)',
    customerTier: 'Gold 2',
    status: 'picking',
    channel: 'online',
    documentType: 'A',
    orderDate: '2026-04-07T09:00:00Z',
    confirmedAt: '2026-04-07T09:05:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 80, unitPrice: 30, subtotal: 2400, taxType: 'I',
      },
    ],
    totalItems: 80,
    subtotal: 2400,
    vatAmount: 0,   // A customer: ไม่บวก VAT บน I
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 2400,
    paymentMethod: 'credit-limit',
    paymentStatus: 'credit_reserved',
    shippingMethod: '3pl',
    shippingAddress: { address: '99 ถนนบางนา-ตราด', district: 'บางนา', province: 'กรุงเทพมหานคร', postalCode: '10260' },
    pointsEarned: calculateRewardPoints(2400),
    createdBy: 'สมศรี รักงาน',
    notes: '[A-P1] I only — A customer ใบกำกับย่อ',
  },

  // ===== PICKING TEST — ชั้น 2+3: กระดาษสี + ชุดเครื่องเขียน (credit-limit) =====
  {
    id: 'YSC260420080000',
    orderNumber: 'YSC260420080000',
    customerId: 'C101',
    customerName: 'นอบ์พ คอร์ปอเรชั่น กรุ๊ป',
    customerTier: 'Gold 1',
    status: 'picking',
    channel: 'online',
    documentType: 'Y',
    orderDate: '2026-04-20T08:00:00Z',
    confirmedAt: '2026-04-20T08:10:00Z',
    items: [
      {
        id: 'i1', sku: '40003367',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีฟ้า (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 20, unitPrice: 58.85, subtotal: 1177, taxType: 'I',
        promoDesc: 'แถมเชือกคล้องคอ 1 เส้น/ชุด Champ กระดาษสีพื้น',
        freeItems: [
          { sku: '70006031', name: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง', qty: 1, unit: 'เส้น', price: 35 },
        ],
      },
      {
        id: 'i2', sku: '40003368',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีชมพู (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 20, unitPrice: 58.85, subtotal: 1177, taxType: 'I',
      },
      {
        id: 'i3', sku: '70000719',
        productName: 'ชุดเครื่องเขียน สังฆทาน ชุดเล็ก (แพ็ค1ชุด)',
        brand: 'YSC', category: 'เครื่องเขียน',
        quantity: 5, unitPrice: 64, subtotal: 320, taxType: 'V',
      },
    ],
    totalItems: 45,
    subtotal: 2674,
    vatAmount: Math.round(320 * 0.07),
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 2696,
    paymentMethod: 'credit-limit',
    paymentStatus: 'credit_reserved',
    shippingMethod: 'company-truck',
    shippingAddress: { address: '123 ถนนสาทร', district: 'สาทร', province: 'กรุงเทพมหานคร', postalCode: '10120' },
    pointsEarned: calculateRewardPoints(2696),
    createdBy: 'สมศรี รักงาน',
    notes: 'Picking test — ชั้น 2 (กระดาษ) + ชั้น 3 (ชุดเครื่องเขียน)',
  },

  // ===== PICKING TEST — ชั้น 3+4: ปากกาเขียนแผ่นใส + ชุดเครื่องเขียน =====
  {
    id: 'YSC260421090000',
    orderNumber: 'YSC260421090000',
    customerId: 'C104',
    customerName: 'บุญเลิศ วิบูรณ์ภัณฑ์',
    customerTier: 'Gold 1',
    status: 'picking',
    channel: 'online',
    documentType: 'N',
    orderDate: '2026-04-21T09:00:00Z',
    confirmedAt: '2026-04-21T09:05:00Z',
    items: [
      {
        id: 'i1', sku: '1691',
        productName: 'Staedtler เขียนแผ่นใส สีน้ำเงิน No.318-3F ลบไม่ได้ (แพ็ค10ด้าม)',
        brand: 'Staedtler', category: 'ปากกา',
        quantity: 3, unitPrice: 315, subtotal: 945, taxType: 'V',
      },
      {
        id: 'i2', sku: '10011019',
        productName: 'Staedtler เขียนแผ่นใส สีแดง No.317-2M ลบไม่ได้ (แพ็ค10ด้าม)',
        brand: 'Staedtler', category: 'ปากกา',
        quantity: 2, unitPrice: 315, subtotal: 630, taxType: 'V',
      },
      {
        id: 'i3', sku: '70000721',
        productName: 'ชุดเครื่องเขียน สังฆทาน ชุดใหญ่ (แพ็ค1ชุด)',
        brand: 'YSC', category: 'เครื่องเขียน',
        quantity: 3, unitPrice: 216, subtotal: 648, taxType: 'V',
      },
    ],
    totalItems: 8,
    subtotal: 2223,
    vatAmount: Math.round(2223 * 0.07),
    shippingFee: 100,
    paymentSurcharge: 0,
    grandTotal: 2478,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    paidAmount: 2478,
    shippingMethod: 'flash-express',
    shippingAddress: { address: '55/2 ถนนลาดพร้าว', district: 'ลาดพร้าว', province: 'กรุงเทพมหานคร', postalCode: '10230' },
    pointsEarned: calculateRewardPoints(2478),
    createdBy: 'สมศรี รักงาน',
    notes: 'Picking test — ชั้น 3 (Staedtler) + ชั้น 4 (ชุดใหญ่)',
  },

  // ===== PICKING TEST — ชั้น 2: กีตาร์ + กระดาษ =====
  {
    id: 'YSC260422100000',
    orderNumber: 'YSC260422100000',
    customerId: 'C106',
    customerName: 'สุรศักดิ์ แซ่ลิ้ม',
    customerTier: 'Gold 2',
    status: 'picking',
    channel: 'phone',
    documentType: 'N',
    orderDate: '2026-04-22T10:00:00Z',
    confirmedAt: '2026-04-22T10:05:00Z',
    items: [
      {
        id: 'i1', sku: '1158',
        productName: 'Suzuki สายกีตาร์ไฟฟ้า No.1 (แพ็ค12เส้น)',
        brand: 'Suzuki', category: 'ดนตรี',
        quantity: 4, unitPrice: 55, subtotal: 220, taxType: 'V',
      },
      {
        id: 'i2', sku: '40003370',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีเหลือง (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 30, unitPrice: 58.85, subtotal: 1765.50, taxType: 'I',
      },
    ],
    totalItems: 34,
    subtotal: 1985.50,
    vatAmount: Math.round(220 * 0.07),
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 2001,
    paymentMethod: 'credit-limit',
    paymentStatus: 'credit_reserved',
    shippingMethod: 'company-truck',
    shippingAddress: { address: '8/3 ถนนจรัญสนิทวงศ์', district: 'บางพลัด', province: 'กรุงเทพมหานคร', postalCode: '10700' },
    pointsEarned: calculateRewardPoints(2001),
    createdBy: 'วิภา ดีใจ',
    notes: 'Picking test — ชั้น 2 (ดนตรี + กระดาษ)',
  },

  // ===== C102 [Y-P5] สิราวิชญ์ — packed → ready-to-ship (Flash Express) =====
  {
    id: 'YSC260404150000',
    orderNumber: 'YSC260404150000',
    customerId: 'C102',
    customerName: 'สิราวิชญ์ ทองถาม์พรสุทธิ',
    customerTier: 'Member',
    status: 'ready-to-ship',
    channel: 'online',
    documentType: 'Y',
    orderDate: '2026-04-04T15:00:00Z',
    confirmedAt: '2026-04-04T15:05:00Z',
    shippedAt: undefined,
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 5, unitPrice: 100, subtotal: 500, taxType: 'V',
      },
      {
        id: 'i2', sku: '40003368',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีชมพู (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 10, unitPrice: 56, subtotal: 560, taxType: 'I',
      },
    ],
    totalItems: 15,
    subtotal: 1060,
    vatAmount: Math.round(500 * 0.07),
    shippingFee: 50,
    paymentSurcharge: 0,
    grandTotal: 1145,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    paidAmount: 1145,
    shippingMethod: 'flash-express',
    shippingAddress: { address: '45 ถนนรัชดาภิเษก', district: 'ดินแดง', province: 'กรุงเทพมหานคร', postalCode: '10400' },
    pointsEarned: calculateRewardPoints(1145),
    createdBy: 'System (Online)',
    notes: 'พร้อมส่ง — รอ Flash Express มารับ',
  },

  // ===== C103 [Y-P1] เอ็มเอ็มโอ — ready-to-ship (รับเอง) — urgent =====
  {
    id: 'YSC260405090000',
    orderNumber: 'YSC260405090000',
    customerId: 'C103',
    customerName: 'เอ็มเอ็มโอเอเซ็นเตอร์(1994)',
    customerTier: 'Platinum 1',
    status: 'ready-to-ship',
    channel: 'online',
    documentType: 'Y',
    orderDate: '2026-04-05T09:00:00Z',
    confirmedAt: '2026-04-05T09:05:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 50, unitPrice: 40, subtotal: 2000, taxType: 'I',
      },
      {
        id: 'i2', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 10, unitPrice: 90, subtotal: 900, taxType: 'V',
      },
    ],
    totalItems: 60,
    subtotal: 2900,
    vatAmount: Math.round(900 * 0.07),
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 2963,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 2963,
    shippingMethod: 'self-pickup',
    pointsEarned: calculateRewardPoints(2963),
    createdBy: 'สมศรี รักงาน',
    notes: 'ด่วน — ลูกค้ารับเองหน้าร้าน',
    isUrgent: true,
  },

  // ===== C104 [N-P2] บุญเลิศ — shipped (Flash Express, มี tracking) =====
  {
    id: 'YSC260403080000',
    orderNumber: 'YSC260403080000',
    customerId: 'C104',
    customerName: 'บุญเลิศ วิบูรณ์ภัณฑ์',
    customerTier: 'Gold 1',
    status: 'shipped',
    channel: 'online',
    documentType: 'N',
    orderDate: '2026-04-03T08:00:00Z',
    confirmedAt: '2026-04-03T08:05:00Z',
    shippedAt: '2026-04-04T14:00:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 30, unitPrice: 80, subtotal: 2400, taxType: 'V',
      },
    ],
    totalItems: 30,
    subtotal: 2400,
    vatAmount: 0,
    shippingFee: 80,
    paymentSurcharge: 0,
    grandTotal: 2480,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    paidAmount: 2480,
    shippingMethod: 'flash-express',
    shippingAddress: { address: '55/2 ถนนลาดพร้าว', district: 'ลาดพร้าว', province: 'กรุงเทพมหานคร', postalCode: '10230' },
    trackingNumber: 'TH680403001YSC',
    pointsEarned: calculateRewardPoints(2480),
    createdBy: 'System (Online)',
    notes: 'จัดส่งแล้ว',
  },

  // ===== C109 [M-P1] เจเอส เทรดดิ้ง — shipped (Kerry Express) =====
  {
    id: 'YSC260408100000',
    orderNumber: 'YSC260408100000',
    customerId: 'C109',
    customerName: 'เจเอส เทรดดิ้ง',
    customerTier: 'Gold 2',
    status: 'shipped',
    channel: 'online',
    documentType: 'M',
    orderDate: '2026-04-08T10:00:00Z',
    confirmedAt: '2026-04-08T10:05:00Z',
    shippedAt: '2026-04-09T09:00:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 100, unitPrice: 40, subtotal: 4000, taxType: 'I',
      },
      {
        id: 'i2', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 20, unitPrice: 85, subtotal: 1700, taxType: 'V',
      },
    ],
    totalItems: 120,
    subtotal: 5700,
    vatAmount: Math.round(1700 * 0.07),
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 5819,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 5819,
    shippingMethod: '3pl',
    shippingAddress: { address: '77 ถนนพหลโยธิน', district: 'จตุจักร', province: 'กรุงเทพมหานคร', postalCode: '10900' },
    trackingNumber: 'KE0409002YSC',
    pointsEarned: calculateRewardPoints(5819),
    redeemItems: [
      { sku: 'R001', name: 'หมอนปลาวาฬ', qty: 1, unit: 'ชิ้น', pointsPerUnit: 30 },
    ],
    createdBy: 'สมศรี รักงาน',
    notes: 'จัดส่งแล้ว — Kerry Express + แลกของรางวัล 30 คะแนน',
  },

  // ===================================================================
  // CONFIRMED ORDERS — ชำระแล้ว / เครดิต → รอคลังสร้างใบงาน
  // ===================================================================

  // ===== C105 [N-P3] ศิริภัณฑ์ — confirmed, bank-transfer, ชำระแล้ว =====
  {
    id: 'YSC260410090000',
    orderNumber: 'YSC260410090000',
    customerId: 'C105',
    customerName: 'ศิริภัณฑ์',
    customerTier: 'Silver',
    status: 'confirmed',
    channel: 'online',
    documentType: 'N',
    orderDate: '2026-04-10T09:00:00Z',
    confirmedAt: '2026-04-10T09:20:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 12, unitPrice: 80, subtotal: 960, taxType: 'V',
      },
      {
        id: 'i2', sku: '40003368',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีชมพู (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 20, unitPrice: 56, subtotal: 1120, taxType: 'I',
      },
    ],
    totalItems: 32,
    subtotal: 2080,
    vatAmount: Math.round(960 * 0.07),
    shippingFee: 80,
    paymentSurcharge: 0,
    grandTotal: 2227,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    paidAmount: 2227,
    shippingMethod: 'flash-express',
    shippingAddress: { address: '88 ถนนเจริญกรุง', district: 'บางรัก', province: 'กรุงเทพมหานคร', postalCode: '10500' },
    pointsEarned: calculateRewardPoints(2227),
    billGifts: [
      {
        sku: '70006031',
        name: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        qty: 5, unit: 'เส้น', price: 35,
        promoId: 'BILL-2000-GIFT',
        promoName: 'ซื้อครบ 2,000฿ รับเชือกคล้องคอฟรี 5 เส้น',
      },
    ],
    createdBy: 'System (Online)',
    notes: 'Confirmed — ชำระแล้ว รอคลังสร้างใบงาน + ของแถมตามยอดบิล',
  },

  // ===== C110 [A-P2] สุรกิจ — confirmed, credit-limit, เครดิตเทอม =====
  {
    id: 'YSC260411100000',
    orderNumber: 'YSC260411100000',
    customerId: 'C110',
    customerName: 'สุรกิจ สิทธิกุลวาณิชย์',
    customerTier: 'Gold 1',
    status: 'confirmed',
    channel: 'line-oa',
    documentType: 'A',
    orderDate: '2026-04-11T10:00:00Z',
    confirmedAt: '2026-04-11T10:10:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 60, unitPrice: 40, subtotal: 2400, taxType: 'I',
      },
      {
        id: 'i2', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 6, unitPrice: 90, subtotal: 540, taxType: 'V',
      },
    ],
    totalItems: 66,
    subtotal: 2940,
    vatAmount: Math.round(540 * 0.07),
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 2978,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 2978,
    shippingMethod: 'company-truck',
    shippingAddress: { address: '33/5 ถนนนราธิวาส', district: 'ยานนาวา', province: 'กรุงเทพมหานคร', postalCode: '10120' },
    pointsEarned: calculateRewardPoints(2978),
    createdBy: 'สมศรี รักงาน',
    notes: 'LINE OA → Confirmed, เครดิตเทอม 30 วัน',
  },

  // ===================================================================
  // PAYMENT-PENDING — อัพโหลดสลิปแล้ว รอตรวจสอบ
  // ===================================================================

  // ===== C111 [A-P4] ท่าใหม่บุ๊คส์ — payment-pending, อัพโหลดสลิปแล้ว =====
  {
    id: 'YSC260412140000',
    orderNumber: 'YSC260412140000',
    customerId: 'C111',
    customerName: 'ท่าใหม่บุ๊คส์',
    customerTier: 'Member',
    status: 'payment-pending',
    channel: 'online',
    documentType: 'A',
    orderDate: '2026-04-12T14:00:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 24, unitPrice: 100, subtotal: 2400, taxType: 'V',
      },
    ],
    totalItems: 24,
    subtotal: 2400,
    vatAmount: 0,
    shippingFee: 60,
    paymentSurcharge: 0,
    grandTotal: 2460,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'partial',     // อัพโหลดสลิปแล้ว รอตรวจสอบ → UI: pending_verification
    paidAmount: 2460,
    shippingMethod: 'flash-express',
    shippingAddress: { address: '14 ถนนอุทิศ', district: 'ท่าใหม่', province: 'จันทบุรี', postalCode: '22120' },
    pointsEarned: calculateRewardPoints(2460),
    createdBy: 'System (Online)',
    notes: 'อัพโหลดสลิปแล้ว — รอ CS ตรวจสอบ',
  },

  // ===================================================================
  // PACKING — แพ็คสินค้า
  // ===================================================================

  // ===== C108 [M-P2] สมบูรณ์พานิช — packing, phone, credit-limit =====
  {
    id: 'YSC260409110000',
    orderNumber: 'YSC260409110000',
    customerId: 'C108',
    customerName: 'สมบูรณ์พานิช (ตั้งซำคุง)',
    customerTier: 'Silver',
    status: 'packing',
    channel: 'phone',
    documentType: 'M',
    orderDate: '2026-04-09T11:00:00Z',
    confirmedAt: '2026-04-09T11:05:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 80, unitPrice: 40, subtotal: 3200, taxType: 'I',
      },
      {
        id: 'i2', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 10, unitPrice: 80, subtotal: 800, taxType: 'V',
      },
      {
        id: 'i3', sku: '40003370',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีเหลือง (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 15, unitPrice: 58.85, subtotal: 882.75, taxType: 'I',
      },
    ],
    totalItems: 105,
    subtotal: 4882.75,
    vatAmount: Math.round(800 * 0.07),
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 4939,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 4939,
    shippingMethod: 'company-truck',
    shippingAddress: { address: '241 เยาวราช', district: 'สัมพันธวงศ์', province: 'กรุงเทพมหานคร', postalCode: '10100' },
    pointsEarned: calculateRewardPoints(4939),
    createdBy: 'วิภาวี จันทร์เพ็ญ',
    notes: 'สั่งทางโทรศัพท์ — กำลังแพ็ค',
  },

  // ===== C112 [A-P3] สันติ — packing, online, bank-transfer =====
  {
    id: 'YSC260410130000',
    orderNumber: 'YSC260410130000',
    customerId: 'C112',
    customerName: 'สันติ (เอส.พี.เซอร์วิส)',
    customerTier: 'Gold 2',
    status: 'packing',
    channel: 'online',
    documentType: 'A',
    orderDate: '2026-04-10T13:00:00Z',
    confirmedAt: '2026-04-10T13:10:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 15, unitPrice: 85, subtotal: 1275, taxType: 'V',
      },
      {
        id: 'i2', sku: '40003368',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีชมพู (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 25, unitPrice: 56, subtotal: 1400, taxType: 'I',
      },
    ],
    totalItems: 40,
    subtotal: 2675,
    vatAmount: Math.round(1275 * 0.07),
    shippingFee: 100,
    paymentSurcharge: 0,
    grandTotal: 2864,
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    paidAmount: 2864,
    shippingMethod: '3pl',
    shippingAddress: { address: '56 ถนนรัชดาภิเษก', district: 'ดินแดง', province: 'กรุงเทพมหานคร', postalCode: '10400' },
    pointsEarned: calculateRewardPoints(2864),
    createdBy: 'System (Online)',
    notes: 'กำลังแพ็ค — Kerry Express',
  },

  // ===================================================================
  // READY-TO-SHIP — แพ็คเสร็จ รอขนส่งมารับ
  // ===================================================================

  // ===== C106 [N-P1] สุรศักดิ์ — ready-to-ship, 3pl (Kerry) =====
  {
    id: 'YSC260411090000',
    orderNumber: 'YSC260411090000',
    customerId: 'C106',
    customerName: 'สุรศักดิ์ แซ่ลิ้ม',
    customerTier: 'Gold 2',
    status: 'ready-to-ship',
    channel: 'online',
    documentType: 'N',
    orderDate: '2026-04-11T09:00:00Z',
    confirmedAt: '2026-04-11T09:05:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 40, unitPrice: 35, subtotal: 1400, taxType: 'I',
      },
      {
        id: 'i2', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 8, unitPrice: 80, subtotal: 640, taxType: 'V',
      },
    ],
    totalItems: 48,
    subtotal: 2040,
    vatAmount: Math.round(640 * 0.07),
    shippingFee: 120,
    paymentSurcharge: 0,
    grandTotal: 2205,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 2205,
    shippingMethod: '3pl',
    shippingAddress: { address: '8/3 ถนนจรัญสนิทวงศ์', district: 'บางพลัด', province: 'กรุงเทพมหานคร', postalCode: '10700' },
    pointsEarned: calculateRewardPoints(2205),
    createdBy: 'สมศรี รักงาน',
    notes: 'พร้อมส่ง — รอ Kerry Express มารับ',
  },

  // ===================================================================
  // SHIPPED — ส่งออกแล้ว (มี Tracking Number)
  // ===================================================================

  // ===== C111 [A-P4] ท่าใหม่บุ๊คส์ — shipped, company-truck =====
  {
    id: 'YSC260407110000',
    orderNumber: 'YSC260407110000',
    customerId: 'C111',
    customerName: 'ท่าใหม่บุ๊คส์',
    customerTier: 'Member',
    status: 'shipped',
    channel: 'phone',
    documentType: 'A',
    orderDate: '2026-04-07T11:00:00Z',
    confirmedAt: '2026-04-07T11:05:00Z',
    shippedAt: '2026-04-08T08:00:00Z',
    items: [
      {
        id: 'i1', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 36, unitPrice: 100, subtotal: 3600, taxType: 'V',
      },
      {
        id: 'i2', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 24, unitPrice: 45, subtotal: 1080, taxType: 'I',
      },
    ],
    totalItems: 60,
    subtotal: 4680,
    vatAmount: 0,
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 4680,
    paymentMethod: 'credit-limit',
    paymentStatus: 'paid',
    paidAmount: 4680,
    shippingMethod: 'company-truck',
    shippingAddress: { address: '14 ถนนอุทิศ', district: 'ท่าใหม่', province: 'จันทบุรี', postalCode: '22120' },
    trackingNumber: 'TH680408001YSC',
    pointsEarned: calculateRewardPoints(4680),
    createdBy: 'วิภาวี จันทร์เพ็ญ',
    notes: 'รถบริษัทออกแล้ว — ท่าใหม่ จันทบุรี',
  },

  // ===================================================================
  // CREDIT-PENDING — รออนุมัติเครดิต (วงเงินเกิน)
  // ===================================================================

  // ===== C109 [M-P1] เจเอส เทรดดิ้ง — credit-pending, ยอดสูงเกินวงเงิน =====
  {
    id: 'YSC260417140000',
    orderNumber: 'YSC260417140000',
    customerId: 'C109',
    customerName: 'เจเอส เทรดดิ้ง',
    customerTier: 'Gold 2',
    status: 'credit-pending',
    channel: 'online',
    documentType: 'M',
    orderDate: '2026-04-17T14:00:00Z',
    items: [
      {
        id: 'i1', sku: '70006031',
        productName: 'เชือกคล้องคอ คลิปเหล็ก สีม่วง',
        brand: '-', category: 'อุปกรณ์สำนักงาน',
        quantity: 2000, unitPrice: 40, subtotal: 80000, taxType: 'I',
      },
      {
        id: 'i2', sku: '70001749',
        productName: 'นกฮูก กบเหลาดินสอ 2 รู No.349 (แพ็ค 12 อัน)',
        brand: 'นกฮูก', category: 'เครื่องเขียน',
        quantity: 500, unitPrice: 85, subtotal: 42500, taxType: 'V',
      },
      {
        id: 'i3', sku: '40003370',
        productName: 'Champ กระดาษสีพื้น 2 สี A4 สีเหลือง (แพ็ค50แผ่น)',
        brand: 'Champ', category: 'กระดาษ',
        quantity: 300, unitPrice: 58.85, subtotal: 17655, taxType: 'I',
      },
    ],
    totalItems: 2800,
    subtotal: 140155,
    vatAmount: Math.round(42500 * 0.07),
    shippingFee: 0,
    paymentSurcharge: 0,
    grandTotal: 143130,
    paymentMethod: 'credit-limit',
    paymentStatus: 'pending',
    shippingMethod: '3pl',
    shippingAddress: { address: '77 ถนนพหลโยธิน', district: 'จตุจักร', province: 'กรุงเทพมหานคร', postalCode: '10900' },
    pointsEarned: 0,
    createdBy: 'สมศรี รักงาน',
    notes: 'สั่งสต๊อกไตรมาส 2 — ยอด ฿143,130 เกินวงเงิน ฿100,000',
    internalNotes: 'ลูกค้าขอขยายวงเงินชั่วคราว +฿85,000 เป็นระยะเวลา 1 รอบบิล รอ Credit Dept. อนุมัติ',
  },

  // ===================================================================
  // CANCELLED — ยกเลิกออเดอร์
  // ===================================================================

];

// =============== Helper Functions ===============

export function getAllOrders(): Order[] {
  return [...MOCK_ORDERS];
}

export function getOrderById(id: string): Order | undefined {
  return MOCK_ORDERS.find(o => o.id === id);
}

export function getOrdersByCustomerId(customerId: string): Order[] {
  return MOCK_ORDERS.filter(o => o.customerId === customerId);
}

export function getOrdersByStatus(status: OrderStatus): Order[] {
  return MOCK_ORDERS.filter(o => o.status === status);
}

export function getCustomerTotalRevenue(customerId: string): number {
  return MOCK_ORDERS
    .filter(o => o.customerId === customerId && o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.grandTotal, 0);
}

export function getCustomerOrdersCount(customerId: string): number {
  return MOCK_ORDERS.filter(o => o.customerId === customerId).length;
}

export function getRecentOrders(limit: number = 5): Order[] {
  return [...MOCK_ORDERS]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, limit);
}

export function getPendingOrdersCount(): number {
  return MOCK_ORDERS.filter(o =>
    o.status === 'pending' || o.status === 'payment-pending'
  ).length;
}

export function getTodayRevenue(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return MOCK_ORDERS
    .filter(o => {
      const orderDate = new Date(o.orderDate);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && o.paymentStatus === 'paid';
    })
    .reduce((sum, o) => sum + o.grandTotal, 0);
}

export function getTotalRevenue(): number {
  return MOCK_ORDERS
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.grandTotal, 0);
}

export function calculateCustomerLTV(customerId: string): {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalPointsEarned: number;
} {
  const orders = getOrdersByCustomerId(customerId);
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.grandTotal, 0);
  return {
    totalOrders: orders.length,
    totalRevenue,
    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    totalPointsEarned: orders.reduce((sum, o) => sum + o.pointsEarned, 0),
  };
}

/** Order status → label + hex colors (for inline-style rendering)
 *  Single source — ถ้าเพิ่ม/แก้ label หรือสี แก้ที่นี่ที่เดียว */
export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  // ── New SO Status Flow ────────────────────────────────────────────────────
  'draft':             { label: 'Draft · กำลังร่าง',    color: '#64748b', bgColor: '#f1f5f9' },
  'pending_approval':  { label: 'รออนุมัติ',            color: '#d97706', bgColor: '#fef3c7' },
  'pending_payment':   { label: 'รอชำระเงิน',           color: '#e11d48', bgColor: '#ffe4e6' },
  'confirmed':         { label: 'ยืนยันแล้ว',           color: '#0d9488', bgColor: '#ccfbf1' },
  'processing':        { label: 'กำลังดำเนินการ',       color: '#2563eb', bgColor: '#dbeafe' },
  'ready_to_dispatch': { label: 'รอจัดส่ง',             color: '#7c3aed', bgColor: '#ede9fe' },
  'completed':         { label: 'เสร็จสมบูรณ์',        color: '#16a34a', bgColor: '#dcfce7' },
  // ── Legacy statuses (mock data เดิม) ─────────────────────────────────────
  'pending':           { label: 'รอยืนยัน',             color: '#d97706', bgColor: '#fef3c7' },
  'picking':           { label: 'กำลังหยิบ',            color: '#2563eb', bgColor: '#dbeafe' },
  'packing':           { label: 'กำลังแพ็ค',            color: '#7c3aed', bgColor: '#ede9fe' },
  'ready-to-ship':     { label: 'พร้อมส่ง',             color: '#0891b2', bgColor: '#cffafe' },
  'shipped':           { label: 'จัดส่งแล้ว',           color: '#0284c7', bgColor: '#e0f2fe' },
  'delivered':         { label: 'ส่งถึงแล้ว',           color: '#16a34a', bgColor: '#dcfce7' },
  'cancelled':         { label: 'ยกเลิก',               color: '#dc2626', bgColor: '#fee2e2' },
  'payment-pending':   { label: 'รอชำระเงิน',           color: '#ea580c', bgColor: '#ffedd5' },
  'waiting_payment':   { label: 'รอชำระเงิน',           color: '#e11d48', bgColor: '#ffe4e6' },
  'verifying_payment': { label: 'ตรวจสอบการโอน',        color: '#d97706', bgColor: '#fef3c7' },
  'preparing_items':   { label: 'เตรียมสินค้า',         color: '#2563eb', bgColor: '#dbeafe' },
  'credit_pending':    { label: 'รออนุมัติ',            color: '#d97706', bgColor: '#fef3c7' },
  'payment_completed': { label: 'ชำระเงินเรียบร้อย',   color: '#16a34a', bgColor: '#dcfce7' },
};

/** Helper — ดึง config ด้วย status string; fallback เป็น 'pending' */
export function getOrderStatusConfig(status: string): { label: string; color: string; bgColor: string } {
  return ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG['pending'];
}
