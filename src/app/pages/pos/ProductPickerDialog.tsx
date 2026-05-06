import { useEffect, useRef, useState } from 'react';
import { Search, X, Package, Plus, Minus } from 'lucide-react';
import { searchProducts, type ApiProduct } from '../../../services/productsApi';

const NAVY = '#14264E';
const YELLOW = '#EFB419';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  open: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSelect: (product: ApiProduct, qty: number) => void;
}

export function ProductPickerDialog({ open, initialQuery = '', onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await searchProducts(q);
        setResults(res);
      } catch (err: unknown) {
        console.error('[ProductPicker] search failed', err);
        const e = err as { status?: number; message?: string };
        setErrorMsg(e.status ? `ค้นหาไม่สำเร็จ (HTTP ${e.status}) — ${e.message ?? ''}` : `ค้นหาไม่สำเร็จ — ${e.message ?? 'network error'}`);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  useEffect(() => {
    if (!open) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      return;
    }
    setQuery(initialQuery);
    setQtyMap({});
    setErrorMsg('');
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 50);
    doSearch(initialQuery);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [open, initialQuery]);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    doSearch(v);
  };

  const getQty = (sku: string) => qtyMap[sku] ?? 1;
  const setQty = (sku: string, qty: number) => setQtyMap(prev => ({ ...prev, [sku]: Math.max(1, qty) }));

  const handlePick = (p: ApiProduct) => {
    onSelect(p, getQty(p.sku));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[820px] mx-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <div className="text-lg font-bold" style={{ color: NAVY }}>ค้นหาสินค้า</div>
            <div className="text-xs text-neutral-400 mt-0.5">พิมพ์ชื่อ / SKU / บาร์โค้ด แล้วเลือกจากรายการ</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-neutral-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="ปากกา, 12122, 8851552..."
              className="w-full h-11 pl-9 pr-9 border-2 border-neutral-200 rounded-xl text-sm outline-none focus:border-amber-400 transition"
            />
            {query && (
              <button onClick={() => handleQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : errorMsg ? (
            <div className="mx-6 my-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <div className="font-bold">⚠️ {errorMsg}</div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-neutral-400">
              <Package className="w-10 h-10 opacity-30" />
              <div className="text-sm">{query ? 'ไม่พบสินค้าที่ตรงกัน' : 'พิมพ์เพื่อค้นหา'}</div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {results.map(p => {
                const stock = Math.max(0, p.stockOffline - p.reservedOffline);
                const qty = getQty(p.sku);
                const outOfStock = stock <= 0;
                return (
                  <div key={p.sku} className={`flex items-center gap-4 px-6 py-3 transition ${outOfStock ? 'opacity-60' : 'hover:bg-amber-50/40'}`}>
                    <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.image
                        ? <img src={p.image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <Package className="w-5 h-5 text-neutral-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 truncate">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                        <span className="font-mono">{p.sku}</span>
                        {p.barcode && <><span>•</span><span className="font-mono">{p.barcode}</span></>}
                        {p.brand && <><span>•</span><span>{p.brand}</span></>}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        สต็อก: <span className={outOfStock ? 'text-rose-500 font-bold' : 'text-emerald-600 font-semibold'}>{stock}</span> {p.unit}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-neutral-900 tabular-nums">{fmt(p.standardPrice)}</div>
                      <div className="text-[10px] text-neutral-400">/{p.unit}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 border-2 border-neutral-200 rounded-lg overflow-hidden">
                      <button onClick={() => setQty(p.sku, qty - 1)} disabled={outOfStock}
                        className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 transition">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input type="number" min={1} value={qty}
                        onChange={e => setQty(p.sku, parseInt(e.target.value, 10) || 1)}
                        disabled={outOfStock}
                        className="w-10 h-8 text-center text-sm tabular-nums outline-none disabled:opacity-40" />
                      <button onClick={() => setQty(p.sku, qty + 1)} disabled={outOfStock}
                        className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button onClick={() => handlePick(p)} disabled={outOfStock}
                      className="shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: YELLOW, color: NAVY }}>
                      <Plus className="w-3.5 h-3.5" /> เพิ่ม
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-neutral-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-400">{loading ? 'กำลังค้นหา...' : `พบ ${results.length} รายการ`}</span>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-neutral-500 rounded-lg hover:bg-neutral-100 transition">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
