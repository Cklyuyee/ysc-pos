/**
 * Customer Mock Data
 * Yongcharoen Omnichannel ERP - Customer Management System
 */

export type CustomerType = 'person' | 'company';

export type MemberTier =
  | 'Prospect'    // New customer, no completed orders yet
  | 'Member'      // First order criteria met
  | 'Silver'      // Accumulated spend > 100k THB
  | 'Gold 1'      // Accumulated spend > 300k THB
  | 'Gold 2'      // Accumulated spend > 500k THB
  | 'Platinum 1'  // Accumulated spend > 1M THB
  | 'Platinum 2'  // Accumulated spend > 2M THB
  | 'Diamond'     // Accumulated spend > 3M THB
  | 'Coronet';    // Top VIP (Highest Tier)

export type PriceTier = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export type RegistrationChannel =
  | 'Contact Center'  // LINE OA / โทรศัพท์ (ผ่าน Contact Center)
  | 'Website'         // ลงทะเบียนผ่านเว็บไซต์
  | 'Walk-in';        // เดินเข้ามาที่หน้าร้าน/สาขา

export type ShippingMethod = 'company-truck' | 'flash-express' | '3pl';

export type AddressType = 'billing' | 'shipping';

export interface Address {
  id: string;
  type: AddressType;           // Billing or Shipping address
  label: string;               // "ที่อยู่หลัก" or "สาขา"
  branchName?: string;         // e.g., "สาขาสระแก้ว"
  contactName?: string;        // recipient name on the shipping label
  phone?: string;              // recipient phone (used as the courier contact)
  address: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  shippingMethod?: string;     // e.g., "นิ่มซี่เส็ง (TRP-001)" - only for shipping addresses
  transportLine?: string;      // e.g., "สายA"
  transportContact?: string;   // e.g., "02-282-7936"
}

// Customer Behavior Types (REQ-05)
export interface CustomerBehavior {
  purchaseType: 'personal_use' | 'resale';  // ซื้อใช้เอง / ขายต่อ
  hasShop: boolean;                          // มี/ไม่มีหน้าร้าน
  likesStocking: boolean;                    // ชอบตุนของ / ไม่ตุนของ
  personality?: string;                      // อุปนิสัย (เช่น "เรื่องเยอะ", "ใจดี")
}

// Credit Limit Structure (REQ-06, REQ-07)
export interface CreditLimitDetails {
  standard: number;                          // วงเงินปกติ (ปรับปรุงโดยเจ้าหน้าที่)
  guarantees?: Array<{                       // หนังสือค้ำประกันวงเงิน (multi)
    bgNumber?: string;
    bankCode?: string;
    bankName?: string;
    bankAmount: number;
    yscApprovedAmount: number;
    issueDate?: string;
    expiryDate: string;
    documentUrl?: string;
  }>;
  group?: {                                  // วงเงินกลุ่ม (REQ-08)
    poolId: string;                          // รหัส Credit Pool
    poolName: string;                        // ชื่อกลุ่ม
    totalPoolCredit: number;                 // วงเงินกลุ่มทั้งหมด
    poolUsed: number;                        // วงเงินกลุ่มที่ใช้ไป
  };
  totalUsableCredit: number;                 // Total Usable Credit (Standard + Guarantee)
  used: number;                              // วงเงินที่ใช้ไปแล้ว
}

// Registration Documents (REQ-02)
export interface RegistrationDocuments {
  // นิติบุคคล
  companyCertificate?: {                     // หนังสือรับรอง (ไม่เกิน 3-6 เดือน)
    url: string;
    uploadDate: string;
  };
  pp20?: { url: string; uploadDate: string }; // ภ.พ.20
  pp09?: { url: string; uploadDate: string }; // ภ.พ.09 หรือใบมอบอำนาจ
  directorIdCard?: {                          // สำเนาบัตร ปชช./พาสปอร์ต กรรมการ
    url: string;
    uploadDate: string;
  };
  // บุคคลธรรมดา
  personalIdCard?: {                          // สำเนาบัตร ปชช./พาสปอร์ต
    url: string;
    uploadDate: string;
  };
}

export interface Customer {
  // Basic Information (REQ-01)
  id: string;
  code: string;
  type: CustomerType;
  name: string;
  taxId: string;

