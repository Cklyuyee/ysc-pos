import { apiFetch } from './apiClient'

export interface PosCartItem {
  id: string
  cartId: string
  sku: string
  qty: number
  unitPrice: string // decimal string e.g. "45.00"
  addedAt: string
  updatedAt: string
}

export interface PosCart {
  id: string
  staffId: string
  customerId: string | null
  status: 'active' | 'checked_out' | 'abandoned'
  expiresAt: string
  orderId: string | null
  items: PosCartItem[]
  createdAt: string
  updatedAt: string
}

export interface CheckoutResult {
  cartId: string
  order: {
    id: string
    [key: string]: unknown
  }
}

export const getActiveCart = () =>
  apiFetch<PosCart | null>('/pos/cart/active')

export const createCart = (customerId?: string) =>
  apiFetch<PosCart>('/pos/cart', {
    method: 'POST',
    body: JSON.stringify(customerId ? { customerId } : {}),
  })

export const getCart = (id: string) =>
  apiFetch<PosCart>(`/pos/cart/${id}`)

export const addItem = (cartId: string, sku: string, qty?: number) =>
  apiFetch<PosCart>(`/pos/cart/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify({ sku, ...(qty !== undefined ? { qty } : {}) }),
  })

export const setItemQty = (cartId: string, sku: string, qty: number) =>
  apiFetch<PosCart>(`/pos/cart/${cartId}/items/${sku}`, {
    method: 'PATCH',
    body: JSON.stringify({ qty }),
  })

export const removeItem = (cartId: string, sku: string) =>
  apiFetch<void>(`/pos/cart/${cartId}/items/${sku}`, {
    method: 'DELETE',
  })

export const checkout = (
  cartId: string,
  paymentMethod: 'cash' | 'bank-transfer' | 'qr-code' | 'credit-card' | 'credit-limit',
  customerId?: string,
) =>
  apiFetch<CheckoutResult>(`/pos/cart/${cartId}/checkout`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod, ...(customerId ? { customerId } : {}) }),
  })

export const abandonCart = (cartId: string) =>
  apiFetch<void>(`/pos/cart/${cartId}/abandon`, { method: 'POST' })
