import { useEffect, useState } from 'react';
import { X, ShoppingCart, Clock, Check, Ban } from 'lucide-react';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

export interface CouponItem {
  id: string;
  label: string;
  amount: number;
  detail: string;
  color: 'sky' | 'red' | 'green' | 'amber' | 'orange' | 'teal' | 'blue' | 'purple';
  minPurchase?: number;
  /** Days until expiry — when ≤ 15, card shows red near-expiry warning */
  daysUntilExpiry?: number;
}

/** Threshold (days) under which a coupon is marked as near-expiry. */
export const NEAR_EXPIRY_DAYS = 30;

const COLOR_BG: Record<CouponItem['color'], string> = {
  sky:    '#0EA5E9',
  red:    '#EF4444',
  green:  '#22C55E',
  amber:  '#F59E0B',
  orange: '#F97316',
  teal:   '#14B8A6',
  blue:   '#3B82F6',
  purple: '#A855F7',
};

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface Props {
  open: boolean;
  onClose: () => void;
  coupons: CouponItem[];
  applied: string[];
  /** Current cart total (used to gate coupons by minPurchase + over-discount rule). */
  cartTotal?: number;
  onConfirm: (ids: string[]) => void;
}

export function CouponPickerDialog({ open, onClose, coupons, applied, cartTotal = 0, onConfirm }: Props) {
  const [selected, setSelected] = useState<string[]>(applied);

  // Re-sync when the dialog opens with new applied state
  useEffect(() => { if (open) setSelected(applied); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  if (!open) return null;

  // Total discount from currently-selected coupons
  const selectedDiscount = coupons
    .filter(c => selected.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0);

  /** Decide whether a coupon is currently usable. */
  const disabledReason = (c: CouponItem): string | null => {
    if (c.minPurchase != null && cartTotal < c.minPurchase) return 'ยอดซื้อยังไม่ถึงขั้นต่ำ';
    // Over-cart-total coupons are allowed — excess is forfeit automatically (no cash refund).
    return null;
  };

  /** True if selected coupons total > cart (excess is auto-trimmed, no refund). */
  const hasExcessDiscount = selectedDiscount > cartTotal;
  const excessAmount = Math.max(0, selectedDiscount - cartTotal);

  const toggle = (id: string) => {
    const c = coupons.find(x => x.id === id);
    if (!c) return;
    if (!selected.includes(id) && disabledReason(c)) return;
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Hide coupons that are already applied — the sidebar shows those; the dialog
  // is for picking additional ones to add.
  const displayedCoupons = coupons.filter(c => !applied.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[640px] mx-4 flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 h-14 shrink-0"
          style={{ backgroundColor: NAVY }}
        >
          <span className="text-h5 font-bold text-white">คูปองส่วนลด</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 overflow-y-auto bg-white flex-1 min-h-0">
          {displayedCoupons.map((coupon) => {
            const isSelected = selected.includes(coupon.id);
            const isNearExpiry = coupon.daysUntilExpiry !== undefined && coupon.daysUntilExpiry <= NEAR_EXPIRY_DAYS;
            const reason = disabledReason(coupon);
            const isDisabled = !isSelected && reason !== null;
            const cardClass = isDisabled
              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
              : isNearExpiry
                ? 'border-red-400 bg-red-50 cursor-pointer'
                : isSelected
                  ? 'border-sky-400 bg-sky-50 cursor-pointer'
                  : 'border-gray-300 bg-white hover:bg-gray-50 cursor-pointer';
            const expiryText = isNearExpiry
              ? `หมดอายุใน ${coupon.daysUntilExpiry} วัน`
              : coupon.detail;
            return (
              <div
                key={coupon.id}
                onClick={() => toggle(coupon.id)}
                className={`rounded-[14px] border p-4 flex items-center gap-4 transition ${cardClass}`}
              >
                {/* Colored icon block */}
                <div
                  className="w-[84px] h-[84px] rounded-[14px] flex flex-col items-center justify-center gap-1.5 shrink-0"
                  style={{ backgroundColor: COLOR_BG[coupon.color] }}
                >
                  <ShoppingCart className="w-8 h-8 text-white" />
                  <span className="text-[11px] font-bold text-white">ส่วนลด</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-h5 font-bold text-text-primary">{coupon.label}</div>
                  {coupon.minPurchase != null && (
                    <div className="text-c2 text-text-secondary mt-0.5">
                      ใช้เมื่อซื้อขั้นต่ำ {fmt(coupon.minPurchase)}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isNearExpiry ? 'text-red-500' : 'text-text-muted'}`} />
                    <span className={`text-c3 ${isNearExpiry ? 'text-red-600 font-semibold' : 'text-text-muted'}`}>
                      {expiryText}
                    </span>
                  </div>
                  {isDisabled && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Ban className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-c2 font-medium text-gray-600">{reason}</span>
                    </div>
                  )}
                </div>

                {/* เงื่อนไข + check (top-right) */}
                <div className="flex flex-row items-center gap-2 shrink-0 self-start">
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="text-c2 font-medium underline text-text-primary cursor-pointer"
                  >
                    เงื่อนไข
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                    isSelected ? 'bg-sky-500' : isDisabled ? 'border-2 border-gray-200 bg-gray-100' : 'border-2 border-gray-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </div>
              </div>
            );
          })}

          {displayedCoupons.length === 0 && (
            <div className="py-10 text-center text-b3 text-text-muted">
              {coupons.length === 0 ? 'ไม่มีคูปองที่ใช้ได้' : 'เลือกคูปองครบทั้งหมดแล้ว'}
            </div>
          )}
        </div>

        {/* Excess-discount notice (shown above the footer when applicable) */}
        {hasExcessDiscount && (
          <div className="px-6 py-3 bg-amber-50 border-t border-amber-200 flex items-start gap-2 text-c1 text-amber-800">
            <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <span className="font-bold">ส่วนลดเกินยอดซื้อ {fmt(excessAmount)}</span> — ระบบจะตัดส่วนเกินออก ไม่ทอนเงินคืน
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-bg-page border-t border-gray-200 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => { onConfirm(selected); onClose(); }}
            className="flex-[2] h-12 rounded-[12px] text-h5 font-bold transition hover:brightness-95"
            style={{ backgroundColor: YELLOW, color: NAVY }}
          >
            Enter - ตกลง
          </button>
        </div>

      </div>
    </div>
  );
}