  // Personal Info (บุคคลธรรมดา)
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;           // ISO date string e.g. "1985-06-15"
  idNumber?: string;            // เลขบัตรประชาชน หรือ passport

  // Contact Information (REQ-01)
  phone: string;                              // Primary phone
  phones?: string[];                          // Multiple phone numbers
  email: string;                              // Primary email
  emails?: string[];                          // Multiple emails

  // Addresses (REQ-01) - Deprecated simple fields, use addresses array instead
  address?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  shippingMethod?: string;
  transportLine?: string;
  transportContact?: string;

  // Addresses array - New structure
  addresses?: Address[];                      // Multiple addresses (Billing & Shipping)

  // Company-specific fields
  contactPerson?: string;                     // For company type
  contactPhone?: string;                      // For company type
  branchStatus?: 'headquarters' | 'branch';   // สำนักงานใหญ่ / สาขา

  // Member & Tier (REQ-12, REQ-13)
  tier: MemberTier;
  priceTier: PriceTier;                       // Price tier (P1-P5) - REQ-01
  totalSpent: number;                         // Total accumulated spend (THB)
  rewardPoints: number;                       // Reward points (1,500 THB = 1 Point)
  pointsExpiring?: number;                    // Points expiring at end of year
  pointsExpiryDate?: string;                  // วันหมดอายุของคะแนนที่ใกล้หมด เช่น "2026-11-30"

  // Credit Management (REQ-06, REQ-07, REQ-08, REQ-09)
  creditLimit: number;                        // Legacy field - Total credit limit
  creditLimitDetails?: CreditLimitDetails;    // Detailed credit structure
  creditUsed?: number;                        // Credit used (THB)
  creditTermDays?: number;                    // Credit term (e.g., 30 days)
  graceDays?: number;                         // วันที่ผ่อนผัน (สำหรับลงวันที่เช็คล่วงหน้า)
  overdueAmount?: number;                     // Overdue payment amount (THB)
  overdueDays?: number;                       // Number of days overdue

  // Customer Behavior (REQ-05)
  behavior?: CustomerBehavior;

  // Registration & Documents (REQ-02, REQ-03)
  registrationChannel?: RegistrationChannel;
  registrationDocuments?: RegistrationDocuments;

  // Business Details
  businessType?: string;                      // ประเภทธุรกิจ
  customerGroup?: string;                     // รหัสกลุ่มลูกค้า

  // Sales & Orders
  createdAt: string;
  lastOrderAt: string | null;
  orders?: number;                            // Total number of orders
  recentOrders?: Array<{
    id: string;
    date: string;
    total: number;
    status: string;
  }>;

  // Communication & Support (REQ-21 - REQ-28)
  lastContactChannel?: 'PBX' | 'LINE' | 'Web' | 'FB' | 'IG' | 'Email';
  lineOA?: string;
  notes?: string;                             // Internal notes

  // Document Settings
  docType?: 'Y (Full VAT)' | 'N (No VAT)' | 'M (Mixed V/I)' | 'A (Abbreviated)';

  // Account status — drives credit / blacklist UI gates
  // (Common values: "active" | "suspended" | "blacklist" — kept as string so
  //  unexpected backend values still flow through without crashing the UI.)
  status?: string;

  // Sales Representative
  salesRep?: {
    name: string;
    role: string;
    initials: string;
  };

  // Profile
  avatar?: string;                            // URL รูปโปรไฟล์

  // Audit Trail (REQ-04)
  createdBy?: string;                         // ผู้สร้างข้อมูล
  updatedBy?: string;                         // ผู้แก้ไขล่าสุด
  updatedAt?: string;                         // วันที่แก้ไขล่าสุด

  // Aliases for backward compatibility
  points?: number;                            // Alias for rewardPoints
  joinDate?: string;                          // Alias for createdAt
}

