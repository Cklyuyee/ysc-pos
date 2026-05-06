/**
 * YSC POS — Mock API Service (Slim)
 * เฉพาะ API ที่ POS ใช้: Customers, Rewards, Coupons
 * TODO: เปลี่ยนเป็น real API เมื่อ backend พร้อม
 */

import { MOCK_CUSTOMERS, type Customer } from '../data/customers';

// ─── Helpers ────────────────────────────────────────────────────────────────

const delay = (ms = 200): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const logApiCall = (endpoint: string, method: string, data?: any) => {
  console.log(`[POS API] ${method} ${endpoint}`, data || '');
};

class ApiError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Customers API ──────────────────────────────────────────────────────────

export const CustomersAPI = {
  async getAll(params?: {
    tier?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ customers: Customer[]; total: number }> {
    await delay();
    logApiCall('/customers', 'GET', params);

    let customers = [...MOCK_CUSTOMERS];

    if (params?.tier) {
      customers = customers.filter(c => c.tier === params.tier);
    }

    if (params?.search) {
      const query = params.search.toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }

    const total = customers.length;

    if (params?.offset !== undefined && params?.limit !== undefined) {
      customers = customers.slice(params.offset, params.offset + params.limit);
    }

    return { customers, total };
  },

  async getById(id: string): Promise<Customer | null> {
    await delay();
    logApiCall(`/customers/${id}`, 'GET');
    return MOCK_CUSTOMERS.find(c => c.id === id) || null;
  },

  async search(query: string): Promise<Customer[]> {
    await delay();
    logApiCall('/customers/search', 'GET', { query });

    const lowerQuery = query.toLowerCase();
    return MOCK_CUSTOMERS.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.code.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query) ||
      c.email.toLowerCase().includes(lowerQuery)
    );
  },

  async create(data: Partial<Customer>): Promise<Customer> {
    await delay(500);
    logApiCall('/customers', 'POST', data);

    const newCustomer: Customer = {
      id: `CUS-${Date.now()}`,
      code: `C${String(MOCK_CUSTOMERS.length + 1).padStart(5, '0')}`,
      type: data.type || 'person',
      name: data.name || '',
      taxId: data.taxId || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      district: data.district || '',
      province: data.province || '',
      postalCode: data.postalCode || '',
      tier: 'Prospect',
      priceTier: 'P5',
      totalSpent: 0,
      rewardPoints: 0,
      creditLimit: 0,
      createdAt: new Date().toISOString(),
      lastOrderAt: null,
      ...data,
    };

    return newCustomer;
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    await delay(500);
    logApiCall(`/customers/${id}`, 'PUT', data);
    const customer = MOCK_CUSTOMERS.find(c => c.id === id);
    if (!customer) throw new ApiError('NOT_FOUND', 404, 'Customer not found');
    return { ...customer, ...data };
  },
};

// ─── Rewards API ────────────────────────────────────────────────────────────

interface OrderReward {
  threshold: number;
  reward: string;
  description: string;
}

const ORDER_REWARDS: OrderReward[] = [
  { threshold: 500,   reward: 'ปากกา YSC',       description: 'ซื้อครบ 500 ฿ รับปากกา YSC' },
  { threshold: 1000,  reward: 'กระเป๋าผ้า YSC',   description: 'ซื้อครบ 1,000 ฿ รับกระเป๋าผ้า' },
  { threshold: 3000,  reward: 'ร่ม YSC',          description: 'ซื้อครบ 3,000 ฿ รับร่ม YSC' },
  { threshold: 5000,  reward: 'กระบอกน้ำ YSC',    description: 'ซื้อครบ 5,000 ฿ รับกระบอกน้ำ' },
  { threshold: 10000, reward: 'ชุดเครื่องเขียน Premium', description: 'ซื้อครบ 10,000 ฿ รับชุดเครื่องเขียน' },
];

export const RewardsAPI = {
  async getAll(): Promise<OrderReward[]> {
    await delay();
    logApiCall('/rewards', 'GET');
    return ORDER_REWARDS;
  },

  async getByOrderTotal(total: number): Promise<OrderReward[]> {
    await delay();
    logApiCall('/rewards/by-order-total', 'GET', { total });
    return ORDER_REWARDS.filter(r => total >= r.threshold);
  },
};

// ─── Coupons API ────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  discount: number;
  maxDiscount?: number;
  minPurchase: number;
  validFrom: string;
  validUntil: string;
  remaining: number;
  description: string;
}

const COUPONS: Coupon[] = [
  {
    id: 'cpn-1', code: 'YSC10', type: 'percentage', discount: 10, maxDiscount: 500,
    minPurchase: 1000, validFrom: '2025-01-01', validUntil: '2027-12-31',
    remaining: 100, description: 'ลด 10% สูงสุด 500 บาท',
  },
  {
    id: 'cpn-2', code: 'YSC200', type: 'fixed', discount: 200,
    minPurchase: 2000, validFrom: '2025-01-01', validUntil: '2027-12-31',
    remaining: 50, description: 'ลด 200 บาท เมื่อซื้อครบ 2,000 บาท',
  },
  {
    id: 'cpn-3', code: 'WELCOME', type: 'percentage', discount: 15, maxDiscount: 300,
    minPurchase: 500, validFrom: '2025-01-01', validUntil: '2027-12-31',
    remaining: 200, description: 'สมาชิกใหม่ ลด 15% สูงสุด 300 บาท',
  },
];

export const CouponsAPI = {
  async getAll(params?: { active?: boolean }): Promise<Coupon[]> {
    await delay();
    logApiCall('/coupons', 'GET', params);

    let coupons = [...COUPONS];
    if (params?.active) {
      const now = new Date();
      coupons = coupons.filter(c => {
        const validFrom = new Date(c.validFrom);
        const validUntil = new Date(c.validUntil);
        return now >= validFrom && now <= validUntil && c.remaining > 0;
      });
    }
    return coupons;
  },

  async validate(code: string, orderTotal: number): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discount?: number;
    message?: string;
  }> {
    await delay();
    logApiCall('/coupons/validate', 'POST', { code, orderTotal });

    const coupon = COUPONS.find(c => c.code === code);
    if (!coupon) return { valid: false, message: 'ไม่พบคูปองนี้ในระบบ' };

    const now = new Date();
    if (now < new Date(coupon.validFrom)) return { valid: false, message: 'คูปองนี้ยังไม่เริ่มใช้งาน' };
    if (now > new Date(coupon.validUntil)) return { valid: false, message: 'คูปองนี้หมดอายุแล้ว' };
    if (coupon.remaining <= 0) return { valid: false, message: 'คูปองนี้ถูกใช้งานหมดแล้ว' };
    if (orderTotal < coupon.minPurchase) return { valid: false, message: `ยอดสั่งซื้อขั้นต่ำ ${coupon.minPurchase.toLocaleString()} บาท` };

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = orderTotal * (coupon.discount / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discount;
    }

    return { valid: true, coupon, discount, message: 'คูปองใช้งานได้' };
  },
};
