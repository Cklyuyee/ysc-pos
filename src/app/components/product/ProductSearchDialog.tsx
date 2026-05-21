import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search, Plus, Minus, ShoppingCart, ChevronDown, Tag } from 'lucide-react';
import { searchProducts as apiSearchProducts, pickPriceForTier, type ApiProduct } from '../../../services/productsApi';
import { ProductThumb } from '../ui/ProductThumb';
import { Skeleton } from '../ui/Skeleton';
import type { Product } from '../../api/mock/products';

// ─── Mock promo tags (replace with real /promotions API when available) ────────
type PromoTagColor = 'amber' | 'red' | 'sky'
interface MockPromoTag { label: string; color: PromoTagColor }
function getMockPromoTags(brand?: string): MockPromoTag[] {
  if (!brand || brand === '-') return []
  const hash = brand.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  const tags: MockPromoTag[] = [{ label: `โปรแบรนด์ ${brand}`, color: 'amber' }]
  const n = hash % 5
  if (n === 0) tags.push({ label: 'ซื้อ 1 แถม 1', color: 'red' })
  else if (n === 1) tags.push({ label: 'ลด 10%', color: 'sky' })
  else if (n === 2) tags.push({ label: 'ลด 15%', color: 'sky' })
  return tags
}
const PROMO_STYLES: Record<PromoTagColor, string> = {
  amber: 'bg-amber-100 text-amber-700',
  red:   'bg-red-100 text-red-600',
  sky:   'bg-sky-100 text-sky-600',
}

const NAVY = '#0B1E8A';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function apiToProduct(p: ApiProduct, priceTier?: string): Product {
  // Prefer backend-computed offline available stock (sum of offline location slots).
  const offlineAvail = p.locationStock
    ? p.locationStock
        .filter(s => ['1', '2'].includes(String(s.locationId).charAt(0)))
        .reduce((sum, s) => sum + s.locationAvailable, 0)
    : null;
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    price: pickPriceForTier(p, priceTier),
    prices: p.prices,
    unit: p.unit,
    tax: 'V',
    attr: [],
    image: p.image ?? '',
    stock: Math.max(0, offlineAvail ?? (p.stockOffline - p.reservedOffline)),
    variant: '',
    category: p.category ?? '',
    brand: p.brand ?? '-',
  } as Product;
}

interface ProductSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product, qty: number) => void;
  customerRecentProducts?: Product[];
  customerFrequentProducts?: Product[];
  activePromotions?: unknown[];
  priceTier?: string;
  initialQuery?: string;
}

