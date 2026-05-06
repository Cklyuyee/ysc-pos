import { apiFetch } from './apiClient'
import type { Customer } from '../data/customers'

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
  type?: string
  contactPerson?: string
}

export function apiCustomerToCustomer(c: ApiCustomer): Customer {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    phone: c.phone ?? '',
    email: c.email ?? '',
    tier: (c.tier ?? 'Silver') as Customer['tier'],
    priceTier: c.priceTier ?? 'P5',
    creditLimit: c.creditLimit ?? 0,
    creditUsed: c.creditUsed ?? 0,
    rewardPoints: c.rewardPoints ?? 0,
    type: (c.type ?? 'person') as Customer['type'],
    contactPerson: c.contactPerson,
    address: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
  } as unknown as Customer
}

export const searchCustomers = (query: string) =>
  apiFetch<ApiCustomer[]>(`/customers?search=${encodeURIComponent(query)}`)

export const getCustomer = (id: string) =>
  apiFetch<ApiCustomer>(`/customers/${id}`)

export const createCustomer = (data: {
  name: string
  phone: string
  email?: string
  type?: string
  contactPerson?: string
}) =>
  apiFetch<ApiCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
