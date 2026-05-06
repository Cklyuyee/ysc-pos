import { apiFetch } from './apiClient'

export interface ApiProduct {
  id: string
  sku: string
  name: string
  barcode?: string
  standardPrice: number
  unit: string
  brand?: string
  category?: string
  stockOffline: number
  reservedOffline: number
  image?: string
}

export const searchProducts = (query: string) =>
  apiFetch<ApiProduct[]>(`/products?search=${encodeURIComponent(query)}`)

export const getProductByBarcode = (barcode: string) =>
  apiFetch<ApiProduct[]>(`/products?barcode=${encodeURIComponent(barcode)}`)

export const getProductBySku = (sku: string) =>
  apiFetch<ApiProduct>(`/products/by-code/${sku}`)