// Tier Configuration (from Guidelines & REQ-12)
export const TIER_CONFIG = {
  'Prospect': {
    name: 'Prospect',
    color: '#f1f5f9',
    textColor: '#64748b',
    minSpend: 0,
    description: 'ลูกค้าใหม่ ยังไม่มีคำสั่งซื้อ',
  },
  'Member': {
    name: 'Member',
    color: '#3b82f6',
    textColor: '#ffffff',
    minSpend: 0,
    description: 'ลูกค้าที่มีคำสั่งซื้อแล้ว',
  },
  'Silver': {
    name: 'Silver',
    color: '#cbd5e1',
    textColor: '#1e293b',
    minSpend: 100000,
    description: 'ยอดซื้อสะสม > 100,000 บาท',
  },
  'Gold 1': {
    name: 'Gold 1',
    color: '#fbbf24',
    textColor: '#451a03',
    minSpend: 300000,
    description: 'ยอดซื้อสะสม > 300,000 บาท',
  },
  'Gold 2': {
    name: 'Gold 2',
    color: '#f59e0b',
    textColor: '#451a03',
    minSpend: 500000,
    description: 'ยอดซื้อสะสม > 500,000 บาท',
  },
  'Platinum 1': {
    name: 'Platinum 1',
    color: '#334155',
    textColor: '#ffffff',
    minSpend: 1000000,
    description: 'ยอดซื้อสะสม > 1,000,000 บาท',
  },
  'Platinum 2': {
    name: 'Platinum 2',
    color: '#1e293b',
    textColor: '#ffffff',
    minSpend: 2000000,
    description: 'ยอดซื้อสะสม > 2,000,000 บาท',
  },
  'Diamond': {
    name: 'Diamond',
    color: '#1e40af',
    textColor: '#ffffff',
    minSpend: 3000000,
    description: 'ยอดซื้อสะสม > 3,000,000 บาท',
  },
  'Coronet': {
    name: 'Coronet',
    color: '#7e22ce',
    textColor: '#ffffff',
    minSpend: 5000000,
    description: 'VIP สูงสุด (พิเศษ)',
  },
} as const;

/** Tier names in ascending order of minSpend
 *  ใช้คำนวณ tier progression ใน SpendingTierCard / CustomerStatsCards */
export const TIER_THRESHOLDS_SORTED: ReadonlyArray<{
  tier: keyof typeof TIER_CONFIG;
  minSpend: number;
}> = (Object.values(TIER_CONFIG) as Array<{ name: string; minSpend: number }>)
  .sort((a, b) => a.minSpend - b.minSpend)
  .map(t => ({ tier: t.name as keyof typeof TIER_CONFIG, minSpend: t.minSpend }));

