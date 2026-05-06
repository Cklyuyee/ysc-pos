import { apiFetch } from './apiClient'

// Raw API shape — mirrors backoffice src/app/api/products.ts
interface RawApiPriceMatrixRow {
  id: string
  priceTypeConxId: string
  sellPrice: string
}

interface RawApiBrand {
  id: string
  name: string
  logoUrl: string | null
  description: string | null
}

interface RawApiCategory {
  id: string
  name: string
  level: number
  parentId: string | null
}

interface RawApiProduct {
  id: string
  conxId: string
  barcodeId: string | null
  productName: string
  unitName: string
  standardPrice: string
  vatType: 'V' | 'I' | null
  status: string
  brand: RawApiBrand | null
  category: RawApiCategory | null
  stockOnline: number
  stockOffline: number
  priceMatrix: RawApiPriceMatrixRow[]
  imageUrl?: string | null
}

interface ApiProductsResponse {
  data: RawApiProduct[]
  total: number
  page: number
  limit: number
}

// Public shape used by POS UI
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

function normalize(p: RawApiProduct): ApiProduct {
  return {
    id: p.id,
    // Cart endpoints expect `sku` — backoffice uses conxId as the human-readable SKU
    sku: p.conxId || p.id,
    name: p.productName,
    barcode: p.barcodeId ?? undefined,
    standardPrice: Number(p.standardPrice) || 0,
    unit: p.unitName,
    brand: p.brand?.name ?? undefined,
    category: p.category?.name ?? undefined,
    stockOffline: p.stockOffline ?? 0,
    reservedOffline: 0, // not exposed by this endpoint; cart 409 errors handle real availability
    image: p.imageUrl ?? undefined,
  }
}

export const searchProducts = async (query: string): Promise<ApiProduct[]> => {
  const res = await apiFetch<ApiProductsResponse>(`/products?search=${encodeURIComponent(query)}&limit=50`)
  return (res?.data ?? []).map(normalize)
}

export const getProductByBarcode = async (barcode: string): Promise<ApiProduct[]> => {
  const res = await apiFetch<ApiProductsResponse>(`/products?barcode=${encodeURIComponent(barcode)}&limit=10`)
  return (res?.data ?? []).map(normalize)
}

export const getProductBySku = async (sku: string): Promise<ApiProduct> => {
  const res = await apiFetch<RawApiProduct>(`/products/by-code/${encodeURIComponent(sku)}`)
  return normalize(res)
}
