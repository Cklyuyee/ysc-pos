import { apiFetch } from './apiClient'
import type { Customer } from '../data/customers'

// Raw API shape — mirrors backoffice src/app/api/customers.ts
interface RawApiCustomer {
  id: string
  custCode: string
  custType: string
  name: string
  taxId: string | null
  phone: string | null
  phones: string[] | null
  email: string | null
  contactPerson: string | null
  memberTier: string
  priceTier: string
  totalSpent: string
  rewardPoints: number
  pointsExpiring: number | null
  pointsExpiryDate: string | null
  creditLimit: string
  creditUsed: string
  docType: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface ApiCustomersResponse {
  data: RawApiCustomer[]
  total: number
  page: number
  limit: number
}

// Public shape used by POS app — flatter, with numbers parsed
export interface ApiCustomer {
  id: string
  code: string
  name: string
  phone?: string
  email?: string
  tier?: string
  priceTier?: string
  creditLimit?: number
  creditUsed?: number
  rewardPoints?: number
  pointsExpiring?: number
  pointsExpiryDate?: string
  type?: string
  contactPerson?: string
  docType?: string
  /** เลขประจำตัวผู้เสียภาษี — สำหรับออกใบกำกับภาษี */
  taxId?: string
  /** ยอดซื้อสะสมตลอด (THB) — สำหรับแสดง tier progress / CRM */
  totalSpent?: number
  /** สถานะลูกค้า: "active" | "suspended" | "blacklist" | etc. */
  status?: string
}

function normalize(r: RawApiCustomer): ApiCustomer {
  return {
    id: r.id,
    code: r.custCode,
    name: r.name,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    tier: r.memberTier,
    priceTier: r.priceTier,
    creditLimit: Number(r.creditLimit),
    creditUsed: Number(r.creditUsed),
    rewardPoints: r.rewardPoints,
    pointsExpiring: r.pointsExpiring ?? undefined,
    pointsExpiryDate: r.pointsExpiryDate ?? undefined,
    type: r.custType,
    contactPerson: r.contactPerson ?? undefined,
    docType: r.docType ?? undefined,
    taxId: r.taxId ?? undefined,
    totalSpent: r.totalSpent ? Number(r.totalSpent) : undefined,
    status: r.status,
  }
}

export const searchCustomers = async (query: string): Promise<ApiCustomer[]> => {
  const res = await apiFetch<ApiCustomersResponse>(`/customers?search=${encodeURIComponent(query)}&limit=50`)
  return (res?.data ?? []).map(normalize)
}

export const getCustomer = async (id: string): Promise<ApiCustomer> => {
  const res = await apiFetch<RawApiCustomer>(`/customers/${id}`)
  return normalize(res)
}

export const createCustomer = async (data: {
  name: string
  phone: string
  email?: string
  type?: string
  contactPerson?: string
}): Promise<ApiCustomer> => {
  const custCode = `WALK-${Date.now().toString(36).toUpperCase()}`
  const payload = {
    custCode,
    custType: data.type === 'company' || data.type === 'business' ? 'company' : 'person',
    name: data.name,
    phone: data.phone,
    ...(data.email ? { email: data.email } : {}),
    ...(data.contactPerson ? { contactPerson: data.contactPerson } : {}),
    memberTier: 'Silver',
    priceTier: 'P5',
    registrationChannel: 'Walk-in',
  }
  const res = await apiFetch<RawApiCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return normalize(res)
}

export function apiCustomerToCustomer(c: ApiCustomer): Customer {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    taxId: c.taxId ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    tier: (c.tier ?? 'Silver') as Customer['tier'],
    priceTier: c.priceTier ?? 'P5',
    totalSpent: c.totalSpent ?? 0,
    creditLimit: c.creditLimit ?? 0,
    creditUsed: c.creditUsed ?? 0,
    rewardPoints: c.rewardPoints ?? 0,
    pointsExpiring: c.pointsExpiring,
    pointsExpiryDate: c.pointsExpiryDate,
    type: (c.type ?? 'person') as Customer['type'],
    contactPerson: c.contactPerson,
    status: c.status,
    address: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
  } as unknown as Customer
}