// Mock Customer Data
export const MOCK_CUSTOMERS: Customer[] = [
  // ======================================================
  // ข้อมูลจากลูกค้าจริง (YMNA × P1-P5)
  // Excel: ข้อมูลลค. YMNA กับสินค้าที่อยากให้ใส่บนระบบ fig.xlsx
  // ใช้สำหรับทดสอบการคำนวณราคา/VAT ให้ถูกต้อง
  // กบเหลาดินสอ [V]: P1=75, P2=80, P3=85, P4=90, P5=100
  // เชือกคล้องคอ [I]: P1=30, P2=35, P3=40, P4=45, P5=50
  // VAT Rule: Y+I → price×1.07 | N/M/A+I → price ตรง | V → price ตรงเสมอ
  // ======================================================

  // --- GROUP Y: VAT Customers (ออกใบกำกับภาษีเต็มรูป) ---
  {
    id: 'C101',
    code: '21044',
    type: 'company',
    name: 'นอบ์พ คอร์ปอเรชั่น กรุ๊ป',
    taxId: '0105560210440',
    tier: 'Gold 1',
    priceTier: 'P2',
    docType: 'Y (Full VAT)',
    totalSpent: 320000,
    rewardPoints: 213,
    pointsExpiring: 89,
    pointsExpiryDate: '2026-11-30',
    creditLimit: 500000,
    creditUsed: 120000,
    creditTermDays: 30,
    graceDays: 5,
    overdueAmount: 0,
    creditLimitDetails: {
      standard: 300000,
      totalUsableCredit: 500000,
      used: 120000,
      guarantees: [{
        bgNumber: 'BG-2024-00099',
        bankCode: 'KBANK',
        bankName: 'ธนาคารกสิกรไทย',
        bankAmount: 200000,
        yscApprovedAmount: 200000,
        issueDate: '2024-12-31',
        expiryDate: '2026-12-31',
      }],
      group: {
        poolId: 'GRP-001',
        poolName: 'กลุ่ม ยงเจริญ โฮลดิ้ง',
        totalPoolCredit: 2000000,
        poolUsed: 850000,
      },
    },
    phone: '089-111-2044',
    contactPerson: 'คุณวิภาวดี จันทร์เพ็ง',
    email: 'order@nobpecorp.co.th',
    address: '100/44 ถนนสุขุมวิท',
    district: 'คลองเตย',
    province: 'กรุงเทพมหานคร',
    postalCode: '10110',
    shippingMethod: 'บริษัทขนส่งเอกชน',
    createdAt: '2022-06-01T08:00:00Z',
    lastOrderAt: '2026-04-01T10:00:00Z',
    orders: 45,
    registrationChannel: 'Website',
    businessType: 'นำเข้า-ส่งออก',
    lastContactChannel: 'Web',
    notes: '[Y-P2] ซื้อทั้ง V และ I — ราคา V + ราคา I × 1.07',
  },
  {
    id: 'C102',
    code: '1WS02637',
    type: 'person',
    name: 'สิราวิชญ์ ทองถาม์พรสุทธิ',
    taxId: '1234563456789',
    tier: 'Member',
    priceTier: 'P5',
    docType: 'Y (Full VAT)',
    totalSpent: 18000,
    rewardPoints: 12,
    pointsExpiring: 12,
    pointsExpiryDate: '2026-12-31',
    creditLimit: 0,
    phone: '081-263-7000',
    email: 'sirawit.t@email.com',
    address: '45/3 ถนนพระราม 2',
    district: 'บางขุนเทียน',
    province: 'กรุงเทพมหานคร',
    postalCode: '10150',
    createdAt: '2025-11-10T09:00:00Z',
    lastOrderAt: '2026-03-20T14:00:00Z',
    orders: 3,
    registrationChannel: 'Website',
    lastContactChannel: 'Web',
    notes: '[Y-P5] ซื้อสินค้า V เท่านั้น — ราคา V ตามปกติ',
    gender: 'male',
    birthDate: '1992-08-23',
    idNumber: '1100900123456',
  },
  {
    id: 'C103',
    code: '9272',
    type: 'company',
    name: 'เอ็มเอ็มโอเอเซ็นเตอร์(1994)',
    taxId: '0105537092720',
    tier: 'Platinum 1',
    priceTier: 'P1',
    docType: 'Y (Full VAT)',
    totalSpent: 1250000,
    rewardPoints: 833,
    pointsExpiring: 200,
    pointsExpiryDate: '2026-03-31',
    creditLimit: 2000000,
    creditUsed: 450000,
    creditTermDays: 45,
    phone: '092-927-2000',
    contactPerson: 'คุณประภาส ศรีวิลัย',
    email: 'purchase@mmoa1994.co.th',
    address: '88 ถนนนวมินทร์',
    district: 'บึงกุ่ม',
    province: 'กรุงเทพมหานคร',
    postalCode: '10240',
    shippingMethod: 'รถบริษัท',
    createdAt: '2020-03-15T08:00:00Z',
    lastOrderAt: '2026-04-05T09:00:00Z',
    orders: 210,
    registrationChannel: 'Walk-in',
    businessType: 'ศูนย์บริการ',
    lastContactChannel: 'LINE',
    notes: '[Y-P1] ซื้อสินค้า I เท่านั้น — ราคา I × 1.07 (VAT 7%)',
  },

  // --- GROUP N: Non-VAT / No Document ---
  {
    id: 'C104',
    code: '9384',
    type: 'company',
    name: 'บุญเลิศ วิบูรณ์ภัณฑ์',
    taxId: '0105560938400',
    tier: 'Gold 1',
    priceTier: 'P2',
    docType: 'N (No VAT)',
    totalSpent: 380000,
    rewardPoints: 253,
    pointsExpiring: 45,
    pointsExpiryDate: '2026-06-30',
    creditLimit: 300000,
    creditUsed: 90000,
    creditTermDays: 30,
    phone: '083-938-4000',
    contactPerson: 'คุณสมหญิง รักดี',
    email: 'boonlert.w@viboonphan.com',
    address: '55 ถนนลาดพร้าว',
    district: 'ลาดพร้าว',
    province: 'กรุงเทพมหานคร',
    postalCode: '10230',
    createdAt: '2021-08-20T08:00:00Z',
    lastOrderAt: '2026-04-03T11:00:00Z',
    orders: 67,
    registrationChannel: 'Contact Center',
    businessType: 'ร้านค้าเครื่องเขียน',
    lastContactChannel: 'PBX',
    notes: '[N-P2] ซื้อทั้ง V และ I — ราคา V + ราคา I ตรงๆ ไม่บวก VAT',
  },
  {
    id: 'C105',
    code: '5442',
    type: 'company',
    name: 'ศิริภัณฑ์',
    taxId: '0105540054420',
    tier: 'Silver',
    priceTier: 'P3',
    docType: 'N (No VAT)',
    totalSpent: 145000,
    rewardPoints: 96,
    pointsExpiring: 96,
    pointsExpiryDate: '2026-12-31',
    creditLimit: 100000,
    creditUsed: 30000,
    creditTermDays: 30,
    phone: '086-544-2000',
    contactPerson: 'คุณนิภา ทองดี',
    email: 'order@siriphan.com',
    address: '23 ถนนรามคำแหง',
    district: 'สะพานสูง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10250',
    createdAt: '2022-01-05T08:00:00Z',
    lastOrderAt: '2026-03-28T10:00:00Z',
    orders: 28,
    registrationChannel: 'Walk-in',
    businessType: 'ร้านค้าเครื่องเขียน',
    lastContactChannel: 'LINE',
    notes: '[N-P3] ซื้อสินค้า V เท่านั้น — ราคา V ตามปกติ',
  },
  {
    id: 'C106',
    code: '15086',
    type: 'person',
    name: 'สุรศักดิ์ แซ่ลิ้ม',
    taxId: '3150860150861',
    tier: 'Gold 2',
    priceTier: 'P1',
    docType: 'N (No VAT)',
    totalSpent: 580000,
    rewardPoints: 386,
    pointsExpiring: 120,
    pointsExpiryDate: '2026-09-30',
    creditLimit: 500000,
    creditUsed: 100000,
    creditTermDays: 30,
    phone: '081-508-6000',
    email: 'surasak.lim@email.com',
    createdAt: '2019-05-10T08:00:00Z',
    lastOrderAt: '2026-04-02T13:00:00Z',
    orders: 98,
    registrationChannel: 'Walk-in',
    lastContactChannel: 'PBX',
    notes: '[N-P1] ซื้อสินค้า I เท่านั้น — ราคา I ตรงๆ ไม่บวก VAT',
  },

  // --- GROUP M: Mixed (แยกใบกำกับตามประเภทสินค้า) ---
  {
    id: 'C107',
    code: '8366',
    type: 'company',
    name: 'อิทธิวิน',
    taxId: '0105550836600',
    tier: 'Gold 1',
    priceTier: 'P2',
    docType: 'M (Mixed V/I)',
    totalSpent: 310000,
    rewardPoints: 206,
    pointsExpiring: 67,
    pointsExpiryDate: '2026-11-30',
    creditLimit: 300000,
    creditUsed: 80000,
    creditTermDays: 30,
    phone: '091-836-6000',
    contactPerson: 'คุณอิทธิพล มั่นคง',
    email: 'order@itthawin.co.th',
    address: '45 ถนนพระราม 9',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    createdAt: '2021-04-01T08:00:00Z',
    lastOrderAt: '2026-04-04T09:30:00Z',
    orders: 52,
    registrationChannel: 'Contact Center',
    businessType: 'ร้านค้าส่ง',
    lastContactChannel: 'LINE',
    notes: '[M-P2] ซื้อทั้ง V และ I — V ออกใบกำกับ VAT, I ออกตามเอกสารแยกต่างหาก',
  },
  {
    id: 'C108',
    code: '8463',
    type: 'company',
    name: 'สมบูรณ์พานิช (ตั้งซำคุง)',
    taxId: '0105530846300',
    tier: 'Silver',
    priceTier: 'P3',
    docType: 'M (Mixed V/I)',
    totalSpent: 165000,
    rewardPoints: 110,
    pointsExpiring: 110,
    pointsExpiryDate: '2026-12-31',
    creditLimit: 150000,
    creditUsed: 40000,
    creditTermDays: 30,
    phone: '088-846-3000',
    contactPerson: 'คุณสมบูรณ์ พานิชกุล',
    email: 'somboon.panich@email.com',
    address: '12 ถนนยาวราช',
    district: 'สัมพันธวงศ์',
    province: 'กรุงเทพมหานคร',
    postalCode: '10100',
    createdAt: '2020-09-15T08:00:00Z',
    lastOrderAt: '2026-03-30T14:00:00Z',
    orders: 38,
    registrationChannel: 'Walk-in',
    businessType: 'ร้านค้าเครื่องเขียน',
    lastContactChannel: 'PBX',
    notes: '[M-P3] ซื้อสินค้า V เท่านั้น',
  },
  {
    id: 'C109',
    code: '8512',
    type: 'company',
    name: 'เจเอส เทรดดิ้ง',
    taxId: '0105550851200',
    tier: 'Gold 2',
    priceTier: 'P1',
    docType: 'M (Mixed V/I)',
    totalSpent: 510000,
    rewardPoints: 340,
    pointsExpiring: 150,
    pointsExpiryDate: '2026-12-31',
    creditLimit: 600000,
    creditUsed: 150000,
    creditTermDays: 45,
    phone: '084-851-2000',
    contactPerson: 'คุณจินดา เลิศสกุล',
    email: 'purchase@jstrading.co.th',
    address: '77 ถนนพหลโยธิน',
    district: 'จตุจักร',
    province: 'กรุงเทพมหานคร',
    postalCode: '10900',
    createdAt: '2020-01-20T08:00:00Z',
    lastOrderAt: '2026-04-06T08:00:00Z',
    orders: 115,
    registrationChannel: 'Contact Center',
    businessType: 'ค้าส่ง',
    lastContactChannel: 'LINE',
    notes: '[M-P1] ซื้อสินค้า I เท่านั้น — ออกเอกสารแยกตามประเภทสินค้า',
  },

  // --- GROUP A: Abbreviated (ใบเสร็จรับเงิน / ใบกำกับย่อ) ---
  {
    id: 'C110',
    code: '9343',
    type: 'company',
    name: 'สุรกิจ สิทธิกุลวาณิชย์',
    taxId: '0105540934300',
    tier: 'Gold 1',
    priceTier: 'P2',
    docType: 'A (Abbreviated)',
    totalSpent: 350000,
    rewardPoints: 233,
    pointsExpiring: 33,
    pointsExpiryDate: '2026-06-30',
    creditLimit: 300000,
    creditUsed: 75000,
    creditTermDays: 30,
    phone: '097-934-3000',
    contactPerson: 'คุณสุรกิจ วงษ์สกุล',
    email: 'suragit.s@email.com',
    address: '34 ถนนสีลม',
    district: 'บางรัก',
    province: 'กรุงเทพมหานคร',
    postalCode: '10500',
    createdAt: '2021-02-10T08:00:00Z',
    lastOrderAt: '2026-04-03T10:00:00Z',
    orders: 60,
    registrationChannel: 'Walk-in',
    businessType: 'ร้านค้า',
    lastContactChannel: 'LINE',
    notes: '[A-P2] ซื้อทั้ง V และ I — ออกใบกำกับย่อ ไม่บวก VAT บน I',
  },
  {
    id: 'C111',
    code: '7584',
    type: 'company',
    name: 'ท่าใหม่บุ๊คส์',
    taxId: '0105530758400',
    tier: 'Member',
    priceTier: 'P4',
    docType: 'A (Abbreviated)',
    totalSpent: 52000,
    rewardPoints: 34,
    pointsExpiring: 34,
    pointsExpiryDate: '2026-12-31',
    creditLimit: 50000,
    creditUsed: 15000,
    creditTermDays: 15,
    phone: '082-758-4004',
    contactPerson: 'คุณทวีศักดิ์ บุญธรรม',
    email: 'thammai.books@email.com',
    address: '8 ถนนท่าใหม่',
    district: 'ท่าใหม่',
    province: 'จันทบุรี',
    postalCode: '22120',
    createdAt: '2024-03-01T08:00:00Z',
    lastOrderAt: '2026-03-25T11:00:00Z',
    orders: 12,
    registrationChannel: 'Contact Center',
    businessType: 'ร้านหนังสือ/เครื่องเขียน',
    lastContactChannel: 'PBX',
    notes: '[A-P4] ซื้อสินค้า V เท่านั้น — ใบกำกับย่อ',
  },
  {
    id: 'C112',
    code: '8432',
    type: 'company',
    name: 'สันติ (เอส.พี.เซอร์วิส)',
    taxId: '0105550843200',
    tier: 'Gold 2',
    priceTier: 'P1',
    docType: 'A (Abbreviated)',
    totalSpent: 520000,
    rewardPoints: 346,
    pointsExpiring: 78,
    pointsExpiryDate: '2026-09-30',
    creditLimit: 500000,
    creditUsed: 120000,
    creditTermDays: 30,
    phone: '095-843-2000',
    contactPerson: 'คุณสันติ อินทรีย์',
    email: 'santi.spservice@email.com',
    address: '99 ถนนบางนา-ตราด',
    district: 'บางนา',
    province: 'กรุงเทพมหานคร',
    postalCode: '10260',
    createdAt: '2019-11-01T08:00:00Z',
    lastOrderAt: '2026-04-07T09:00:00Z',
    orders: 130,
    registrationChannel: 'Walk-in',
    businessType: 'ให้บริการ',
    lastContactChannel: 'PBX',
    notes: '[A-P1] ซื้อสินค้า I เท่านั้น — ใบกำกับย่อ ไม่บวก VAT',
  },
];

