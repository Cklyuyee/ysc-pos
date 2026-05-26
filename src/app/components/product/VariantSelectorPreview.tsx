import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';
import { Package, ShoppingCart, CheckCircle2 } from 'lucide-react';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

/** One choice dimension, e.g. { label: "สี", values: ["สีน้ำเงิน", "สีแดง", ...] } */
export interface ChoiceDimension {
  label: string;
  values: string[];
}

/** One SKU entry with its choice coordinates and product details */
export interface VariantEntry {
  sku: string;
  c1: string;
  c2?: string;
  c3?: string;
  price: number;
  stock: number;
  unit: string;
  barcode?: string;
  name?: string;
}

interface VariantSelectorPreviewProps {
  productName: string;
  /** Up to 3 choice dimensions */
  choices: ChoiceDimension[];
  /** Flat list of all SKU combinations */
  variantMap: VariantEntry[];
  /** Called when user confirms selection */
  onAddToCart?: (sku: string, qty: number) => void;
  /** compact = embedded sidebar; default = full card */
  compact?: boolean;
}

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────

export function VariantSelectorPreview({
  productName,
  choices,
  variantMap,
  onAddToCart,
  compact = false,
}: VariantSelectorPreviewProps) {
  const [selectedC, setSelectedC] = useState<(string | null)[]>(choices.map(() => null));
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  // ── Is unit a selector? ─────────────────────────────────
  const distinctUnits = Array.from(new Set(variantMap.map(v => v.unit).filter(Boolean)));
  // Don't show a separate unit row when units are already modelled as a choice dimension
  const unitsAlreadyInChoices = distinctUnits.length > 0 && choices.some(c =>
    distinctUnits.every(u => c.values.includes(u)) &&
    c.values.every(v => distinctUnits.includes(v))
  );
  const unitIsChoice = distinctUnits.length > 1 && !unitsAlreadyInChoices;
  // Single fixed unit (>=1 variant, all share the same unit, not embedded in choices)
  const fixedUnit = !unitIsChoice && !unitsAlreadyInChoices && distinctUnits.length === 1
    ? distinctUnits[0]
    : null;

  const handleSelect = (dimIdx: number, val: string) => {
    setAdded(false);
    setSelectedUnit(null); // reset unit when any choice changes
    setSelectedC(prev => {
      const next = [...prev];
      next[dimIdx] = next[dimIdx] === val ? null : val;
      for (let i = dimIdx + 1; i < next.length; i++) next[i] = null;
      return next;
    });
  };

  const handleSelectUnit = (unit: string) => {
    setAdded(false);
    setSelectedUnit(prev => prev === unit ? null : unit);
  };

  // ── Helpers: filter entries matching current choice selections ──

  const matchesChoices = (entry: VariantEntry): boolean => {
    const ev = [entry.c1, entry.c2, entry.c3] as (string | undefined)[];
    return choices.every((_, i) => selectedC[i] === null || ev[i] === selectedC[i]);
  };

  // ── Choice availability (unchanged) ─────────────────────

  const isAvailable = (dimIdx: number, val: string): boolean =>
    variantMap.some(entry => {
      const ev = [entry.c1, entry.c2, entry.c3] as (string | undefined)[];
      for (let i = 0; i < dimIdx; i++) {
        if (selectedC[i] !== null && ev[i] !== selectedC[i]) return false;
      }
      return ev[dimIdx] === val;
    });

  const isOutOfStock = (dimIdx: number, val: string): boolean => {
    const matches = variantMap.filter(entry => {
      const ev = [entry.c1, entry.c2, entry.c3] as (string | undefined)[];
      for (let i = 0; i < dimIdx; i++) {
        if (selectedC[i] !== null && ev[i] !== selectedC[i]) return false;
      }
      return ev[dimIdx] === val;
    });
    return matches.length > 0 && matches.every(e => e.stock === 0);
  };

  // ── Unit availability (smart-filter based on current choices) ──

  const isUnitAvailable = (unit: string): boolean =>
    variantMap.some(e => matchesChoices(e) && e.unit === unit);

  const isUnitOutOfStock = (unit: string): boolean => {
    const matches = variantMap.filter(e => matchesChoices(e) && e.unit === unit);
    return matches.length > 0 && matches.every(e => e.stock === 0);
  };

  // ── Resolved item ────────────────────────────────────────

  const choicesAllSelected = selectedC.slice(0, choices.length).every(s => s !== null);

  const resolvedItem: VariantEntry | null = (() => {
    if (choices.length === 0 && !unitIsChoice) return variantMap[0] ?? null;
    if (!choicesAllSelected) return null;
    if (unitIsChoice && !selectedUnit) return null;
    return (
      variantMap.find(entry => {
        const ev = [entry.c1, entry.c2, entry.c3] as (string | undefined)[];
        const choicesMatch = choices.every((_, i) => ev[i] === selectedC[i]);
        // When units are already in choices, unit matching is handled by choice selection
        const unitMatch = unitsAlreadyInChoices || !unitIsChoice || entry.unit === selectedUnit;
        return choicesMatch && unitMatch;
      }) ?? null
    );
  })();

  const allSelected = choicesAllSelected && (!unitIsChoice || selectedUnit !== null);
  const canAdd = allSelected && resolvedItem !== null && resolvedItem.stock > 0;

  const handleAdd = () => {
    if (!resolvedItem || !onAddToCart) return;
    onAddToCart(resolvedItem.sku, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency', currency: 'THB', minimumFractionDigits: 0,
    }).format(n);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className={`bg-white rounded-xl border ${compact ? 'p-4' : 'p-6 shadow-sm'} space-y-4`}>

      {/* Product header */}
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-lg bg-slate-100 border flex items-center justify-center flex-shrink-0">
          <Package className="h-9 w-9 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-c3 text-slate-500 font-medium mb-0.5">Preview — Website</p>
          <h3 className="font-semibold text-slate-800 leading-snug">
            {resolvedItem?.name ?? productName}
          </h3>
          {resolvedItem ? (
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-h5 font-bold text-brand-navy">
                {formatCurrency(resolvedItem.price)}
              </span>
              <span className="text-c3 text-slate-500">/ {resolvedItem.unit}</span>
            </div>
          ) : (
            <div className="mt-1 text-c3 text-slate-400">
              เลือก{choices[0]?.label ?? 'ตัวเลือก'}เพื่อดูราคา
            </div>
          )}
        </div>
      </div>

      {/* Choice selectors */}
      {choices.map((choice, dimIdx) => (
        <div key={dimIdx}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-c3 font-semibold text-slate-700">
              ตัวเลือก {dimIdx + 1} — {choice.label}
            </span>
            {selectedC[dimIdx] !== null && (
              <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-brand-primary/30 text-c3">
                {selectedC[dimIdx]}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {choice.values.map(val => {
              const available = isAvailable(dimIdx, val);
              const oos = isOutOfStock(dimIdx, val);
              const selected = selectedC[dimIdx] === val;
              return (
                <button
                  key={val}
                  onClick={() => available && handleSelect(dimIdx, val)}
                  disabled={!available}
                  className={`relative px-3 py-1.5 rounded-lg border text-c3 font-medium transition-all
                    ${selected
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : !available
                        ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                        : oos
                          ? 'bg-white text-slate-400 border-slate-200 hover:border-slate-400 cursor-pointer'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-brand-primary hover:text-brand-primary cursor-pointer'
                    }`}
                >
                  {val}
                  {oos && !selected && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-red-500 text-white rounded-full px-1">
                      หมด
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* UNIT — selector if multiple units, fixed badge if single */}
      {unitIsChoice ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-c3 font-semibold text-slate-700">หน่วย</span>
            {selectedUnit && (
              <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-brand-primary/30 text-c3">
                {selectedUnit}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {distinctUnits.map(unit => {
              const available = isUnitAvailable(unit);
              const oos = isUnitOutOfStock(unit);
              const selected = selectedUnit === unit;
              return (
                <button
                  key={unit}
                  onClick={() => available && handleSelectUnit(unit)}
                  disabled={!available}
                  className={`relative px-3 py-1.5 rounded-lg border text-c3 font-medium transition-all
                    ${selected
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : !available
                        ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                        : oos
                          ? 'bg-white text-slate-400 border-slate-200 hover:border-slate-400 cursor-pointer'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-brand-primary hover:text-brand-primary cursor-pointer'
                    }`}
                >
                  {unit}
                  {oos && !selected && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-red-500 text-white rounded-full px-1">หมด</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : fixedUnit && (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-c3 font-semibold text-slate-700 w-20 flex-shrink-0">หน่วย</span>
          <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-c3 font-medium text-slate-700">
            {fixedUnit}
          </div>
        </div>
      )}

      {/* SKU + Barcode + stock info */}
      {resolvedItem && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between text-c3">
            <span className="text-slate-500">SKU</span>
            <span className="font-mono font-semibold text-slate-800">{resolvedItem.sku}</span>
          </div>
          {resolvedItem.barcode && (
            <div className="flex justify-between text-c3">
              <span className="text-slate-500">Barcode</span>
              <span className="font-mono font-semibold text-slate-800">{resolvedItem.barcode}</span>
            </div>
          )}
          <div className="flex justify-between text-c3">
            <span className="text-slate-500">สต็อก</span>
            {resolvedItem.stock === 0
              ? <span className="text-amber-600 font-semibold">Pre-Order (ไม่มีสต็อก)</span>
              : <span className="text-green-700 font-semibold">
                  {resolvedItem.stock.toLocaleString()} {resolvedItem.unit}
                </span>
            }
          </div>
        </div>
      )}

      {/* Add to cart */}
      {onAddToCart && (
        <Button
          className="w-full"
          disabled={!canAdd && !added}
          onClick={handleAdd}
          variant={added ? 'outline' : 'default'}
        >
          {added ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              เพิ่มแล้ว
            </>
          ) : resolvedItem?.stock === 0 ? (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Pre-Order
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {allSelected
                ? 'เพิ่มใส่ตะกร้า'
                : !choicesAllSelected
                  ? `เลือก${choices[0]?.label ?? 'ตัวเลือก'}ก่อน`
                  : 'เลือกหน่วยก่อน'}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