export function ProductSearchDialog({
  open,
  onClose,
  onSelectProduct,
  priceTier,
  initialQuery: _initialQuery = '',
}: ProductSearchDialogProps) {
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  /** qty per product.sku — defaults to 0 */
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setBarcodeQuery(''); setNameQuery('');
      setSelectedCategory('all'); setSelectedBrand('all');
      setResults([]); setQtyMap({});
      return;
    }
    // Always start empty — user must search to see results
  }, [open]);

  // Debounced search — partial match supported by backend
  useEffect(() => {
    if (!open) return;
    const q = (barcodeQuery + ' ' + nameQuery).trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const products = await apiSearchProducts(q);
        setResults(products.map(p => apiToProduct(p, priceTier)));
      } catch (err) {
        console.error('[ProductSearch] failed', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [barcodeQuery, nameQuery, open, priceTier]);

  // Distinct brands from current result set (placeholder for future API)
  const brandsAvailable = useMemo(() => {
    const set = new Set<string>();
    results.forEach(p => { if (p.brand && p.brand !== '-') set.add(p.brand); });
    return [...set].sort();
  }, [results]);

  const categoriesAvailable = useMemo(() => {
    const set = new Set<string>();
    results.forEach(p => { if (p.category) set.add(p.category); });
    return [...set].sort();
  }, [results]);

  const filtered = useMemo(() => {
    return results.filter(p => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      return true;
    });
  }, [results, selectedCategory, selectedBrand]);

  const setQty = (sku: string, qty: number) => {
    const v = Math.max(0, Math.min(9999, qty));
    setQtyMap(m => ({ ...m, [sku]: v }));
  };

  const handleAddToCart = (product: Product) => {
    const qty = qtyMap[product.sku] ?? 0;
    if (qty <= 0) return;
    onSelectProduct(product, qty);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[1280px] mx-4 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Navy header bar */}
        <div className="flex items-center justify-between px-6 h-14 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="text-h5 text-white">ค้นหาสินค้าเพิ่มเติม</div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition" aria-label="ปิด">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter row — 4 columns */}
        <div className="grid grid-cols-4 gap-4 px-6 pt-5 pb-4 shrink-0 border-b border-gray-200">
          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">ค้นหาด้วยบาร์โค้ด</label>
            <input
              value={barcodeQuery}
              onChange={e => setBarcodeQuery(e.target.value)}
              placeholder="กรุณากรอกเลขบาร์โค้ด"
              className="w-full h-12 px-4 border border-gray-300 rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">ค้นหาด้วยชื่อสินค้า</label>
            <input
              value={nameQuery}
              onChange={e => setNameQuery(e.target.value)}
              placeholder="กรุณากรอกชื่อสินค้า"
              className="w-full h-12 px-4 border border-gray-300 rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">หมวดหมู่</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full h-12 pl-4 pr-10 border border-gray-300 rounded-[12px] text-b3 text-text-primary outline-none focus:border-brand-navy transition appearance-none bg-white cursor-pointer"
              >
                <option value="all">หมวดหมู่ทั้งหมด</option>
                {categoriesAvailable.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">แบรนด์</label>
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full h-12 pl-4 pr-10 border border-gray-300 rounded-[12px] text-b3 text-text-primary outline-none focus:border-brand-navy transition appearance-none bg-white cursor-pointer"
              >
                <option value="all">แบรนด์ทั้งหมด</option>
                {brandsAvailable.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results section */}
        <div className="flex-1 overflow-y-auto bg-white p-4">
          {/* Section header */}
          <div className="px-2 pb-3 text-c1 text-text-secondary">
            ผลการค้นหา{filtered.length > 0 && ` (${filtered.length})`}
          </div>

          {loading ? (
            <div className="bg-white rounded-[12px] border border-gray-200 divide-y divide-gray-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="w-12 h-12 rounded-[8px] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                  <Skeleton className="h-4 w-20 shrink-0" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-[12px] border border-gray-200">
              <div className="w-20 h-20 rounded-full border border-gray-200 flex items-center justify-center">
                <Search className="w-9 h-9 text-gray-300" />
              </div>
              <div className="text-b3 text-text-muted">กรุณาพิมพ์บาร์โค้ดหรือชื่อสินค้าเพื่อเริ่มการค้นหา</div>
            </div>
          ) : (
            <div className="bg-white rounded-[12px] border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="sticky top-0 bg-bg-page-2 z-10">
                  <tr className="text-s2 text-gray-700 border-b border-gray-200">
                    <th className="text-left px-4 py-3 w-[140px]">รหัสสินค้า</th>
                    <th className="text-left px-3 py-3">รายการสินค้า</th>
                    <th className="text-right px-3 py-3 w-[130px] whitespace-nowrap">ราคา/หน่วย</th>
                    <th className="text-center px-3 py-3 w-[80px]">สต็อก</th>
                    <th className="text-center px-3 py-3 w-[220px]">เลือกสินค้า</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filtered.map(p => {
                    const qty = qtyMap[p.sku] ?? 0;
                    const remaining = Math.max(0, p.stock - qty);
                    const stockOver = qty > p.stock;
                    return (
                      <tr key={p.sku} className="border-b border-gray-100 last:border-b-0 hover:bg-bg-page-2/40 transition">
                        <td className="px-4 py-3 text-c1 font-mono text-text-primary align-middle">
                          {p.barcode ?? p.sku}
                        </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <ProductThumb image={p.image} name={p.name} size={48} />
                          <div className="flex-1 min-w-0">
                            <div className="text-b4 text-text-primary leading-snug">{p.name}</div>
                            {getMockPromoTags(p.brand).length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {getMockPromoTags(p.brand).map(tag => (
                                  <span key={tag.label} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium leading-none ${PROMO_STYLES[tag.color]}`}>
                                    <Tag className="shrink-0" style={{ width: 11, height: 11 }} strokeWidth={2.5} />
                                    {tag.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right align-middle">
                        <div className="text-s2 text-brand-navy tabular-nums">{fmt(p.price)}</div>
                        <div className="text-c2 text-text-muted">/{p.unit}</div>
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        <div className={`text-s2 tabular-nums transition-colors ${stockOver ? 'text-status-danger' : remaining <= 5 && remaining > 0 ? 'text-amber-600' : 'text-text-primary'}`}>
                          {remaining}
                        </div>
                        <div className="text-c2 text-text-muted">{p.unit}</div>
                        {stockOver && (
                          <div className="text-[10px] text-status-danger font-medium mt-0.5 leading-tight">เกินสต็อก</div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQty(p.sku, qty - 1)}
                            disabled={qty <= 0}
                            className="w-10 h-10 rounded-[12px] bg-blue-100 border border-sky-200 text-sky-500 flex items-center justify-center hover:brightness-95 transition disabled:opacity-40"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={qty}
                            onChange={e => {
                              const v = parseInt(e.target.value.replace(/[^0-9]/g, '') || '0');
                              setQty(p.sku, v);
                            }}
                            className="w-12 h-10 text-center text-c1 font-bold tabular-nums border border-sky-200 rounded-[12px] bg-white outline-none focus:border-sky-400"
                          />
                          <button
                            type="button"
                            onClick={() => setQty(p.sku, qty + 1)}
                            className="w-10 h-10 rounded-[12px] bg-blue-100 border border-sky-200 text-sky-500 flex items-center justify-center hover:brightness-95 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {(() => {
                            const active = qty > 0;
                            return (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                disabled={!active}
                                title={`เพิ่ม ${qty} ${p.unit} เข้ารถเข็น`}
                                className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition disabled:cursor-not-allowed ${
                                  active
                                    ? 'text-white hover:brightness-95'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                                style={active ? { backgroundColor: '#27AE60' } : undefined}
                              >
                                <ShoppingCart className="w-5 h-5" />
                              </button>
                            );
                          })()}
                        </div>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