// =============== Price Tier Rules ===============

/**
 * ระดับราคาเริ่มต้นตามช่องทางการสมัคร
 * - Website → P5
 * - Walk-in / Contact Center → P4
 */
export function getBasePriceTierFromChannel(channel?: RegistrationChannel): PriceTier {
  if (channel === 'Website') return 'P5';
  return 'P4';
}

export const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  'P1': 'P1',
  'P2': 'P2',
  'P3': 'P3',
  'P4': 'P4',
  'P5': 'P5',
};

// =============== Helper Functions ===============

export function getAllCustomers(): Customer[] {
  return [...MOCK_CUSTOMERS];
}

export function getCustomerById(id: string): Customer | undefined {
  return MOCK_CUSTOMERS.find(c => c.id === id);
}

export function getCustomerByCode(code: string): Customer | undefined {
  return MOCK_CUSTOMERS.find(c => c.code === code);
}

export function getCustomersByTier(tier: MemberTier): Customer[] {
  return MOCK_CUSTOMERS.filter(c => c.tier === tier);
}

export function getCustomersByType(type: CustomerType): Customer[] {
  return MOCK_CUSTOMERS.filter(c => c.type === type);
}

export function searchCustomers(query: string): Customer[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllCustomers();
  return MOCK_CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    c.email.toLowerCase().includes(q)
  );
}

