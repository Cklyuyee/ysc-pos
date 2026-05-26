import { apiFetch } from './apiClient'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api')
  .replace(/\/api\/?$/, '')

/** Resolve image URL — if relative, prepend the API origin */
function resolveImg(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * Construct product image URL from barcode using the YSC CDN pattern:
 * https://www.yongcharoen.co.th/img/product/{barcode[0..2]}/{barcodeId}_1.webp
 * The subfolder = first 3 digits of the barcode (e.g. "885", "400", "001")
 */
function barcodeImg(barcodeId: string | null | undefined): string | undefined {
  if (!barcodeId) return undefined
  const folder = barcodeId.substring(0, 3)
  return `https://www.yongcharoen.co.th/img/product/${folder}/${barcodeId}_1.webp`
}

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
  priceMatrix: RawApiPriceMatrixRow[]
  imageUrl?: string | null
  /** Array of image URLs added via Adeptio backoffice */
  adeptioImages?: string[]
  // --- Per-location flat fields (actual API shape) ---
  /** Offline location ID (e.g. "11380203") */
  locationId?: string | null
  /** Offline stock qty */
  locationStock?: number
  /** Offline reserved qty */
  locationReserved?: number
  /** Backend-computed offline available = locationStock − locationReserved */
  locationAvailable?: number
  /** Online location ID (null if no online slot) */
  locationIdOnline?: string | null
  locationStockOnline?: number
  locationReservedOnline?: number
  locationAvailableOnline?: number
}

interface ApiProductsResponse {
  data: RawApiProduct[]
  total: number
  page: number
  limit: number
}

export type PriceTier = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

/** Map of customer price tier → unit price (THB). Missing tiers fall back to standardPrice. */
export type PriceMap = Partial<Record<PriceTier, number>>

/** Per-location stock slot as exposed to the POS UI. locationAvailable is computed: locationStock − locationReserved. */
export interface LocationSlot {
  locationId: string
  locationName?: string
  locationCode?: string
  locationStock: number
  locationReserved: number
  /** Computed: locationStock − locationReserved */
  locationAvailable: number
}

// Public shape used by POS UI
export interface ApiProduct {
  id: string
  sku: string
  name: string
  barcode?: string
  standardPrice: number
  /** Per-tier prices from backend priceMatrix (may be partial — missing tiers fallback to standardPrice). */
  prices: PriceMap
  unit: string
  brand?: string
  category?: string
  stockOffline: number
  reservedOffline: number
  image?: string
  /** Per-location stock from backend. Offline slots have locationId starting with '1' or '2'. locationAvailable = locationStock − locationReserved. */
  locationStock?: LocationSlot[]
}

/**
 * Pick the unit price for a customer's tier.
 * Falls back to `standardPrice` if tier not present in priceMatrix.
 */
export function pickPriceForTier(product: ApiProduct, tier?: string | null): number {
  if (!tier) return product.standardPrice
  // Normalise common variants (e.g. "p1", " P3 ")
  const key = String(tier).trim().toUpperCase() as PriceTier
  const v = product.prices[key]
  return typeof v === 'number' && v > 0 ? v : product.standardPrice
}

function normalize(p: RawApiProduct): ApiProduct {
  // Build per-tier price map from backend priceMatrix
  const prices: PriceMap = {}
  for (const row of p.priceMatrix ?? []) {
    const key = String(row.priceTypeConxId).trim().toUpperCase() as PriceTier
    const value = Number(row.sellPrice)
    if (key && Number.isFinite(value) && value > 0) {
      prices[key] = value
    }
  }

  // Build LocationSlot[] from the backend's flat per-location fields
  const locationSlots: LocationSlot[] = []
  if (p.locationId) {
    const stock = p.locationStock ?? 0
    const reserved = p.locationReserved ?? 0
    locationSlots.push({
      locationId: p.locationId,
      locationStock: stock,
      locationReserved: reserved,
      // prefer backend-computed available; fall back to stock − reserved
      locationAvailable: p.locationAvailable ?? Math.max(0, stock - reserved),
    })
  }
  if (p.locationIdOnline) {
    const stock = p.locationStockOnline ?? 0
    const reserved = p.locationReservedOnline ?? 0
    locationSlots.push({
      locationId: p.locationIdOnline,
      locationStock: stock,
      locationReserved: reserved,
      locationAvailable: p.locationAvailableOnline ?? Math.max(0, stock - reserved),
    })
  }

  // Offline available = backend-computed value (most accurate)
  const offlineAvailable = p.locationAvailable ?? Math.max(0, (p.locationStock ?? 0) - (p.locationReserved ?? 0))

  return {
    id: p.id,
    // Cart endpoints expect `sku` — backoffice uses conxId as the human-readable SKU
    sku: p.conxId || p.id,
    name: p.productName,
    barcode: p.barcodeId ?? undefined,
    standardPrice: Number(p.standardPrice) || 0,
    prices,
    unit: p.unitName,
    brand: p.brand?.name ?? undefined,
    category: p.category?.name ?? undefined,
    stockOffline: offlineAvailable,
    reservedOffline: p.locationReserved ?? 0,
    // priority: adeptioImages[0] → imageUrl → YSC CDN from barcode
    image: resolveImg(p.adeptioImages?.[0] ?? p.imageUrl) ?? barcodeImg(p.barcodeId),
    locationStock: locationSlots.length > 0 ? locationSlots : undefined,
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