export function getCustomerTierStats(): Record<MemberTier, number> {
  const stats: Record<MemberTier, number> = {
    'Prospect': 0, 'Member': 0, 'Silver': 0,
    'Gold 1': 0, 'Gold 2': 0,
    'Platinum 1': 0, 'Platinum 2': 0,
    'Diamond': 0, 'Coronet': 0,
  };
  MOCK_CUSTOMERS.forEach(customer => { stats[customer.tier]++; });
  return stats;
}

export function getNewCustomersCount(): number {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return MOCK_CUSTOMERS.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;
}

export function getNewCustomersThisMonth(): number {
  return getNewCustomersCount();
}

export function getNearCreditLimitCustomersCount(): number {
  return MOCK_CUSTOMERS.filter(c => {
    if (!c.creditLimit || c.creditLimit === 0) return false;
    return ((c.creditUsed || 0) / c.creditLimit) * 100 >= 90;
  }).length;
}

export function getInactiveCustomersCount(): number {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  return MOCK_CUSTOMERS.filter(c => {
    if (!c.lastOrderAt) return true;
    return new Date(c.lastOrderAt) < ninetyDaysAgo;
  }).length;
}

export function getTotalPointsLiability(): number {
  return MOCK_CUSTOMERS.reduce((sum, c) => sum + (c.rewardPoints || 0), 0);
}

export function getTotalCustomers(): number {
  return MOCK_CUSTOMERS.length;
}

export function getActiveCustomers(): number {
  return MOCK_CUSTOMERS.filter(c => c.lastOrderAt !== null).length;
}

export function getVIPCustomers(): number {
  return MOCK_CUSTOMERS.filter(c =>
    c.tier === 'Platinum 1' || c.tier === 'Platinum 2' || c.tier === 'Diamond' || c.tier === 'Coronet'
  ).length;
}

export function getTierColor(tier: MemberTier): { bg: string; text: string } {
  const config = TIER_CONFIG[tier];
  return { bg: config.color, text: config.textColor };
}

export function calculateRewardPoints(amountSpent: number): number {
  return Math.floor(amountSpent / 1500);
}

export function calculateSpendFromPoints(points: number): number {
  return points * 1500;
}
