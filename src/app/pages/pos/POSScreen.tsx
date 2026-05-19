import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, XCircle, Trash2,
  Truck, Store, Gift, Coins, Tag, Sparkles, TrendingUp,
  ChevronRight, Plus, AlertTriangle, UserCircle, Settings, Power,
  RefreshCw, Pause, Inbox, Ban, LayoutGrid, Crown, User, Package, X,
  MapPin, Warehouse, Eye, Check, Phone, Box, ChevronDown, ChevronUp,
  ShoppingCart, Pencil, Hourglass, Clock, CheckCircle2, Trophy, Ticket,
  BadgeCheck, FileText, Calendar, Save, Printer,
} from 'lucide-react';
import type { LocationSlot } from '../../../services/productsApi';
import { DISPLAY_CHANNEL, type DisplayMessage } from '../../../services/customerDisplayChannel';
import { Button } from '../../components/ui/button';
import {
  getActiveCart, createCart, addItem, setItemQty, removeItem,
  checkout, abandonCart,
  type PosCart, type PosCartItem,
} from '../../../services/cartApi';
import { searchProducts, getProductByBarcode, getProductBySku, pickPriceForTier, type ApiProduct } from '../../../services/productsApi';
import { getMe, signOut, type MeResponse } from '../../../services/authApi';
import { CustomerSearchDialog } from './CustomerSearchDialog';
import { HoldBillDialog, type HoldNextAction } from './HoldBillDialog';
import { CartPendingDialog, type CartPendingAction } from './CartPendingDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { RegisterMemberDialog } from './RegisterMemberDialog';
import { PaymentDialog } from './PaymentDialog';
import { CancelBillDialog } from './CancelBillDialog';
import { SupervisorAuthDialog, type SupervisorAuthMode } from './SupervisorAuthDialog';
import { CreditApprovalDialog } from './CreditApprovalDialog';
import { AddressPickerDialog } from './AddressPickerDialog';
import { PackagingPickerDialog, type SelectedPackaging } from './PackagingPickerDialog';
import { CouponPickerDialog } from './CouponPickerDialog';
import { FulfillmentSummaryDialog, type SummaryFreeItem } from './FulfillmentSummaryDialog';
import { HeldBillsDialog, type HeldBill } from './HeldBillsDialog';
import { SlipUploadDialog } from './SlipUploadDialog';
import OtherMenusDialog from './OtherMenusDialog';
import DeliveryDocDialog from './DeliveryDocDialog';
import { ProductSearchDialog } from '../../components/product/ProductSearchDialog';
import { ProductThumb } from '../../components/ui/ProductThumb';
import type { Product as MockProduct } from '../../api/mock/products';
import type { Customer, Address } from '../../../data/customers';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "2026-03-31" → "31/03/69" (BE year, last 2 digits) */
const fmtThaiBE = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  return `${dd}/${mm}/${yy}`;
};

const TIER_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'Gold 1':    { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200',  label: 'Gold Member' },
  'Gold 2':    { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200',  label: 'Gold Member' },
  'Platinum 1':{ bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200', label: 'Platinum Member' },
  'Platinum 2':{ bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200', label: 'Platinum Member' },
  'Diamond':   { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-200',    label: 'Diamond Member' },
  'Silver':    { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300',label: 'Silver Member' },
};

// ─── Mock promotion tags (replace with real /promotions API when available) ───
type PromoTagColor = 'amber' | 'red' | 'sky' | 'green'
interface MockPromoTag { label: string; color: PromoTagColor }

/** Deterministic mock promo tags from product brand until /promotions API exists. */
function getMockPromoTags(brand?: string): MockPromoTag[] {
  if (!brand) return []
  const hash = brand.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  const tags: MockPromoTag[] = [{ label: `โปรแบรนด์ ${brand}`, color: 'amber' }]
  const n = hash % 5
  if (n === 0) tags.push({ label: 'ซื้อ 1 แถม 1', color: 'red' })
  else if (n === 1) tags.push({ label: 'ลด 10%', color: 'sky' })
  else if (n === 2) tags.push({ label: 'ลด 15%', color: 'sky' })
  // n === 3 or 4: just brand tag
  return tags
}

const PROMO_TAG_STYLES: Record<PromoTagColor, string> = {
  amber: 'bg-amber-100 text-amber-700',
  red:   'bg-red-100 text-red-600',
  sky:   'bg-sky-100 text-sky-600',
  green: 'bg-green-100 text-green-700',
}

function PromoTagList({ brand, size = 'sm' }: { brand?: string; size?: 'xs' | 'sm' }) {
  const tags = getMockPromoTags(brand)
  if (tags.length === 0) return null
  const iconSize = size === 'xs' ? 11 : 12
  const textCls = size === 'xs' ? 'text-[11px]' : 'text-[12px]'
  return (
    <div className="flex flex-wrap items-center gap-1 mt-0.5">
      {tags.map(tag => (
        <span
          key={tag.label}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium leading-none ${textCls} ${PROMO_TAG_STYLES[tag.color]}`}
        >
          <Tag style={{ width: iconSize, height: iconSize }} strokeWidth={2.5} className="shrink-0" />
          {tag.label}
        </span>
      ))}
    </div>
  )
}

// ─── StockCheckDialog ─────────────────────────────────────────────────────────
/** Modal that shows per-location stock availability for a cart item. */
function StockCheckDialog({
  open, onClose, productName, sku, barcode, unit, image, slots, loading = false, stockOffline,
}: {
  open: boolean;
  onClose: () => void;
  productName: string;
  sku?: string;
  barcode?: string;
  unit: string;
  image?: string;
  slots?: LocationSlot[];
  loading?: boolean;
  stockOffline?: number;
}) {
  if (!open) return null;

  const slotType = (id: string) => {
    const ch = String(id).charAt(0);
    if (ch === '1' || ch === '2') return 'offline';
    if (ch === '3' || ch === '4' || ch === '5') return 'online';
    return 'other';
  };

  const hasSlots = Boolean(slots && slots.length > 0);
  const offlineSlots = slots?.filter(s => slotType(s.locationId) === 'offline') ?? [];
  const onlineSlots  = slots?.filter(s => slotType(s.locationId) === 'online')  ?? [];
  const totalOffline = hasSlots ? offlineSlots.reduce((sum, s) => sum + s.locationAvailable, 0) : (stockOffline ?? 0);
  const totalOnline  = onlineSlots.reduce((sum, s) => sum + s.locationAvailable, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-[800px] mx-4 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center gap-3 text-white text-h5">
            <Package className="w-6 h-6" strokeWidth={1.5} /> ข้อมูลสต๊อกคงเหลือ
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product info */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100 shrink-0">
          <ProductThumb image={image} name={productName} size={64} className="rounded-[10px]" />
          <div className="flex-1 min-w-0">
            <div className="text-s1 text-text-primary leading-snug">{productName}</div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              {sku && <span className="text-c1 text-text-secondary">รหัสสินค้า : <span className="font-mono text-text-primary">{sku}</span></span>}
              {barcode && <span className="text-c1 text-text-secondary">รหัสบาร์โค้ด : <span className="font-mono text-text-primary">{barcode}</span></span>}
            </div>
            <div className="text-c1 text-text-secondary mt-1">หน่วย : <span className="text-text-primary">{unit}</span></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-9 h-9 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: NAVY, borderTopColor: 'transparent' }} />
              <div className="text-b3 text-text-muted">กำลังโหลดข้อมูลสต็อก...</div>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[14px] border-2 p-5 text-center"
                  style={{ borderColor: '#0197FF', backgroundColor: '#E5F2FF' }}>
                  <div className="text-s1 text-text-secondary mb-2">คงเหลือ (หน้าร้าน)</div>
                  <div className="text-[48px] font-bold tabular-nums leading-none" style={{ color: NAVY }}>
                    {totalOffline.toLocaleString()}
                  </div>
                  <div className="text-b3 text-text-muted mt-2">{unit}</div>
                </div>
                <div className="rounded-[14px] border border-gray-200 p-5 text-center" style={{ backgroundColor: '#EBF4FF' }}>
                  <div className="text-s1 text-text-secondary mb-2">คงเหลือ (ออนไลน์)</div>
                  <div className="text-[48px] font-bold tabular-nums leading-none text-text-primary">
                    {totalOnline.toLocaleString()}
                  </div>
                  <div className="text-b3 text-text-muted mt-2">{unit}</div>
                </div>
              </div>

              {/* Per-location table */}
              {hasSlots && (
                <div className="rounded-[12px] border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-s2 text-text-secondary border-b border-gray-200">
                        <th className="text-left px-5 py-3">ที่เก็บ</th>
                        <th className="text-right px-5 py-3">สต๊อก</th>
                        <th className="text-right px-5 py-3">จอง</th>
                        <th className="text-right px-5 py-3 text-text-primary">คงเหลือ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slots!.map((s, i) => {
                        const type = slotType(s.locationId);
                        const isOffline = type === 'offline';
                        const avail = s.locationAvailable;
                        return (
                          <tr key={s.locationId + i} className="border-b border-gray-100 last:border-b-0">
                            <td className="px-5 py-3.5 align-middle">
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-b4 font-medium ${
                                  isOffline ? 'bg-[#E5F2FF] text-[#0197FF]' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {isOffline ? 'หน้าร้าน' : 'ออนไลน์'}
                                </span>
                                <span className="text-b3 text-text-primary font-mono">
                                  {s.locationName ?? s.locationCode ?? s.locationId}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right text-b3 tabular-nums text-text-secondary align-middle">
                              {s.locationStock.toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-right text-b3 tabular-nums align-middle">
                              {s.locationReserved > 0
                                ? <span className="text-status-danger font-medium">-{s.locationReserved}</span>
                                : <span className="text-text-muted">0</span>}
                            </td>
                            <td className="px-5 py-3.5 text-right align-middle">
                              <span className={`text-s1 tabular-nums font-bold ${avail > 0 ? 'text-status-success' : 'text-status-danger'}`}>
                                {avail.toLocaleString()}
                              </span>
                              <span className="text-b4 text-text-muted ml-1.5">{unit}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-bg-page border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-[12px] text-s2 text-text-primary bg-white border border-gray-300 transition hover:bg-bg-page-2">
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}

function FKey({
  hotkey, label, icon: Icon, count, onClick, disabled,
}: {
  hotkey?: string; label: string; icon?: typeof Search;
  count?: number; onClick?: () => void; iconOnly?: boolean; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
      className={`flex flex-col items-center justify-center min-w-[120px] h-20 px-3 rounded-[12px] transition-[filter,box-shadow] duration-200 ${
        disabled
          ? 'bg-gray-100 opacity-40 cursor-not-allowed'
          : 'bg-blue-100 hover:brightness-95'
      }`}>
      {hotkey && (
        <span className={`text-h5 leading-none mb-1 ${disabled ? 'text-gray-400' : 'text-brand-navy'}`}>
          {hotkey}
        </span>
      )}
      <span className={`flex items-center gap-1.5 text-b4 leading-none ${disabled ? 'text-gray-400' : 'text-black'}`}>
        {Icon && <Icon className={`w-5 h-5 ${disabled ? 'text-gray-400' : 'text-black'}`} />}
        {label}
        {typeof count === 'number' && (
          <span className="text-c3 font-bold text-brand-blue">({count})</span>
        )}
      </span>
    </button>
  );
}

function WalkInCard({ onSearch: _onSearch, onRegister }: { onSearch: () => void; onRegister: () => void }) {
  return (
    <div className="rounded-[16px] p-4 space-y-3" style={{ backgroundColor: '#111827' }}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <UserCircle className="w-6 h-6 text-white/80" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-h4 text-white">Walk-in Customer</div>
          <div className="text-b3 text-white/70">ไม่มีบันทึกการเป็นสมาชิก</div>
        </div>
      </div>
      <button onClick={onRegister}
        className="flex items-center justify-center gap-2 h-12 w-full rounded-[12px] text-s2 !font-extrabold transition hover:brightness-95"
        style={{ backgroundColor: YELLOW, color: NAVY }}>
        <Plus className="w-5 h-5" /> สมัครสมาชิก
      </button>
    </div>
  );
}

function CustomerCard({ customer, onClear: _onClear, cartTotal = 0, onApproveCredit }: {
  customer: Customer;
  onClear: () => void;
  cartTotal?: number;
  onApproveCredit?: () => void;
}) {
  const credit = customer.creditLimit ?? 0;
  const used = customer.creditUsed ?? 0;
  const remaining = credit - used;
  const points = customer.rewardPoints ?? 0;
  const [showInfo, setShowInfo] = useState(false);

  // Credit calculations
  const totalUsed = used + cartTotal;                                              // projected after this order
  const usedPct   = credit > 0 ? Math.min(100, Math.round((totalUsed / credit) * 100)) : 0;
  const isFullyUsed = credit > 0 && remaining <= 0;
  const isOverLimit = credit > 0 && cartTotal > 0 && cartTotal > remaining;
  const barColor = usedPct >= 100 ? '#DC2626' : usedPct >= 80 ? '#F59E0B' : '#16A34A';
  const pctColor = usedPct >= 100 ? '#DC2626' : usedPct >= 80 ? '#F59E0B' : '#16A34A';
  const fmtBath2dp = (n: number) => '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ประเภทลูกค้า — DB codes: Y=ยงเจริญ, M=บุคคลทั่วไป, N=นิติบุคคล, A=Agent
  // API normalizes some values → map both raw codes & API labels
  const TYPE_MAP: Record<string, { label: string; bg: string }> = {
    // Raw DB codes
    y:       { label: 'Y', bg: '#7C3AED' }, // violet — Yongcharoen internal
    m:       { label: 'M', bg: '#16A34A' }, // green  — บุคคลทั่วไป / Member
    n:       { label: 'N', bg: '#0EA5E9' }, // blue   — นิติบุคคล
    a:       { label: 'A', bg: '#D97706' }, // amber  — Agent / ตัวแทน
    // API-normalized aliases
    person:   { label: 'M', bg: '#16A34A' },
    company:  { label: 'N', bg: '#0EA5E9' },
    business: { label: 'N', bg: '#0EA5E9' },
    prospect: { label: 'A', bg: '#D97706' },
  };
  const typeKey = String(customer.type ?? '').toLowerCase();
  const customerTypeInfo = TYPE_MAP[typeKey] ?? { label: String(customer.type ?? 'M').toUpperCase().slice(0,1), bg: '#16A34A' };

  const fmtBath = (n: number) => '฿' + n.toLocaleString('th-TH', { maximumFractionDigits: 0 });

  // format phone number list
  const phones = [customer.phone, ...(customer.phones ?? [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  const emails = [customer.email, ...(customer.emails ?? [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  const addressText = (() => {
    const a = customer.addresses?.find(a => a.type === 'billing') ?? customer.addresses?.[0];
    if (a) return [a.address, a.district, a.province, a.postalCode].filter(Boolean).join(' ');
    return [customer.address, customer.district, customer.province, customer.postalCode].filter(Boolean).join(' ') || undefined;
  })();

  return (
    <>
    {/* ── Customer Info Dialog ── */}
    {showInfo && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInfo(false)} />
        <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-[800px] mx-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ backgroundColor: NAVY }}>
            <div className="text-h5 text-white">ข้อมูลลูกค้า</div>
            <button onClick={() => setShowInfo(false)} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Body */}
          <div className="p-4 space-y-6">
            {/* รหัสลูกค้า */}
            <div>
              <div className="text-b4 text-text-secondary">รหัสลูกค้า :</div>
              <div className="text-s1 text-text-primary mt-1">{customer.code || customer.id}</div>
            </div>
            {/* ชื่อลูกค้า */}
            <div>
              <div className="text-b4 text-text-secondary">ชื่อลูกค้า :</div>
              <div className="text-s1 text-text-primary mt-1">{customer.name}</div>
            </div>
            {/* เบอร์โทร */}
            <div>
              <div className="text-b4 text-text-secondary">เบอร์โทรติดต่อ :</div>
              {phones.length > 0 ? phones.map((p, i) => (
                <div key={i} className="text-s1 text-text-primary mt-1">{p}</div>
              )) : <div className="text-s1 text-text-muted mt-1">—</div>}
            </div>
            {/* Email — แสดงถ้ามี */}
            {emails.length > 0 && (
              <div>
                <div className="text-b4 text-text-secondary">อีเมล :</div>
                {emails.map((e, i) => (
                  <div key={i} className="text-s1 text-text-primary mt-1">{e}</div>
                ))}
              </div>
            )}
            {/* ที่อยู่ — แสดงถ้ามี */}
            {addressText && (
              <div>
                <div className="text-b4 text-text-secondary">ที่อยู่ :</div>
                <div className="text-s1 text-text-primary mt-1 leading-relaxed">{addressText}</div>
              </div>
            )}
            {/* วงเงินเครดิต — แสดงเสมอ */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-b4 text-text-secondary mb-3">วงเงินเครดิต</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[12px] bg-bg-page-2 px-3 py-3 text-center">
                  <div className="text-c1 text-text-muted">วงเงินเครดิตทั้งหมด</div>
                  <div className="text-s1 text-brand-navy tabular-nums mt-1">{fmtBath(credit)}</div>
                </div>
                <div className="rounded-[12px] bg-bg-page-2 px-3 py-3 text-center">
                  <div className="text-c1 text-text-muted">วงเงินเครดิตที่ใช้</div>
                  <div className="text-s1 tabular-nums mt-1" style={{ color: used > 0 ? '#DC2626' : undefined }}>
                    {fmtBath(used)}
                  </div>
                </div>
                <div className="rounded-[12px] px-3 py-3 text-center" style={{ backgroundColor: remaining > 0 ? '#F0FDF4' : remaining < 0 ? '#FEF2F2' : '#F9FAFB' }}>
                  <div className="text-c1 text-text-muted">วงเงินเครดิตคงเหลือ</div>
                  <div
                    className="text-s1 tabular-nums mt-1 font-bold"
                    style={{ color: remaining > 0 ? '#16A34A' : remaining < 0 ? '#DC2626' : '#6B7280' }}
                  >
                    {fmtBath(remaining)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="p-4 bg-bg-page flex gap-3">
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="flex-1 h-13 rounded-[12px] border border-gray-300 bg-white text-s2 text-text-primary hover:bg-bg-page-2 transition"
              style={{ height: '52px' }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="flex-1 h-13 rounded-[12px] text-s2 font-extrabold transition hover:brightness-95"
              style={{ height: '52px', backgroundColor: YELLOW, color: NAVY }}
            >
              Enter - ตกลง
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="rounded-[16px] p-3 space-y-3" style={{ backgroundColor: '#111827' }}>
      {/* Header: avatar + name + type badge */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-[12px] bg-brand-blue flex items-center justify-center shrink-0">
          <User className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-h4 text-white leading-tight">{customer.name}</div>
          <div className="text-c1 text-white/60 mt-1 truncate">ID : {customer.code || customer.id}</div>
        </div>
        <div className="rounded-[12px] px-3 py-2 text-center shrink-0" style={{ backgroundColor: customerTypeInfo.bg }}>
          <div className="text-c3 text-white leading-none">ประเภทลูกค้า</div>
          <div className="text-h4 text-white leading-none mt-1">{customerTypeInfo.label}</div>
        </div>
      </div>

      {/* Tier badges */}
      {(() => {
        const t = TIER_MAP[customer.tier] ?? { bg: 'bg-neutral-100', text: 'text-neutral-700', label: customer.tier };
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-b4 ${t.bg} ${t.text}`}>
              <Crown className="w-4 h-4" /> {t.label}
            </div>
            <div className="rounded-full border border-white/30 px-4 py-1.5 text-b4 text-white">
              Tier : {customer.priceTier}
            </div>
          </div>
        );
      })()}

      {/* ข้อมูลเพิ่มเติม link */}
      <div className="flex items-center justify-center">
        <button
          className="text-c1 text-brand-blue hover:underline underline"
          onClick={() => setShowInfo(true)}
        >
          ข้อมูลเพิ่มเติม
        </button>
      </div>

      {/* Reward points card */}
      <div className="rounded-[12px] bg-white overflow-hidden">
        {/* Blue header band */}
        <div className="px-4 py-2" style={{ backgroundColor: '#EFF6FF' }}>
          <div className="text-c1 font-semibold text-brand-blue">คะแนนสะสม</div>
        </div>
        <div className="px-4 pb-4 pt-3">
          <div className="flex items-baseline justify-between">
            <div className="text-h3 text-brand-navy tabular-nums">{points.toLocaleString()}</div>
            <div className="text-c1 text-text-secondary">Point</div>
          </div>
          {(customer.pointsExpiring ?? 0) > 0 && customer.pointsExpiryDate && (
            <div className="text-c2 text-text-muted mt-1">
              {customer.pointsExpiring!.toLocaleString()} Point จะหมดอายุวันที่ {fmtThaiBE(customer.pointsExpiryDate)}
            </div>
          )}
        </div>
      </div>

      {/* Credit limit card — hidden when no credit */}
      {credit > 0 && (
        <div className="rounded-[12px] bg-white overflow-hidden">
          {/* Blue header band: label only */}
          <div className="px-4 py-2" style={{ backgroundColor: '#EFF6FF' }}>
            <div className="text-c1 font-semibold text-brand-blue">วงเงินเครดิต</div>
          </div>

          <div className="px-4 pb-4 pt-3">
            {/* วงเงินที่ใช้ row — inside white area */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-c1 text-text-secondary">วงเงินที่ใช้</span>
              <span className="text-c1 font-semibold tabular-nums" style={{ color: pctColor }}>{usedPct}%</span>
            </div>

            {/* Big used amount */}
            <div className="text-h3 tabular-nums font-bold mb-2" style={{ color: isFullyUsed ? '#DC2626' : NAVY }}>
              {fmtBath2dp(used)}
            </div>

            {/* Progress bar — (used + cartTotal) / credit */}
            <div className="h-2 rounded-full mb-3" style={{ backgroundColor: '#E5E7EB' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${usedPct}%`, backgroundColor: barColor }}
              />
            </div>

            {/* วงเงินคงเหลือ row */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-c1 text-text-secondary">วงเงินเครดิตคงเหลือ</span>
              <span className="text-c1 tabular-nums font-medium" style={{ color: remaining <= 0 ? '#DC2626' : '#111827' }}>
                {fmtBath2dp(remaining)}
              </span>
            </div>

            {/* Detail box */}
            <div className="rounded-[10px] border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-c2 text-text-secondary">รวมวงเงินทั้งหมด</span>
                <span className="text-c2 tabular-nums font-bold text-text-primary">{fmtBath2dp(credit)}</span>
              </div>
            </div>

          {/* Over-limit warning — cart total exceeds remaining credit */}
          {isOverLimit && (
            <>
              <div className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-3">
                <div className="text-c1 font-bold text-red-600 mb-2">ยอดสั่งซื้อเกินวงเงินเครดิตคงเหลือ</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-c2 text-text-secondary">วงเงินคงเหลือ</span>
                    <span className="text-c2 tabular-nums text-text-primary">{fmtBath2dp(remaining)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-c2 text-text-secondary">ยอดสั่งซื้อ</span>
                    <span className="text-c2 tabular-nums text-red-600">{fmtBath2dp(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-red-200 mt-1">
                    <span className="text-c1 font-bold text-red-600">เกิน</span>
                    <span className="text-c1 tabular-nums font-bold text-red-600">{fmtBath2dp(cartTotal - remaining)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onApproveCredit}
                className="mt-2 w-full h-10 rounded-[10px] text-s2 transition hover:brightness-95"
                style={{ backgroundColor: YELLOW, color: NAVY }}
              >
                อนุมัติ
              </button>
            </>
          )}
          </div>
        </div>
      )}
    </div>
    </> // end fragment
  );
}

/**
 * Parse a brand-promo reward string into a display-friendly { qty, unit }:
 *  - "ของขวัญ 1 ชิ้น" → { qty: 1, unit: 'ชิ้น' }
 *  - "ของขวัญ 2 ชุด"  → { qty: 2, unit: 'ชุด' }
 *  - "ส่วนลด 5%"      → { qty: 1, unit: 'ใบ' }    (a single discount coupon)
 *  - fallback         → { qty: 1, unit: 'ชิ้น' }
 */
function parseBrandReward(reward: string): { qty: number; unit: string } {
  if (/ส่วนลด|%/.test(reward)) return { qty: 1, unit: 'ใบ' };
  const m = reward.match(/(\d+)\s*(ชิ้น|ชุด|ตัว|อัน|ใบ|กล่อง|แพ็ก)/);
  if (m) return { qty: parseInt(m[1], 10), unit: m[2] };
  return { qty: 1, unit: 'ชิ้น' };
}

function SidebarSection({ icon: Icon, title, count, action, children }: {
  icon: typeof Sparkles; title: string; count?: number; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="mt-5 pt-5 border-t border-gray-200 [&:first-child]:border-t-0 [&:first-child]:pt-0">
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-1.5 text-brand-navy text-s2">
          <Icon className="w-5 h-5 text-brand-navy" />{title}
        </div>
        {action ?? (typeof count === 'number' && <span className="text-c2 text-text-muted">{count} รายการ</span>)}
      </div>
      {children}
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function POSScreen() {
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [productMap, setProductMap] = useState<Map<string, ApiProduct>>(new Map());
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchMode, setCustomerSearchMode] = useState<'search' | 'change'>('search');
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showCartPending, setShowCartPending] = useState(false);
  const [supervisorAuth, setSupervisorAuth] = useState<{ mode: SupervisorAuthMode; targetSku?: string } | null>(null);
  const [showCreditApproval, setShowCreditApproval] = useState(false);
  /** Per-line fulfillment: 'pickup' (รับเองหน้าร้าน) | 'delivery' (จัดส่ง). Default 'pickup'. */
  const [fulfillmentMap, setFulfillmentMap] = useState<Record<string, 'pickup' | 'delivery'>>({});
  const [showFulfillmentConfirm, setShowFulfillmentConfirm] = useState(false);
  const [pendingBulkFulfillment, setPendingBulkFulfillment] = useState<'pickup' | 'delivery' | null>(null);
  const [showFulfillmentSummary, setShowFulfillmentSummary] = useState(false);
  /** true = opened from F11 path (show full bill summary + footer); false = opened from "ดูเพิ่มเติม" (peek, no totals/footer) */
  const [showFulfillmentSummaryFull, setShowFulfillmentSummaryFull] = useState(false);
  const [showOtherMenus, setShowOtherMenus] = useState(false);
  const [showDeliveryDoc, setShowDeliveryDoc] = useState(false);
  /** Single intercept popup before final bill summary (covers unscanned gifts + near-promo). */
  const [showBillIntercept, setShowBillIntercept] = useState(false);
  /** Final "Order placed" success popup shown after the cashier confirms the bill. */
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [billSeq, setBillSeq] = useState(1);
  const [now, setNow] = useState(new Date());
  const [pendingQty, setPendingQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [showSlipUpload, setShowSlipUpload] = useState(false);
  const [pendingSlipOrderId, setPendingSlipOrderId] = useState<string | null>(null);
  const [pendingSlipAmount, setPendingSlipAmount] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInitialQuery, setPickerInitialQuery] = useState('');
  /** SKU currently shown in stock-check dialog (null = hidden) */
  const [stockCheckSku, setStockCheckSku] = useState<string | null>(null);
  /** Fresh product data fetched when stock-check dialog opens */
  const [stockCheckProduct, setStockCheckProduct] = useState<ApiProduct | null>(null);
  const [stockCheckLoading, setStockCheckLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ApiProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tracks which SKUs have already had a product-detail fetch dispatched (prevents duplicate calls). */
  const fetchedSkusRef = useRef(new Set<string>());
  const navigate = useNavigate();
  // ─── Order fulfillment & shipping ───────────────────────────────────────────

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [selectedCourier, setSelectedCourier] = useState('Flash Express')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  /** Addresses added in this session (not yet persisted to backend). Reset when customer changes. */
  const [sessionAddresses, setSessionAddresses] = useState<Address[]>([])
  /** Optional in-session override of which address is the default. */
  const [sessionDefaultAddressId, setSessionDefaultAddressId] = useState<string | null>(null)
  const customerIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (customerIdRef.current !== (customer?.id ?? null)) {
      customerIdRef.current = customer?.id ?? null
      setSessionAddresses([])
      setSessionDefaultAddressId(null)
    }
  }, [customer])
  // ─── Coupons ──────────────────────────────────────────────────────────────
  const [appliedCoupons, setAppliedCoupons] = useState<{id: string; label: string; amount: number; color: 'sky'|'red'|'green'|'amber'|'orange'|'teal'|'blue'|'purple'; detail?: string; minPurchase?: number; daysUntilExpiry?: number}[]>([])
  const [showCouponDialog, setShowCouponDialog] = useState(false)
  // ─── Packaging ────────────────────────────────────────────────────────────
  const [packaging, setPackaging] = useState<SelectedPackaging[]>([])
  const [showPackagingDialog, setShowPackagingDialog] = useState(false)
  // ─── Summary discount toggle ──────────────────────────────────────────────
  const [showDiscountDetail, setShowDiscountDetail] = useState(false)
  // ─── Mock claimed promo state ─────────────────────────────────────────────
  const [claimedBuyGetSkus, setClaimedBuyGetSkus] = useState<Set<string>>(new Set())
  const [claimedOrderGiftIds, setClaimedOrderGiftIds] = useState<Set<string>>(new Set())
  const [claimedBrandPromoNames, setClaimedBrandPromoNames] = useState<Set<string>>(new Set())
  const [claimedRewardIds, setClaimedRewardIds] = useState<Set<string>>(new Set())

  /** BroadcastChannel to /display customer screen */
  const displayChannelRef = useRef<BroadcastChannel | null>(null);
  /** SKU most recently added/scanned — sent to customer display for highlight */
  const lastScannedSkuRef = useRef<string | null>(null);
  /** Always-fresh broadcast function — updated each render so ping handler avoids stale closure */
  const broadcastToDisplayRef = useRef<(() => void) | null>(null);
  /** Debounce timer for customer display broadcast */
  const broadcastDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open customer display BroadcastChannel on mount; handle ping from /display
  useEffect(() => {
    const ch = new BroadcastChannel(DISPLAY_CHANNEL);
    displayChannelRef.current = ch;
    // When /display tab opens it sends a ping — respond with current cart immediately
    ch.onmessage = () => {
      broadcastToDisplayRef.current?.();
    };
    return () => {
      ch.postMessage({ type: 'idle' } satisfies DisplayMessage);
      ch.close();
      displayChannelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch((err: unknown) => {
        if ((err as { status?: number }).status === 401) navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Close settings dropdown on outside click / Escape
  useEffect(() => {
    if (!showSettingsMenu) return;
    const onClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettingsMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showSettingsMenu]);

  // Live typeahead suggestions for the barcode/SKU bar (2+ chars, 250ms debounce)
  useEffect(() => {
    const q = barcodeInput.trim();
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const res = await searchProducts(q);
        setSuggestions(res.slice(0, 8));
        setShowSuggestions(true);
      } catch (err: unknown) {
        console.error('[suggestions] failed', err);
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 250);
    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [barcodeInput]);

  // Hydrate productMap with images whenever new SKUs appear in the cart
  // (covers: loading an existing session, restoring a held bill, or any gap where
  // handlePickerSelect/handleBarcodeSubmit didn't pre-populate the map).
  useEffect(() => {
    const missing = cartItems.filter(i => !fetchedSkusRef.current.has(i.sku));
    if (missing.length === 0) return;
    missing.forEach(i => fetchedSkusRef.current.add(i.sku));

    Promise.allSettled(missing.map(i => getProductBySku(i.sku)))
      .then(results => {
        const entries: [string, ApiProduct][] = [];
        results.forEach(r => {
          if (r.status === 'fulfilled') entries.push([r.value.sku, r.value]);
        });
        if (entries.length > 0) {
          setProductMap(prev => {
            const next = new Map(prev);
            entries.forEach(([k, v]) => next.set(k, v));
            return next;
          });
        }
      })
      .catch(err => console.error('[POSScreen] hydrate product images failed', err));
  }, [cartItems]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      // Try GET /pos/cart/active first; if backend errors (e.g. 500),
      // fall back to POST /pos/cart which is idempotent per spec
      // ("If the staff already has an active cart, returns the existing one").
      let active: PosCart | null = null;
      try {
        active = await getActiveCart();
      } catch (err: unknown) {
        console.warn('[POSScreen] getActiveCart failed, falling back to createCart', err);
      }
      try {
        if (active && active.status === 'active') {
          setCartId(active.id);
          setCartItems(active.items);
        } else {
          const fresh = await createCart();
          setCartId(fresh.id);
          setCartItems(fresh.items ?? []);
        }
      } catch (err: unknown) {
        console.error('[POSScreen] failed to init cart', err);
        const e = err as { status?: number; message?: string };
        showError(e.status
          ? `โหลด cart ไม่สำเร็จ (HTTP ${e.status}): ${e.message ?? ''}`
          : `เชื่อมต่อ API ไม่ได้: ${e.message ?? ''}`);
      }
    })();
  }, []);

  const applyCartResponse = (cart: PosCart) => {
    setCartId(cart.id);
    setCartItems(cart.items);
  };

  /**
   * Backend marks carts as `abandoned` after TTL (15 min) or via explicit sweep.
   * Subsequent writes against that cartId fail with "Cart is abandoned, not active".
   * Detect this so we can transparently rebuild the cart and retry once.
   */
  const isAbandonedCartError = (err: unknown): boolean => {
    if (typeof err !== 'object' || !err) return false;
    const e = err as { status?: number; message?: string };
    return /abandon|not active|expired/i.test(e.message ?? '');
  };

  /**
   * Add a SKU to the active cart. If the cached cartId points to an abandoned
   * cart we transparently spin up a fresh cart and retry once.
   */
  const addItemWithRecovery = async (sku: string, qty: number): Promise<PosCart> => {
    const id = await ensureCartId();
    if (!id) throw new Error('No cart available');
    try {
      return await addItem(id, sku, qty);
    } catch (err) {
      if (!isAbandonedCartError(err)) throw err;
      // Stale cartId — discard, create a fresh cart, retry once.
      console.warn('[POS] cached cart abandoned — rebuilding');
      setCartId(null);
      setCartItems([]);
      const fresh = await createCart();
      setCartId(fresh.id);
      setCartItems(fresh.items ?? []);
      return await addItem(fresh.id, sku, qty);
    }
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 8000);
  };

  const handleSuggestionPick = async (product: ApiProduct) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setBarcodeInput('');
    await handlePickerSelect(product, pendingQty);
    setPendingQty(1);
    barcodeRef.current?.focus();
  };

  const handlePickerSelect = async (product: ApiProduct, qty: number) => {
    const id = await ensureCartId();
    if (!id) return;
    setApiLoading(true);
    try {
      setProductMap(prev => new Map(prev).set(product.sku, product));
      lastScannedSkuRef.current = product.sku;
      const updated = await addItemWithRecovery(product.sku, qty);
      applyCartResponse(updated);
      setBarcodeInput('');
      setPendingQty(1);
    } catch (err: unknown) {
      console.error('[handlePickerSelect] failed', err);
      const e = err as { status?: number; message?: string };
      if (e.status === 409) {
        const m = (e.message ?? '').match(/for ([^:]+): requested \+(\d+), available (\d+)/);
        if (m) showError(`สต็อกไม่พอ — สินค้า ${m[1]} ขอ ${m[2]} แต่เหลือ ${m[3]}`);
        else showError(e.message ?? 'สต็อกสินค้าไม่เพียงพอ');
      } else {
        showError(e.message ?? 'เพิ่มสินค้าไม่สำเร็จ');
      }
    } finally {
      setApiLoading(false);
    }
  };

  // Lazy-init cart on demand: needed only when actually adding an item.
  // Search-only operations (barcode/SKU lookup) don't depend on cart.
  const ensureCartId = async (): Promise<string | null> => {
    if (cartId) return cartId;
    try {
      const fresh = await createCart();
      setCartId(fresh.id);
      setCartItems(fresh.items ?? []);
      return fresh.id;
    } catch (err: unknown) {
      console.error('[ensureCartId] createCart failed', err);
      const e = err as { status?: number; message?: string };
      showError(e.status
        ? `สร้าง cart ไม่ได้ (HTTP ${e.status}): ${e.message ?? ''}`
        : `เชื่อมต่อ API ไม่ได้: ${e.message ?? ''}`);
      return null;
    }
  };

  const handleBarcodeSubmit = async () => {
    const q = barcodeInput.trim();
    if (!q) { showError('กรุณาสแกนบาร์โค้ดหรือพิมพ์ SKU'); barcodeRef.current?.focus(); return; }
    setApiLoading(true);
    try {
      // 1) Look up product. Only treat as exact match when sku or barcode equals q
      // (the /products?barcode= filter currently isn't strict on the backend, so we
      //  must verify before adding — otherwise we could grab an unrelated product).
      const byBarcode = await getProductByBarcode(q);
      let exact = byBarcode.find(p => p.sku === q || p.barcode === q);
      if (!exact) {
        const bySearch = await searchProducts(q);
        exact = bySearch.find(p => p.sku === q || p.barcode === q);
      }
      if (!exact) {
        // No exact match — keep typeahead suggestions open so cashier can pick.
        setShowSuggestions(true);
        return;
      }
      setProductMap(prev => new Map(prev).set(exact!.sku, exact!));
      const sku = exact.sku;
      lastScannedSkuRef.current = sku;
      const updated = await addItemWithRecovery(sku, pendingQty);
      applyCartResponse(updated);
      setBarcodeInput('');
      setPendingQty(1);
      qtyRef.current?.select();
    } catch (err: unknown) {
      console.error('[handleBarcodeSubmit] failed', err);
      const e = err as { status?: number; message?: string };
      if (e.status === 409) {
        // Backend message format: "Insufficient offline stock for SKU-X: requested +N, available M"
        const m = (e.message ?? '').match(/for ([^:]+): requested \+(\d+), available (\d+)/);
        if (m) {
          const [, sku, requested, available] = m;
          showError(`สต็อกไม่พอ — สินค้า ${sku} ขอ ${requested} แต่เหลือ ${available}`);
        } else {
          showError(e.message ?? 'สต็อกสินค้าไม่เพียงพอ');
        }
      }
      else if (e.status === 403) showError('ไม่มีสิทธิ์เข้าถึงข้อมูลสินค้า (403)');
      else if (e.status === 404) showError('ไม่พบสินค้า');
      else if (e.status) showError(`API error ${e.status}: ${e.message ?? ''}`);
      else showError(`เชื่อมต่อ API ไม่ได้: ${e.message ?? ''}`);
    } finally {
      setApiLoading(false);
    }
  };

  const handleQtyChange = async (sku: string, qty: number) => {
    if (!cartId) return;
    try {
      const updated = await setItemQty(cartId, sku, qty);
      applyCartResponse(updated);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 409) showError('สต็อกสินค้าไม่เพียงพอ');
      else showError('เกิดข้อผิดพลาด');
    }
  };

  const handleRemoveItem = async (sku: string) => {
    if (!cartId) return;
    try {
      await removeItem(cartId, sku);
      setCartItems(prev => prev.filter(i => i.sku !== sku));
    } catch {
      showError('เกิดข้อผิดพลาด');
    }
  };

  // F3 ยกเลิกรายการ — remove all items
  const handleClearItems = async () => {
    if (!cartId) return;
    try {
      await Promise.all(cartItems.map(i => removeItem(cartId, i.sku)));
      setCartItems([]);
    } catch {
      showError('เกิดข้อผิดพลาด');
    }
  };

  const handleAbandonBill = async () => {
    if (!cartId) return;
    try {
      await abandonCart(cartId);
    } catch { /* ignore */ }
    try {
      const fresh = await createCart();
      applyCartResponse(fresh);
      setCustomer(null);
      setBillSeq(n => n + 1);
    } catch { /* ignore */ }
  };

  // F5 holdBill: snapshots cart locally + abandons server cart so reserves go back to other registers.
  // Restore later re-adds items to a fresh cart (re-reserving against current stock).
  const holdBill = async (): Promise<void> => {
    if (cartItems.length === 0 || !cartId) return;
    const displayItems = cartItems.map(item => {
      const p = productMap.get(item.sku);
      return {
        product: p
          ? {
              id: p.id, sku: p.sku, name: p.name, price: parseFloat(item.unitPrice),
              unit: p.unit, image: p.image ?? '', brand: p.brand ?? '',
              stock: p.locationStock
                ? p.locationStock.filter(s => ['1','2'].includes(String(s.locationId).charAt(0))).reduce((sum, s) => sum + s.locationAvailable, 0)
                : Math.max(0, p.stockOffline - p.reservedOffline),
              barcode: p.barcode,
            }
          : { id: item.sku, sku: item.sku, name: item.sku, price: parseFloat(item.unitPrice), unit: 'ชิ้น', image: '', brand: '', stock: 99 },
        qty: item.qty,
        fulfillment: 'delivery' as const,
      };
    });
    const total = cartItems.reduce((s, i) => s + parseFloat(i.unitPrice) * i.qty, 0);
    const held: HeldBill = {
      id: `#POS-${String(billSeq).padStart(3, '0')}-${cartId.slice(-4)}`,
      heldAt: new Date(),
      customer,
      items: displayItems as HeldBill['items'],
      total,
    };
    setHeldBills(prev => [held, ...prev]);
    try { await abandonCart(cartId); } catch { /* ignore */ }
    try {
      const fresh = await createCart();
      applyCartResponse(fresh);
      setCustomer(null);
      setBillSeq(n => n + 1);
    } catch {
      showError('สร้างบิลใหม่ไม่สำเร็จ — กรุณาลองใหม่');
    }
  };

  const restoreBill = async (bill: HeldBill) => {
    setApiLoading(true);
    try {
      if (cartItems.length > 0) await holdBill();
      const fresh = await createCart(bill.customer?.id);
      const skus = bill.items.map(i => i.product.sku);
      const fetched = await Promise.all(skus.map(sku => searchProducts(sku).catch(() => [])));
      setProductMap(prev => {
        const next = new Map(prev);
        fetched.flat().forEach(p => { if (p) next.set(p.sku, p); });
        return next;
      });
      let latest: PosCart = fresh;
      for (const item of bill.items) {
        try {
          latest = await addItem(fresh.id, item.product.sku, item.qty);
        } catch (err: unknown) {
          const status = (err as { status?: number }).status;
          showError(status === 409
            ? `สต็อก ${item.product.sku} ไม่พอ — เหลือไม่ครบ ${item.qty}`
            : `เพิ่ม ${item.product.sku} ไม่สำเร็จ`);
        }
      }
      applyCartResponse(latest);
      setCustomer(bill.customer);
      setHeldBills(prev => prev.filter(b => b.id !== bill.id));
    } finally {
      setApiLoading(false);
    }
  };

  const deleteHeldBill = (billId: string) => setHeldBills(prev => prev.filter(b => b.id !== billId));

  const PAYMENT_METHOD_MAP: Record<'cash' | 'card' | 'credit' | 'qr', 'cash' | 'credit-card' | 'credit-limit' | 'qr-code'> = {
    cash: 'cash',
    card: 'credit-card',
    credit: 'credit-limit',
    qr: 'qr-code',
  };

  const handlePaymentConfirm = async (method: 'cash' | 'card' | 'credit' | 'qr') => {
    if (!cartId) return;
    const apiMethod = PAYMENT_METHOD_MAP[method];
    const grand = totals.grand;

    try {
      const result = await checkout(cartId, apiMethod, customer?.id);
      const orderId = result?.order?.id ?? null;

      if (apiMethod === 'qr-code') {
        setPendingSlipOrderId(orderId);
        setPendingSlipAmount(grand);
        setShowSlipUpload(true);
      } else {
        const fresh = await createCart();
        applyCartResponse(fresh);
        setCustomer(null);
        setBillSeq(n => n + 1);
      }
    } catch (err: unknown) {
      showError((err as Error).message ?? 'การชำระเงินล้มเหลว');
    }
  };

  const handleSlipUploaded = async () => {
    setShowSlipUpload(false);
    setPendingSlipOrderId(null);
    try {
      const fresh = await createCart();
      applyCartResponse(fresh);
      setCustomer(null);
      setBillSeq(n => n + 1);
    } catch { /* ignore — staff can retry create cart */ }
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch { /* ignore — still navigate to login */ }
    navigate('/login');
  };

  // Totals
  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((s, i) => s + parseFloat(i.unitPrice) * i.qty, 0);
    return { subtotal, grand: subtotal, count: cartItems.length };
  }, [cartItems]);

  // ─── Mock promotions derived from cart ────────────────────────────────────
  /** Items whose brand hash qualifies for "ซื้อ 2 แถม 1" (mock) */
  const mockBuyGetItems = useMemo(() => {
    if (!customer || cartItems.length === 0) return []
    return cartItems.filter(item => {
      const p = productMap.get(item.sku)
      if (!p?.brand) return false
      const hash = p.brand.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
      return hash % 5 === 0
    })
  }, [cartItems, productMap, customer])

  /** Brand promo progress bars (mock — threshold ฿2,000 per brand) */
  const mockBrandPromos = useMemo(() => {
    if (!customer || cartItems.length === 0) return []
    const map = new Map<string, number>()
    cartItems.forEach(item => {
      const p = productMap.get(item.sku)
      if (!p?.brand) return
      map.set(p.brand, (map.get(p.brand) ?? 0) + parseFloat(item.unitPrice) * item.qty)
    })
    return [...map.entries()].slice(0, 2).map(([brand, spend]) => ({
      brand, spend, threshold: 2000,
      reward: brand.length % 2 === 0 ? 'ของขวัญ 1 ชิ้น' : 'ส่วนลด 5%',
    }))
  }, [cartItems, productMap, customer])

  /** Mock coupons available for customer */
  const mockAvailableCoupons = useMemo(() => {
    if (!customer) return []
    return [
      { id: 'c300', label: 'ส่วนลด ฿300', amount: 300, color: 'sky'    as const, detail: 'ใช้ได้ถึง: 31 ธ.ค. 2569 23.59 น.', minPurchase: 2000, daysUntilExpiry: 240 },
      { id: 'c500', label: 'ส่วนลด ฿500', amount: 500, color: 'red'    as const, detail: 'ใช้ได้ถึง: 31 ธ.ค. 2569 23.59 น.', minPurchase: 5000, daysUntilExpiry: 240 },
      { id: 'c100', label: 'ส่วนลด ฿100', amount: 100, color: 'green'  as const, detail: 'ใช้ได้ถึง: 31 ธ.ค. 2569 23.59 น.', minPurchase: 500,  daysUntilExpiry: 240 },
      { id: 'c30',  label: 'ส่วนลด ฿30',  amount: 30,  color: 'purple' as const, detail: 'ใช้ได้ถึง: 30 เม.ย. 2569 23.59 น.', minPurchase: 2000, daysUntilExpiry: 15  },
    ]
  }, [customer])

  /** Free gifts for reaching order total thresholds */
  const mockOrderGifts = useMemo(() => {
    if (!customer) return []
    return [
      { id: 'og1', name: 'กุญแจ ชุบนิเกิ้ล No.3040 (แพ็ก1ชุด)', qty: 1, unit: 'ชุด', threshold: 3000, image: undefined as string | undefined },
    ]
  }, [customer])

  /** Redeemed rewards from customer's point redemption */
  const mockRedeemedRewards = useMemo(() => {
    if (!customer) return []
    return [
      { id: 'rr1', name: 'โตชิบา หม้อหุงข้าว 1 ล. รุ่น RC-T10DR1', qty: 1, unit: 'ชิ้น', expiry: '31 ธ.ค. 2569', image: undefined as string | undefined },
      { id: 'rr2', name: 'Deli เครื่องคิดเลข 12 หลัก No.1238C (แพ็ก1ตัว)', qty: 1, unit: 'ตัว', expiry: '31 ธ.ค. 2569', image: undefined as string | undefined },
    ]
  }, [customer])

  /** Delivery addresses from customer */
  const deliveryAddresses = useMemo(() => {
    if (!customer) return []
    const from = customer.addresses?.filter(a => a.type === 'shipping') ?? []
    const base: Address[] = from.length === 0
      ? (() => {
          const addr = [customer.address, customer.district, customer.province, customer.postalCode].filter(Boolean).join(' ')
          if (!addr) return []
          return [{ id: 'default', type: 'shipping' as const, label: 'ที่อยู่หลัก', address: addr, district: '', province: '', postalCode: '', isDefault: true }]
        })()
      : from
    const combined = [...base, ...sessionAddresses]
    // Apply session-default override (cashier clicked the pin icon)
    if (sessionDefaultAddressId) {
      return combined.map(a => ({ ...a, isDefault: a.id === sessionDefaultAddressId }))
    }
    return combined
  }, [customer, sessionAddresses, sessionDefaultAddressId])

  const selectedAddress = deliveryAddresses.find(a => a.id === selectedAddressId) ?? deliveryAddresses[0]

  // (pickupCount / deliveryCount declared below — depends on free-row maps.)

  /** Discount breakdown for สรุปคำสั่งซื้อ */
  const discountBreakdown = useMemo(() => {
    const lines: { label: string; amount: number }[] = []
    mockBrandPromos.forEach(p => {
      if (p.spend >= p.threshold)
        lines.push({ label: `ส่วนลดโปรแบรนด์ ${p.brand.substring(0, 6)}...`, amount: Math.round(p.spend * 0.05) })
    })
    mockBuyGetItems.forEach(item => {
      const p = productMap.get(item.sku)
      lines.push({ label: `ส่วนลดสินค้า ${(p?.name ?? item.sku).substring(0, 8)}...`, amount: Math.round(parseFloat(item.unitPrice)) })
    })
    appliedCoupons.forEach(c => lines.push({ label: `ส่วนลดคูปอง ${c.label.replace('ส่วนลด ', '')}`, amount: c.amount }))
    return lines
  }, [mockBrandPromos, mockBuyGetItems, appliedCoupons, productMap])

  const totalDiscount = discountBreakdown.reduce((s, d) => s + d.amount, 0)
  const packagingCost = packaging.length > 0 ? 100 : 0
  const netTotal = Math.max(0, totals.subtotal - totalDiscount + packagingCost)

  /**
   * Synthetic "free items" displayed inline in the cart table after the user
   * has scanned/claimed them from the sidebar. Each claim flips the matching
   * sidebar badge to "รับแล้ว" AND surfaces a row here so cashier can verify
   * the customer actually received the item.
   *
   * Buy-get rows are indexed by SKU so they can be rendered immediately
   * after the parent purchased line, not at the bottom.
   */
  type FreeCartRow = {
    id: string;
    kind: 'buyget' | 'gift' | 'brand' | 'reward';
    productSku?: string;
    image?: string;
    name: string;
    qty: number;
    unit: string;
    subtitle?: string;
    badge?: string;
  };
  const buygetFreeBySku = useMemo<Map<string, FreeCartRow>>(() => {
    const m = new Map<string, FreeCartRow>()
    mockBuyGetItems.filter(i => claimedBuyGetSkus.has(i.sku)).forEach(item => {
      const p = productMap.get(item.sku)
      const brandHash = (p?.brand ?? item.sku).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
      const buyQty = brandHash % 2 === 0 ? 1 : 2
      const giftQty = Math.floor(item.qty / buyQty)
      m.set(item.sku, {
        id: `buyget-${item.sku}`,
        kind: 'buyget',
        productSku: item.sku,
        image: p?.image,
        name: p?.name ?? item.sku,
        qty: giftQty,
        unit: p?.unit ?? 'ชิ้น',
        badge: `ซื้อ ${buyQty} แถม 1`,
      })
    })
    return m
  }, [claimedBuyGetSkus, mockBuyGetItems, productMap])

  const otherFreeRows = useMemo<FreeCartRow[]>(() => {
    const rows: FreeCartRow[] = []
    // Order gifts (claimed)
    mockOrderGifts.filter(g => claimedOrderGiftIds.has(g.id)).forEach(gift => {
      rows.push({
        id: `gift-${gift.id}`,
        kind: 'gift',
        image: gift.image,
        name: gift.name,
        qty: gift.qty,
        unit: gift.unit,
        subtitle: 'โปรโมชั่นท้ายบิล',
      })
    })
    // Brand promos (claimed)
    mockBrandPromos.filter(b => claimedBrandPromoNames.has(b.brand)).forEach(bp => {
      const brandProduct = cartItems.find(ci => productMap.get(ci.sku)?.brand === bp.brand)
      const brandP = brandProduct ? productMap.get(brandProduct.sku) : undefined
      const rewardInfo = parseBrandReward(bp.reward)
      rows.push({
        id: `brand-${bp.brand}`,
        kind: 'brand',
        image: brandP?.image,
        name: `ยินดีด้วย! คุณได้รับ${bp.reward}`,
        qty: rewardInfo.qty,
        unit: rewardInfo.unit,
        subtitle: `โปรแบรนด์ ${bp.brand}`,
      })
    })
    // Redeemed rewards (claimed)
    mockRedeemedRewards.filter(r => claimedRewardIds.has(r.id)).forEach(reward => {
      rows.push({
        id: `reward-${reward.id}`,
        kind: 'reward',
        image: reward.image,
        name: reward.name,
        qty: reward.qty,
        unit: reward.unit,
        subtitle: 'ของรางวัลที่แลกไว้',
      })
    })
    return rows
  }, [claimedOrderGiftIds, claimedBrandPromoNames, claimedRewardIds, mockOrderGifts, mockBrandPromos, mockRedeemedRewards, productMap, cartItems])

  /** True iff there's any free row to render (used for empty-state check). */
  const hasAnyFreeRow = buygetFreeBySku.size > 0 || otherFreeRows.length > 0

  /**
   * Per-row fulfillment counts. Includes both cart items AND free rows
   * (buy-get, gift, brand, reward) so the bulk-toggle in the sidebar
   * reflects every row visible in the cart table — when any row is pickup
   * the "รับเองหน้าร้าน" button is active, and likewise for delivery.
   *
   * Free-row defaults:
   *   - Buy-get: inherits its parent SKU's mode
   *   - Other:   inherits dominant cart mode (delivery if it leads, else pickup)
   *   - Either can be explicitly overridden via fulfillmentMap[row.id]
   */
  const { pickupCount, deliveryCount } = useMemo(() => {
    let pickup = 0
    let delivery = 0
    cartItems.forEach(i => {
      const f = fulfillmentMap[i.sku] ?? 'pickup'
      if (f === 'pickup') pickup++; else delivery++
    })
    buygetFreeBySku.forEach((row, parentSku) => {
      const parentMode = fulfillmentMap[parentSku] ?? 'pickup'
      const f = fulfillmentMap[row.id] ?? parentMode
      if (f === 'pickup') pickup++; else delivery++
    })
    const cartPickup = cartItems.filter(i => (fulfillmentMap[i.sku] ?? 'pickup') === 'pickup').length
    const cartDelivery = cartItems.filter(i => fulfillmentMap[i.sku] === 'delivery').length
    const dominant: 'pickup' | 'delivery' = cartDelivery > cartPickup ? 'delivery' : 'pickup'
    otherFreeRows.forEach(row => {
      const f = fulfillmentMap[row.id] ?? dominant
      if (f === 'pickup') pickup++; else delivery++
    })
    return { pickupCount: pickup, deliveryCount: delivery }
  }, [cartItems, fulfillmentMap, buygetFreeBySku, otherFreeRows])
  const hasMixedFulfillment = pickupCount > 0 && deliveryCount > 0

  // Keep broadcastToDisplayRef always pointing to the latest snapshot (avoids stale closure in ping handler)
  broadcastToDisplayRef.current = () => {
    const ch = displayChannelRef.current;
    if (!ch) return;
    if (cartItems.length === 0) {
      ch.postMessage({ type: 'idle' } satisfies DisplayMessage);
      return;
    }
    ch.postMessage({
      type: 'cart-update',
      items: cartItems.map(item => {
        const product = productMap.get(item.sku);
        return {
          sku: item.sku,
          name: product?.name ?? item.sku,
          image: product?.image,
          unit: product?.unit ?? 'ชิ้น',
          qty: item.qty,
          unitPrice: parseFloat(item.unitPrice),
          lineTotal: parseFloat(item.unitPrice) * item.qty,
        };
      }),
      subtotal: totals.subtotal,
      discount: 0,
      grand: totals.grand,
      lastScannedSku: lastScannedSkuRef.current ?? undefined,
      cashier: me?.name ?? undefined,
      customerName: customer?.name ?? undefined,
    } satisfies DisplayMessage);
  };

  // Broadcast to customer display — debounced 150ms so rapid cartItems+productMap updates
  // (which fire in quick succession after a scan) are coalesced into a single send.
  useEffect(() => {
    if (broadcastDebounceRef.current) clearTimeout(broadcastDebounceRef.current);
    broadcastDebounceRef.current = setTimeout(() => {
      broadcastToDisplayRef.current?.();
    }, 150);
    return () => {
      if (broadcastDebounceRef.current) clearTimeout(broadcastDebounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, totals, customer, me, productMap]);

  const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const billId = `#POS-${String(billSeq).padStart(3, '0')}`;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F4F5F7]">
      <CartPendingDialog
        open={showCartPending}
        onClose={() => setShowCartPending(false)}
        onAction={(action: CartPendingAction) => {
          if (action === 'change-customer') {
            setCustomerSearchMode('change');
            setShowCustomerSearch(true);
          } else if (action === 'hold-bill') {
            setShowHoldDialog(true);
          } else if (action === 'cancel-bill') {
            setSupervisorAuth({ mode: 'cancel-bill' });
          }
        }}
      />
      <ChangePasswordDialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <CustomerSearchDialog open={showCustomerSearch} mode={customerSearchMode} onClose={() => setShowCustomerSearch(false)}
        onRegister={() => { setShowCustomerSearch(false); setShowRegister(true); }}
        onSelect={c => { setCustomer(c); setShowCustomerSearch(false); }} />

      <HoldBillDialog
        open={showHoldDialog}
        onCancel={() => setShowHoldDialog(false)}
        onConfirm={async () => { await holdBill(); }}
        onNextAction={(action: HoldNextAction) => {
          if (action === 'search') { setCustomerSearchMode('search'); setShowCustomerSearch(true); }
          else if (action === 'change') { setCustomerSearchMode('change'); setShowCustomerSearch(true); }
          /* 'menu' — placeholder for future menu */
        }}
      />

      <SupervisorAuthDialog
        open={supervisorAuth !== null}
        mode={supervisorAuth?.mode ?? 'cancel-bill'}
        onClose={() => setSupervisorAuth(null)}
        onConfirm={async (_creds) => {
          // TODO: validate credentials against backend (supervisor role).
          // For now, accept any non-empty credentials and proceed.
          if (supervisorAuth?.mode === 'cancel-bill') {
            handleAbandonBill();
          } else if (supervisorAuth?.mode === 'cancel-item' && supervisorAuth.targetSku) {
            handleRemoveItem(supervisorAuth.targetSku);
          }
        }}
      />

      <CreditApprovalDialog
        open={showCreditApproval}
        onClose={() => setShowCreditApproval(false)}
        onConfirm={() => { setShowCreditApproval(false); }}
        customerName={customer?.name ?? ''}
        customerCode={customer?.code ?? ''}
        remaining={(customer?.creditLimit ?? 0) - (customer?.creditUsed ?? 0)}
        cartTotal={totals.grand}
      />

      <AddressPickerDialog
        open={showAddressDialog}
        onClose={() => setShowAddressDialog(false)}
        addresses={deliveryAddresses}
        selectedId={selectedAddressId ?? (deliveryAddresses[0]?.id ?? null)}
        onConfirm={id => { setSelectedAddressId(id); setShowAddressDialog(false); }}
        onAddAddress={addr => {
          setSessionAddresses(prev => [...prev, addr]);
          setSelectedAddressId(addr.id);
        }}
        onSetDefault={id => setSessionDefaultAddressId(id)}
        customerName={customer?.name ?? ''}
        customerPhone={customer?.phone}
      />

      <PackagingPickerDialog
        open={showPackagingDialog}
        onClose={() => setShowPackagingDialog(false)}
        selected={packaging}
        onConfirm={items => { setPackaging(items); setShowPackagingDialog(false); }}
      />

      <CouponPickerDialog
        open={showCouponDialog}
        // Popup only lists the extras (= mock coupons beyond the first 3 defaults
        // that already live in the sidebar). Sidebar + popup don't overlap.
        coupons={mockAvailableCoupons.slice(3)}
        onClose={() => setShowCouponDialog(false)}
        applied={appliedCoupons.map(c => c.id)}
        cartTotal={totals.grand}
        onConfirm={ids => {
          setAppliedCoupons(mockAvailableCoupons.filter(c => ids.includes(c.id)));
          setShowCouponDialog(false);
        }}
      />

      {/* ── Fulfillment confirm dialog ── */}
      {showFulfillmentConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFulfillmentConfirm(false)} />
          <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[520px] mx-4 overflow-hidden">
            {/* Body — centered icon + title */}
            <div className="flex flex-col items-center text-center px-10 pt-10 pb-8">
              <Truck className="w-20 h-20 mb-6 shrink-0" style={{ color: NAVY }} strokeWidth={1.5} />
              <div className="text-h3 font-bold" style={{ color: NAVY }}>ยืนยันเปลี่ยนการรับสินค้า</div>
              <div className="text-b3 text-text-secondary mt-3 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนการรับสินค้า<br />
                รายการสินค้า<span className="font-bold text-text-primary">ทั้งหมด</span>เลยใช่ไหม?
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowFulfillmentConfirm(false)}
                className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (pendingBulkFulfillment) {
                    const next: Record<string, 'pickup' | 'delivery'> = {};
                    cartItems.forEach(i => { next[i.sku] = pendingBulkFulfillment; });
                    // Also propagate to free rows so the whole bill flips together
                    buygetFreeBySku.forEach(r => { next[r.id] = pendingBulkFulfillment; });
                    otherFreeRows.forEach(r => { next[r.id] = pendingBulkFulfillment; });
                    setFulfillmentMap(next);
                  }
                  setShowFulfillmentConfirm(false);
                  setPendingBulkFulfillment(null);
                }}
                className="flex-[2] h-12 rounded-[12px] text-h5 font-bold text-white transition hover:brightness-110"
                style={{ backgroundColor: NAVY }}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fulfillment summary dialog ── */}
      <FulfillmentSummaryDialog
        open={showFulfillmentSummary}
        onClose={() => { setShowFulfillmentSummary(false); setShowFulfillmentSummaryFull(false); }}
        cartItems={cartItems}
        fulfillmentMap={fulfillmentMap}
        productMap={productMap}
        buyGetFreeItems={mockBuyGetItems.filter(i => claimedBuyGetSkus.has(i.sku)).map(i => {
          const p = productMap.get(i.sku);
          const bh = (p?.brand ?? i.sku).split('').reduce((s,c) => s+c.charCodeAt(0), 0);
          const giftQty = Math.floor(i.qty / (bh % 2 === 0 ? 1 : 2));
          return { id: i.sku, name: p?.name ?? i.sku, qty: giftQty, unit: p?.unit ?? 'ชิ้น', image: p?.image } as SummaryFreeItem;
        })}
        orderGifts={mockOrderGifts.filter(g => totals.grand >= g.threshold).map(g => ({
          id: g.id, name: g.name, qty: g.qty, unit: g.unit, image: g.image,
        } as SummaryFreeItem))}
        redeemedRewards={mockRedeemedRewards.map(r => ({
          id: r.id, name: r.name, qty: r.qty, unit: r.unit, image: r.image,
        } as SummaryFreeItem))}
        shipping={selectedAddress ? {
          contactName: selectedAddress.contactName ?? selectedAddress.branchName ?? customer?.name,
          phone: selectedAddress.phone ?? customer?.phone,
          address: [
            selectedAddress.address,
            selectedAddress.district,
            selectedAddress.province,
            selectedAddress.postalCode,
          ].filter(Boolean).join(' '),
          courier: selectedCourier,
        } : undefined}
        packaging={packaging.map(p => ({ id: p.id, name: p.name, qty: p.qty }))}
        {...(showFulfillmentSummaryFull ? {
          totals: {
            subtotalCount: cartItems.length,
            subtotal: totals.subtotal,
            freeItemsCount:
              mockBuyGetItems.filter(i => claimedBuyGetSkus.has(i.sku)).length +
              mockOrderGifts.filter(g => totals.grand >= g.threshold).length,
            rewardsCount: mockRedeemedRewards.length,
            packagingCost,
            discountAmount: totalDiscount,
            discountLines: discountBreakdown.length,
            hasDelivery: deliveryCount > 0,
            netTotal,
          },
          onConfirm: () => {
            setShowFulfillmentSummary(false);
            setShowFulfillmentSummaryFull(false);
            setShowOrderSuccess(true);
          },
          onScanMore: () => {
            setShowFulfillmentSummary(false);
            setShowFulfillmentSummaryFull(false);
            barcodeRef.current?.focus();
          },
        } : {})}
      />

      {/* ── สรุปบิล intercept: ยังไม่ได้สแกนของแถม + ใกล้ได้รับโปรโมชันเพิ่มเติม ── */}
      {showBillIntercept && (() => {
        const unscannedBuyGet = mockBuyGetItems.filter(i => !claimedBuyGetSkus.has(i.sku));
        const unscannedOrderGifts = mockOrderGifts.filter(g => totals.grand >= g.threshold && !claimedOrderGiftIds.has(g.id));
        const unscannedBrandPromos = mockBrandPromos.filter(b => b.spend >= b.threshold && !claimedBrandPromoNames.has(b.brand));
        const totalUnscanned = unscannedBuyGet.length + unscannedOrderGifts.length + unscannedBrandPromos.length;
        const nearPromos = mockBrandPromos.filter(bp => bp.spend < bp.threshold);
        const hasUnscanned = totalUnscanned > 0;
        const hasNearPromo = nearPromos.length > 0;
        const proceed = () => { setShowBillIntercept(false); setShowFulfillmentSummaryFull(true); setShowFulfillmentSummary(true); };
        // Title + subtitle written for the cashier — keep it short and direct.
        const title = hasUnscanned && hasNearPromo
          ? 'อย่าลืมเช็กของแถมและโปรเพิ่มเติม'
          : hasNearPromo
            ? 'ใกล้ได้รับโปรเพิ่มเติม'
            : 'อย่าลืมสแกนของแถม';
        const subtitle = hasUnscanned && hasNearPromo
          ? `บิลนี้มีของแถมที่ยังไม่ได้สแกน ${totalUnscanned} รายการ และโปรอีก ${nearPromos.length} รายการที่ใกล้จะได้รับ`
          : hasNearPromo
            ? `เพิ่มสินค้าอีกเล็กน้อยเพื่อรับของแถมหรือส่วนลดเพิ่มเติม (${nearPromos.length} รายการ)`
            : `กรุณาสแกนของแถมให้ครบก่อนปิดบิล (${totalUnscanned} รายการ)`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBillIntercept(false)} />
            <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-[640px] mx-4 flex flex-col overflow-hidden max-h-[92vh]">
              <div className="px-6 pt-6 pb-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <AlertTriangle className="w-14 h-14" style={{ color: '#F59E0B' }} strokeWidth={2} />
                </div>
                <div className="text-h3 font-bold text-text-primary whitespace-pre-line leading-snug">{title}</div>
                <div className="text-c1 text-text-secondary mt-2 leading-relaxed">{subtitle}</div>
              </div>
              <div className="px-6 pb-4 space-y-2 overflow-y-auto">
                {/* ── Unscanned: buy-get free ── */}
                {unscannedBuyGet.map(item => {
                  const p = productMap.get(item.sku);
                  const brandHash = (p?.brand ?? item.sku).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
                  const buyQty = brandHash % 2 === 0 ? 1 : 2;
                  const giftQty = Math.floor(item.qty / buyQty);
                  return (
                    <div key={item.sku} className="rounded-[12px] border border-amber-400 bg-amber-50 p-3 flex items-start gap-3">
                      <ProductThumb image={p?.image} name={p?.name ?? item.sku} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-c1 font-bold text-text-primary line-clamp-2 leading-snug flex-1">{p?.name ?? item.sku}</div>
                          <span className="text-c1 font-bold shrink-0" style={{ color: NAVY }}>{giftQty} {p?.unit ?? 'ชิ้น'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[8px] bg-red-100 text-red-600 shrink-0">
                            <Tag className="w-3 h-3" />ซื้อ {buyQty} แถม 1
                          </span>
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-c2 font-bold shrink-0" style={{ backgroundColor: '#FFE3A3', color: '#C36800' }}>
                            <Hourglass className="w-3.5 h-3.5" />รอสแกน
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* ── Unscanned: order gifts ── */}
                {unscannedOrderGifts.map(gift => (
                  <div key={gift.id} className="rounded-[12px] border border-amber-400 bg-amber-50 p-3 flex items-start gap-3">
                    <ProductThumb image={gift.image} name={gift.name} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-c1 font-bold text-text-primary line-clamp-2 leading-snug flex-1">{gift.name}</div>
                        <span className="text-c1 font-bold shrink-0" style={{ color: NAVY }}>{gift.qty} {gift.unit}</span>
                      </div>
                      <div className="flex items-center justify-end mt-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-c2 font-bold" style={{ backgroundColor: '#FFE3A3', color: '#C36800' }}>
                          <Hourglass className="w-3.5 h-3.5" />รอสแกน
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* ── Unscanned: brand promos (qualified, not claimed) ── */}
                {unscannedBrandPromos.map(bp => {
                  const brandCartItem = cartItems.find(ci => productMap.get(ci.sku)?.brand === bp.brand);
                  const brandImage = brandCartItem ? productMap.get(brandCartItem.sku)?.image : undefined;
                  const rewardInfo = parseBrandReward(bp.reward);
                  return (
                    <div key={bp.brand} className="rounded-[12px] border border-amber-400 bg-amber-50 p-3 flex items-start gap-3">
                      <ProductThumb image={brandImage} name={bp.brand} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-c1 font-bold text-text-primary line-clamp-2 leading-snug flex-1">โปรแบรนด์ {bp.brand}</div>
                          <span className="text-c1 font-bold shrink-0" style={{ color: NAVY }}>{rewardInfo.qty} {rewardInfo.unit}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-c2 text-text-secondary truncate">{bp.reward}</span>
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-c2 font-bold shrink-0" style={{ backgroundColor: '#FFE3A3', color: '#C36800' }}>
                            <Hourglass className="w-3.5 h-3.5" />รอสแกน
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* ── Near-promo brands ── */}
                {nearPromos.map(bp => {
                  const pct = Math.min(100, Math.round((bp.spend / bp.threshold) * 100));
                  const remaining = Math.max(0, bp.threshold - bp.spend);
                  const brandCartItem = cartItems.find(ci => productMap.get(ci.sku)?.brand === bp.brand);
                  const brandImage = brandCartItem ? productMap.get(brandCartItem.sku)?.image : undefined;
                  const rewardInfo = parseBrandReward(bp.reward);
                  return (
                    <div key={`near-${bp.brand}`} className="rounded-[12px] border border-amber-400 bg-amber-50 p-3 flex items-start gap-3">
                      <ProductThumb image={brandImage} name={bp.brand} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-c1 font-bold text-text-primary leading-snug flex-1">ซื้อเพิ่มอีก {fmt(remaining)}</div>
                          <span className="text-c1 font-bold shrink-0" style={{ color: NAVY }}>{rewardInfo.qty} {rewardInfo.unit}</span>
                        </div>
                        <div className="text-c2 text-text-secondary mt-0.5 truncate">โปรแบรนด์ {bp.brand} รับ{bp.reward}</div>
                        <div className="mt-2 h-2 rounded-full bg-white overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#F59E0B' }} />
                        </div>
                        <div className="text-c2 text-text-muted mt-1.5">
                          ยอดปัจจุบัน {fmt(bp.spend)} /เป้าหมาย {fmt(bp.threshold)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowBillIntercept(false)}
                  className="flex-1 h-16 rounded-[12px] border border-gray-300 bg-white hover:bg-bg-page-2 transition leading-tight px-2"
                >
                  <div className="text-h5 font-bold text-text-primary">ยกเลิก</div>
                  <div className="text-c2 text-text-secondary mt-0.5">(กลับไปสแกน)</div>
                </button>
                <button
                  onClick={proceed}
                  className="flex-1 h-16 rounded-[12px] transition hover:brightness-95 leading-tight px-2"
                  style={{ backgroundColor: YELLOW, color: NAVY }}
                >
                  <div className="text-h5 font-bold">ดำเนินการต่อ</div>
                  <div className="text-c2 mt-0.5" style={{ color: NAVY, opacity: 0.7 }}>(ข้ามการสแกน)</div>
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* ── Order success popup (after final bill confirm) ── */}
      {showOrderSuccess && (() => {
        const now = new Date();
        const dd = now.getDate().toString().padStart(2, '0');
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const mmShort = thaiMonths[now.getMonth()];
        const yearTH = now.getFullYear() + 543;
        const hh = now.getHours().toString().padStart(2, '0');
        const mn = now.getMinutes().toString().padStart(2, '0');
        const dateTimeStr = `${dd} ${mmShort} ${yearTH} | ${hh}:${mn}`;
        const orderNumber = `YSC${(now.getFullYear() % 100).toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${dd}${hh}${mn}`;
        const freeItemsCount =
          mockBuyGetItems.filter(i => claimedBuyGetSkus.has(i.sku)).length +
          mockOrderGifts.filter(g => totals.grand >= g.threshold).length;
        const rewardCount = mockRedeemedRewards.length;
        const fulfillmentLabel = hasMixedFulfillment
          ? 'แยกรับสินค้า'
          : deliveryCount > 0
            ? 'จัดส่งผ่านขนส่ง'
            : 'รับเองหน้าร้าน';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOrderSuccess(false)} />
            <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-[760px] mx-4 flex flex-col overflow-hidden max-h-[92vh]">

              {/* Green hero */}
              <div className="px-6 py-10 text-center shrink-0" style={{ backgroundColor: '#27AE60' }}>
                <BadgeCheck className="w-20 h-20 mx-auto mb-3 text-white" strokeWidth={1.8} />
                <div className="text-h1 font-bold text-white">คำสั่งซื้อสำเร็จ!</div>
                <div className="text-b2 text-white/90 mt-1.5">ขอบคุณที่ใช้บริการ ยงเจริญ</div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-6 space-y-4">
                {/* Order # + Date */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-c1 text-text-secondary">
                      <FileText className="w-4 h-4" />
                      หมายเลขคำสั่งซื้อ:
                    </div>
                    <div className="text-h5 font-bold text-text-primary mt-1">{orderNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end text-c1 text-text-secondary">
                      <Calendar className="w-4 h-4" />
                      วันและเวลา
                    </div>
                    <div className="text-h5 font-bold text-text-primary mt-1">{dateTimeStr}</div>
                  </div>
                </div>

                {/* Sky-50 detail box */}
                <div className="rounded-[16px] bg-sky-50 border border-sky-200 p-5">
                  <div className="text-h5 font-bold text-center text-text-primary mb-4">รายละเอียดคำสั่งซื้อ</div>
                  <div className="space-y-2 text-c1">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">จำนวนสินค้า</span>
                      <span className="font-bold text-text-primary">{cartItems.length} รายการ</span>
                    </div>
                    {freeItemsCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">สินค้าของแถม</span>
                        <span className="font-bold text-text-primary">{freeItemsCount} รายการ</span>
                      </div>
                    )}
                    {rewardCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">ของรางวัลที่แลกไว้</span>
                        <span className="font-bold text-text-primary">{rewardCount} รายการ</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-secondary">การรับสินค้า</span>
                      <span className="font-bold" style={{ color: '#0197FF' }}>{fulfillmentLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">สถานะคำสั่งซื้อ</span>
                      <span className="font-bold" style={{ color: '#0197FF' }}>รอชำระเงิน</span>
                    </div>
                  </div>

                  {/* Packaging chips */}
                  {packaging.length > 0 && (
                    <div className="mt-4 rounded-[12px] bg-white p-3">
                      <div className="text-c1 text-text-secondary mb-2">บรรจุภัณฑ์ที่ใช้</div>
                      <div className="flex flex-wrap gap-2">
                        {packaging.map(p => (
                          <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-c2 text-text-primary">
                            {p.name} x{p.qty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider + total */}
                  <div className="border-t border-sky-200 mt-4 pt-3 flex items-center justify-between">
                    <span className="text-h5 font-bold text-text-primary">ยอดชำระสุทธิ</span>
                    <span className="text-h3 font-bold tabular-nums" style={{ color: '#0197FF' }}>{fmt(netTotal)}</span>
                  </div>
                </div>

                {/* Cashier info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-c1 text-text-secondary">ผู้ขาย</div>
                    <div className="text-c1 text-text-secondary">เครื่อง</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-c1 font-bold text-text-primary">{me?.name ?? 'นายมานะ ปิติ'}</div>
                    <div className="text-c1 font-bold text-text-primary">#POS-001</div>
                  </div>
                </div>

                {/* Yellow doc button */}
                <button
                  type="button"
                  className="w-full h-14 rounded-[12px] flex items-center justify-center gap-2 text-h5 font-bold transition hover:brightness-95"
                  style={{ backgroundColor: YELLOW, color: NAVY }}
                >
                  <FileText className="w-5 h-5" />
                  ดูเอกสารใบเตรียมสินค้า
                </button>
              </div>

              {/* Footer 3 actions */}
              <div className="px-6 py-4 border-t border-gray-200 grid grid-cols-3 gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowOrderSuccess(false)}
                  className="h-12 rounded-[12px] border border-gray-300 bg-white text-c1 text-text-primary hover:bg-bg-page-2 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => { window.print(); setShowOrderSuccess(false); }}
                  className="h-12 rounded-[12px] border border-gray-300 bg-white text-c1 text-text-primary hover:bg-bg-page-2 transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  บันทึก+พิมพ์
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderSuccess(false)}
                  className="h-12 rounded-[12px] border border-rose-200 bg-white text-c1 text-rose-500 hover:bg-rose-50 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <RegisterMemberDialog open={showRegister} onClose={() => setShowRegister(false)}
        onRegistered={c => { setCustomer(c); setShowRegister(false); }} />

      <PaymentDialog open={showPayment} onClose={() => setShowPayment(false)} totalAmount={totals.grand} customer={customer}
        onConfirm={(method: 'cash' | 'card' | 'credit' | 'qr') => { setShowPayment(false); handlePaymentConfirm(method); }} />

      <CancelBillDialog open={showCancel} billId={billId} onClose={() => setShowCancel(false)}
        onConfirm={(_reason: string) => { setShowCancel(false); handleAbandonBill(); }} />

      <HeldBillsDialog open={showHeld} bills={heldBills} onClose={() => setShowHeld(false)}
        onRestore={restoreBill} onDelete={deleteHeldBill} />

      <OtherMenusDialog
        open={showOtherMenus}
        onClose={() => setShowOtherMenus(false)}
        onSelectDeliveryDoc={() => { setShowOtherMenus(false); setShowDeliveryDoc(true); }}
        onSelectCreateInvoice={() => { /* TODO: สร้างใบแจ้งหนี้จากรับคำสั่งซื้อ */ setShowOtherMenus(false); }}
      />

      <DeliveryDocDialog
        open={showDeliveryDoc}
        onClose={() => setShowDeliveryDoc(false)}
      />

      <SlipUploadDialog
        open={showSlipUpload}
        orderId={pendingSlipOrderId}
        totalAmount={pendingSlipAmount}
        onClose={handleSlipUploaded}
        onUploaded={handleSlipUploaded}
      />

      <ProductSearchDialog
        open={showPicker}
        initialQuery={pickerInitialQuery}
        onClose={() => setShowPicker(false)}
        onSelectProduct={(mockP: MockProduct, qty: number) => {
          // ProductSearchDialog operates on the mock Product shape; map back to ApiProduct
          const apiProduct: ApiProduct = {
            id: mockP.id,
            sku: mockP.sku,
            name: mockP.name,
            barcode: mockP.barcode,
            standardPrice: mockP.price,
            prices: mockP.prices ?? {},
            unit: mockP.unit,
            brand: mockP.brand,
            category: mockP.category,
            stockOffline: mockP.stock,
            reservedOffline: 0,
            image: mockP.image,
          };
          void handlePickerSelect(apiProduct, qty);
        }}
        priceTier={customer?.priceTier ?? 'P5'}
      />

      {/* Stock check dialog — opens when Package icon is clicked on a cart row */}
      <StockCheckDialog
        open={stockCheckSku !== null}
        onClose={() => { setStockCheckSku(null); setStockCheckProduct(null); }}
        productName={stockCheckProduct?.name ?? stockCheckSku ?? ''}
        sku={stockCheckProduct?.sku ?? stockCheckSku ?? undefined}
        barcode={stockCheckProduct?.barcode}
        unit={stockCheckProduct?.unit ?? 'ชิ้น'}
        image={stockCheckProduct?.image}
        slots={stockCheckProduct?.locationStock}
        loading={stockCheckLoading}
        stockOffline={stockCheckProduct?.stockOffline}
      />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 h-14 text-white shrink-0" style={{ backgroundColor: NAVY }}>
        <div className="flex items-center gap-3">
          {/* Circular brand mark */}
          <div className="w-9 h-9 rounded-[8px] bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo-ysc.png" alt="YSC" className="w-full h-full object-contain p-1"
              onError={e => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                img.parentElement!.innerHTML = `
                  <div class="flex flex-col items-center justify-center leading-[0.7]">
                    <span class="text-[7px] font-bold tracking-tight" style="color:${NAVY}">YONG</span>
                    <span class="text-[10px] font-black" style="color:${YELLOW};-webkit-text-stroke:0.5px ${NAVY}">Y</span>
                    <span class="text-[6px] font-bold tracking-tight" style="color:${NAVY}">CHAROEN</span>
                  </div>`;
              }} />
          </div>
          <div className="leading-tight">
            <div className="text-s2 font-bold">POS System</div>
            <div className="text-c3 font-normal text-white/60">ระบบขายหน้าร้าน YSC • 10,000+ สินค้า</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right leading-tight">
            <div className="text-h5 font-bold tabular-nums">{time}</div>
            <div className="text-c3 font-normal text-white/60">{dateLabel}</div>
          </div>
          <div ref={settingsRef} className="relative">
            <button
              onClick={() => setShowSettingsMenu(v => !v)}
              title="ตั้งค่า"
              className={`flex items-center justify-center w-9 h-9 rounded-[12px] transition ${showSettingsMenu ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
              aria-label="settings"
              aria-haspopup="menu"
              aria-expanded={showSettingsMenu}
            >
              <Settings className="w-4 h-4" />
            </button>
            {showSettingsMenu && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 z-40 w-[220px] bg-white rounded-[14px] shadow-xl border border-gray-100 overflow-hidden py-1"
              >
                <button
                  role="menuitem"
                  onClick={() => { setShowSettingsMenu(false); setShowChangePassword(true); }}
                  className="w-full flex items-center gap-3 px-5 h-12 text-s2 transition hover:bg-bg-page-2"
                  style={{ color: NAVY }}
                >
                  <Eye className="w-5 h-5 shrink-0" />
                  เปลี่ยนรหัสผ่าน
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setShowSettingsMenu(false); window.open('/display', '_blank'); }}
                  className="w-full flex items-center gap-3 px-5 h-12 text-s2 transition hover:bg-bg-page-2"
                  style={{ color: NAVY }}
                >
                  <MapPin className="w-5 h-5 shrink-0" />
                  จอแสดงผลลูกค้า
                </button>
                <div className="mx-4 h-px bg-gray-100" />
                <button
                  role="menuitem"
                  onClick={() => { setShowSettingsMenu(false); handleSignOut(); }}
                  className="w-full flex items-center gap-3 px-5 h-12 text-s2 transition hover:bg-bg-page-2"
                  style={{ color: NAVY }}
                >
                  <Power className="w-5 h-5 shrink-0" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* LEFT */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg-page-2">
          {/* Header + F-keys */}
          <div className="flex items-center justify-between px-6 pt-4 pb-3">
            <div>
              <div className="text-h3 text-brand-navy">{billId}</div>
              <div className="text-s1 text-gray-500 mt-1">
                {(() => {
                  const name = me?.name ?? 'นายมานะ ปิติ';
                  const roleRaw = me?.role ?? 'pos_staff';
                  const role = roleRaw === 'pos_staff' ? 'Staff' : roleRaw;
                  return `${name} • ${role}`;
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* F1 — ค้นหาสมาชิก: popup เฉพาะเมื่อมีสินค้า + มีลูกค้าแล้ว */}
              <FKey hotkey="F1" label="ค้นหาสมาชิก" icon={Search}
                onClick={() => {
                  if (cartItems.length > 0 && customer !== null) {
                    setShowCartPending(true);
                  } else {
                    setCustomerSearchMode('search');
                    setShowCustomerSearch(true);
                  }
                }} />
              {/* F2 — เปลี่ยนลูกค้า: ถ้ามีสินค้าในตะกร้าให้ถาม CartPendingDialog ก่อน */}
              <FKey hotkey="F2" label="เปลี่ยนลูกค้า" icon={RefreshCw}
                onClick={() => {
                  if (cartItems.length > 0) {
                    setShowCartPending(true);
                  } else {
                    setCustomerSearchMode('change');
                    setShowCustomerSearch(true);
                  }
                }} />
              <FKey hotkey="F3" label="พักบิล"        icon={Pause}     onClick={() => { if (cartItems.length > 0) setShowHoldDialog(true); }} />
              <FKey hotkey="F4" label="ดึงบิล"        icon={Inbox}     count={heldBills.length} onClick={() => setShowHeld(true)} />
              <FKey hotkey="F5" label="ยกเลิกบิล"    icon={Ban}       onClick={() => cartItems.length > 0 && setSupervisorAuth({ mode: 'cancel-bill' })} />
              <FKey hotkey="F6" label="เมนูอื่นๆ"      icon={LayoutGrid} onClick={() => setShowOtherMenus(true)} />
            </div>
          </div>

          {/* Cart card — wraps search + table + empty state */}
          <div className="flex-1 flex flex-col min-h-0 mx-4 mb-4 rounded-[16px] border border-gray-200 bg-white overflow-hidden">

          {/* Search bar */}
          <div className="px-6 pt-4 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-h5 text-brand-navy">รายการสินค้า</div>
            </div>
            <div className="flex items-center gap-3">
              {/* Quantity stepper — 3 separated rounded buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => setPendingQty(q => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-blue-100 border border-sky-200 text-sky-500 hover:brightness-95 transition text-h5 leading-none">−</button>
                <input ref={qtyRef} type="text" inputMode="numeric" pattern="[0-9]*" value={pendingQty}
                  onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ''); const v = raw ? parseInt(raw) : 1; if (v >= 1 && v <= 9999) setPendingQty(v); }}
                  onFocus={e => e.target.select()}
                  className="w-12 h-11 rounded-[12px] bg-white border border-sky-200 text-center text-c1 !font-extrabold text-text-primary outline-none tabular-nums focus:border-sky-400" />
                <button type="button" onClick={() => setPendingQty(q => q + 1)}
                  className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-blue-100 border border-sky-200 text-sky-500 hover:brightness-95 transition text-h5 leading-none">+</button>
              </div>
              {/* Search bar — minimal, no border */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input ref={barcodeRef} value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { setShowSuggestions(false); handleBarcodeSubmit(); }
                    else if (e.key === 'Escape') setShowSuggestions(false);
                  }}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoFocus
                  placeholder="สแกนบาร์โค้ด หรือ ค้นหาด้วยชื่อสินค้า, SKU, รหัสบาร์โค้ด, แบรนด์"
                  className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-[12px] text-b3 bg-bg-page-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15 transition" />
                {(apiLoading || suggestLoading) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                )}

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-[12px] shadow-[var(--shadow-elev)] max-h-[480px] overflow-y-auto">
                    {/* Header */}
                    <div className="px-5 py-3 bg-bg-page text-c1 text-text-secondary sticky top-0 z-10 border-b border-gray-100">
                      ผลการค้นหา ({suggestions.length})
                    </div>
                    {suggestions.map(p => {
                      // Prefer backend-computed per-location available (sum of offline slots).
                      // Fall back to stockOffline - reservedOffline if locationAvailable not present.
                      const offlineAvail = p.locationStock
                        ? p.locationStock
                            .filter(s => ['1','2'].includes(String(s.locationId).charAt(0)))
                            .reduce((sum, s) => sum + s.locationAvailable, 0)
                        : null;
                      const stock = Math.max(0, offlineAvail ?? (p.stockOffline - p.reservedOffline));
                      const out = stock <= 0;
                      return (
                        <button
                          key={p.sku}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { void handleSuggestionPick(p); }}
                          disabled={out}
                          className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition border-b border-gray-100 last:border-b-0 ${out ? 'opacity-60 cursor-not-allowed' : 'hover:bg-bg-page-2'}`}
                        >
                          {/* Image */}
                          <ProductThumb image={p.image} name={p.name} size={56} />
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-s2 text-text-primary truncate">{p.name}</div>
                            <div className="flex items-center gap-4 mt-1 text-c1 text-text-secondary">
                              <span>รหัสสินค้า : <span className="font-mono">{p.sku}</span></span>
                              {p.barcode && (
                                <span>รหัสบาร์โค้ด : <span className="font-mono">{p.barcode}</span></span>
                              )}
                            </div>
                            {(p.brand || out) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {getMockPromoTags(p.brand).map(tag => (
                                  <span key={tag.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-none ${PROMO_TAG_STYLES[tag.color]}`}>
                                    <Tag className="shrink-0" style={{ width: 11, height: 11 }} strokeWidth={2.5} />
                                    {tag.label}
                                  </span>
                                ))}
                                {out && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-status-danger-bg text-status-danger text-c3 font-bold">
                                    สินค้าหมด
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Price — picks per-tier price based on selected customer */}
                          <div className="text-s1 text-brand-navy tabular-nums shrink-0">
                            {fmt(pickPriceForTier(p, customer?.priceTier))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <Button size="lg" className="h-12 px-6 text-s2 hover:brightness-95 shrink-0 rounded-[12px]"
                style={{ backgroundColor: YELLOW, color: NAVY }} onClick={() => { setPickerInitialQuery(barcodeInput.trim()); setShowPicker(true); }}>
                ค้นหาเพิ่มเติม
              </Button>
            </div>
            {errorMsg && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-c3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-c3">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-50 text-s2 tracking-wide" style={{ color: '#394050' }}>
                  <th className="text-left px-3 py-3 w-[110px]">รหัสสินค้า</th>
                  <th className="text-left px-3 py-3 w-[240px]">รายการสินค้า</th>
                  <th className="text-center px-2 py-3 w-[80px]">จำนวน</th>
                  <th className="text-right px-2 py-3 w-[110px]">ราคา/หน่วย</th>
                  <th className="text-right px-2 py-3 w-[80px]">ส่วนลด</th>
                  <th className="text-right px-2 py-3 w-[90px]">รวม</th>
                  <th className="text-center px-2 py-3 w-[110px]">วิธีรับสินค้า</th>
                  <th className="text-center px-2 py-3 w-[70px]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {/* Sort cart items by scan time so the latest one is at the bottom. */}
                {[...cartItems].sort((a, b) => (a.addedAt ?? '').localeCompare(b.addedAt ?? '')).map(item => {
                  const product = productMap.get(item.sku);
                  const price = parseFloat(item.unitPrice);
                  const lineDiscount = 0; // TODO: backend doesn't expose per-line discount yet
                  const total = price * item.qty - lineDiscount;
                  const fulfillment = fulfillmentMap[item.sku] ?? 'pickup';
                  // Flag: this item is tied to a promo (buy-get available OR a triggered brand promo)
                  const hasPromo =
                    mockBuyGetItems.some(b => b.sku === item.sku) ||
                    mockBrandPromos.some(bp => bp.brand === product?.brand && bp.spend >= bp.threshold);
                  return (
                    <tr key={item.sku} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition">
                      {/* 1. รหัสสินค้า */}
                      <td className="px-3 py-3 text-c2 font-mono text-text-secondary align-middle">
                        {product?.barcode ?? item.sku}
                      </td>
                      {/* 2. รายการสินค้า (image + name + promo) */}
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <ProductThumb
                            image={product?.image}
                            name={product?.name ?? item.sku}
                            size={48}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-b4 text-text-primary leading-snug">
                              {product?.name ?? item.sku}
                            </div>
                            <PromoTagList brand={product?.brand} size="xs" />
                          </div>
                          {hasPromo && (
                            <span
                              title="สินค้าตัวนี้มีโปรโมชั่น"
                              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-[8px] bg-amber-100 text-amber-700"
                            >
                              <Tag className="w-3 h-3" />
                              <span className="text-[11px] font-bold">โปร</span>
                            </span>
                          )}
                        </div>
                      </td>
                      {/* 3. จำนวน (display only) */}
                      <td className="px-3 py-3 text-center align-middle">
                        <div className="text-s2 text-text-primary tabular-nums">{item.qty}</div>
                        <div className="text-c2 text-text-muted">/{product?.unit ?? 'ชิ้น'}</div>
                      </td>
                      {/* 4. ราคา/หน่วย */}
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        <div className="text-s2 text-text-primary">{fmt(price)}</div>
                      </td>
                      {/* 5. ส่วนลด — สีแดง B4 */}
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        {lineDiscount > 0 ? (
                          <div className="text-b4 text-status-danger">{fmt(lineDiscount)}</div>
                        ) : (
                          <div className="text-b4 text-text-muted">—</div>
                        )}
                      </td>
                      {/* 6. รวม */}
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        <div className="text-s2 text-brand-navy">{fmt(total)}</div>
                      </td>
                      {/* 7. วิธีรับสินค้า — toggle pickup (blue active) / delivery (orange active) */}
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFulfillmentMap(m => ({ ...m, [item.sku]: 'pickup' }))}
                            title="รับเองหน้าร้าน"
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition ${
                              fulfillment === 'pickup'
                                ? 'bg-[#E5F2FF] border-2 border-[#0197FF] text-[#0197FF]'
                                : 'bg-white text-text-primary border border-gray-200 hover:bg-bg-page-2'
                            }`}
                          >
                            <Store className="w-5 h-5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFulfillmentMap(m => ({ ...m, [item.sku]: 'delivery' }))}
                            title="จัดส่งผ่านขนส่ง"
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition ${
                              fulfillment === 'delivery'
                                ? 'bg-[#FFEFD9] border-2 border-[#F2994A] text-[#F2994A]'
                                : 'bg-white text-text-primary border border-gray-200 hover:bg-bg-page-2'
                            }`}
                          >
                            <Truck className="w-5 h-5" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                      {/* 8. จัดการ — stock check + delete */}
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="เช็กสต็อก"
                            onClick={async () => {
                              setStockCheckSku(item.sku);
                              setStockCheckProduct(productMap.get(item.sku) ?? null);
                              setStockCheckLoading(true);
                              try {
                                const fresh = await getProductBySku(item.sku);
                                setStockCheckProduct(fresh);
                                // Update productMap so price tier etc. stays fresh too
                                setProductMap(m => new Map(m).set(fresh.sku, fresh));
                              } catch {
                                // Keep cached product if fetch fails
                              } finally {
                                setStockCheckLoading(false);
                              }
                            }}
                            className="w-10 h-10 rounded-[10px] flex items-center justify-center transition hover:brightness-95"
                            style={{ backgroundColor: '#E5E9FF', color: '#0B1E8A' }}
                          >
                            <Package className="w-5 h-5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSupervisorAuth({ mode: 'cancel-item', targetSku: item.sku })}
                            title="ลบรายการสินค้า"
                            className="w-10 h-10 rounded-[10px] bg-status-danger-bg text-status-danger hover:brightness-95 flex items-center justify-center transition"
                          >
                            <Trash2 className="w-5 h-5" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* ── Buy-get free rows (at the bottom, paired by association via the icon) ── */}
                {Array.from(buygetFreeBySku.values()).map(row => {
                  const parentSku = row.productSku ?? '';
                  const parentMode = fulfillmentMap[parentSku] ?? 'pickup';
                  const freeFulfillment = fulfillmentMap[row.id] ?? parentMode;
                  return (
                    <tr key={row.id} className="border-b border-neutral-100 bg-green-50/60">
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <Gift className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <ProductThumb image={row.image} name={row.name} size={48} />
                          <div className="flex-1 min-w-0">
                            <div className="text-b4 text-text-primary leading-snug">{row.name}</div>
                            {row.badge && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold px-2 py-0.5 rounded-[8px] bg-red-100 text-red-600">
                                <Tag className="w-3 h-3" />{row.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        <div className="text-s2 text-text-primary tabular-nums">{row.qty}</div>
                        <div className="text-c2 text-text-muted">/{row.unit || 'รายการ'}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        <div className="text-s2 font-bold text-green-600">ฟรี</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        <div className="text-b4 text-text-muted">—</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        <div className="text-s2 font-bold text-green-600">฿0.00</div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFulfillmentMap(m => ({ ...m, [row.id]: 'pickup' }))}
                            title="รับเองหน้าร้าน"
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition ${
                              freeFulfillment === 'pickup'
                                ? 'bg-[#E5F2FF] border-2 border-[#0197FF] text-[#0197FF]'
                                : 'bg-white text-text-primary border border-gray-200 hover:bg-bg-page-2'
                            }`}
                          >
                            <Store className="w-5 h-5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFulfillmentMap(m => ({ ...m, [row.id]: 'delivery' }))}
                            title="จัดส่งผ่านขนส่ง"
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition ${
                              freeFulfillment === 'delivery'
                                ? 'bg-[#FFEFD9] border-2 border-[#F2994A] text-[#F2994A]'
                                : 'bg-white text-text-primary border border-gray-200 hover:bg-bg-page-2'
                            }`}
                          >
                            <Truck className="w-5 h-5" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle" />
                    </tr>
                  );
                })}
                {/* ── Other free items (order gifts / brand promos / redeemed rewards) at the bottom ── */}
                {(() => {
                  // Default fulfillment for free items not tied to a parent SKU:
                  // dominant *cart* mode (not the total counts — those include free rows
                  // and would feed back into themselves causing flicker on toggle).
                  const cartPickup = cartItems.filter(i => (fulfillmentMap[i.sku] ?? 'pickup') === 'pickup').length;
                  const cartDelivery = cartItems.filter(i => fulfillmentMap[i.sku] === 'delivery').length;
                  const dominantFulfillment: 'pickup' | 'delivery' =
                    cartDelivery > cartPickup ? 'delivery' : 'pickup';
                  return otherFreeRows.map(row => {
                  const Icon = row.kind === 'reward' ? Trophy : Gift;
                  const rowFulfillment = fulfillmentMap[row.id] ?? dominantFulfillment;
                  return (
                    <tr key={row.id} className="border-b border-neutral-100 bg-green-50/60">
                      {/* 1. รหัสสินค้า → icon only */}
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <Icon className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                      {/* 2. รายการสินค้า */}
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <ProductThumb image={row.image} name={row.name} size={48} />
                          <div className="flex-1 min-w-0">
                            {row.subtitle && (
                              <div className="text-b4 font-bold text-text-primary leading-snug">{row.subtitle}</div>
                            )}
                            <div className={`leading-snug ${row.subtitle ? 'text-c2 text-text-secondary' : 'text-b4 text-text-primary'}`}>
                              {row.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* 3. จำนวน */}
                      <td className="px-3 py-3 text-center align-middle">
                        <div className="text-s2 text-text-primary tabular-nums">{row.qty}</div>
                        <div className="text-c2 text-text-muted">/{row.unit || 'รายการ'}</div>
                      </td>
                      {/* 4. ราคา/หน่วย → ฟรี */}
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        <div className="text-s2 font-bold text-green-600">ฟรี</div>
                      </td>
                      {/* 5. ส่วนลด → — */}
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        <div className="text-b4 text-text-muted">—</div>
                      </td>
                      {/* 6. รวม → ฿0.00 */}
                      <td className="px-3 py-3 text-right tabular-nums align-middle">
                        <div className="text-s2 font-bold text-green-600">฿0.00</div>
                      </td>
                      {/* 7. วิธีรับ → clickable per-row toggle */}
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFulfillmentMap(m => ({ ...m, [row.id]: 'pickup' }))}
                            title="รับเองหน้าร้าน"
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition ${
                              rowFulfillment === 'pickup'
                                ? 'bg-[#E5F2FF] border-2 border-[#0197FF] text-[#0197FF]'
                                : 'bg-white text-text-primary border border-gray-200 hover:bg-bg-page-2'
                            }`}
                          >
                            <Store className="w-5 h-5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFulfillmentMap(m => ({ ...m, [row.id]: 'delivery' }))}
                            title="จัดส่งผ่านขนส่ง"
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition ${
                              rowFulfillment === 'delivery'
                                ? 'bg-[#FFEFD9] border-2 border-[#F2994A] text-[#F2994A]'
                                : 'bg-white text-text-primary border border-gray-200 hover:bg-bg-page-2'
                            }`}
                          >
                            <Truck className="w-5 h-5" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                      {/* 8. จัดการ → blank (free items removed by un-claiming in sidebar) */}
                      <td className="px-3 py-3 align-middle" />
                    </tr>
                  );
                  });
                })()}
                {cartItems.length === 0 && !hasAnyFreeRow && (
                  <tr><td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <img
                        src={`/empty-cart.png?v=${86380}`}
                        alt=""
                        className="w-52 h-52 object-contain select-none pointer-events-none"
                        onError={e => {
                          // Fallback to emoji stack if image missing
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const fb = img.nextElementSibling as HTMLElement | null;
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                      <div className="relative w-28 h-28 items-center justify-center select-none" style={{ display: 'none' }}>
                        <span className="text-[80px]">🛒</span>
                        <span className="absolute -top-1 -right-1 text-h5">✨</span>
                        <span className="absolute -top-2 left-1 text-b3">🎁</span>
                        <span className="absolute -bottom-0 -right-2 text-c1">⭐</span>
                      </div>
                      <div className="text-h4 text-gray-300">ไม่มีสินค้าที่เลือก</div>
                      <div className="text-c2 text-text-muted">สแกนบาร์โค้ดหรือค้นหาสินค้า</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          </div>
          {/* /Cart card */}

          {/* Totals footer — split: left breakdown / right TOTAL block */}
          <div className="grid grid-cols-[1fr_360px] border-t border-gray-200">
            {/* Left — line items */}
            <div className="px-6 py-2 bg-white flex flex-col gap-0.5 text-c3">
              <div className="flex items-center justify-between">
                <span className="text-c1 text-text-secondary">ยอดรวม ({totals.count} รายการ)</span>
                <span className="text-s1 tabular-nums text-text-primary">{fmt(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-c1 text-text-secondary">ยอดรวมของแถม (0 รายการ)</span>
                <span className="text-s1 tabular-nums text-text-primary">{fmt(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-c1 text-status-danger">ส่วนลดโปรโมชัน</span>
                <span className="text-s1 tabular-nums text-status-danger">-{fmt(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-c1 text-status-danger">ส่วนลดท้ายบิล</span>
                <span className="text-s1 tabular-nums text-status-danger">-{fmt(0)}</span>
              </div>
            </div>
            {/* Right — TOTAL block (label "ยอดชำระสุทธิ (TOTAL)" on one row, amount below) */}
            <div className="flex flex-col items-end justify-center px-6 py-2 gap-0.5" style={{ backgroundColor: '#111827' }}>
              <div className="text-c2 text-white/85 leading-tight">
                ยอดชำระสุทธิ <span className="text-white/60">(TOTAL)</span>
              </div>
              <div className="text-h2 tabular-nums" style={{ color: YELLOW }}>
                {fmt(totals.grand)}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT sidebar — white bg */}
        <aside className="w-[440px] shrink-0 flex flex-col bg-white border-l border-gray-200">
          <div className="flex-1 overflow-y-auto p-4 space-y-0">
            <div className="flex items-center gap-1.5 text-s2 text-brand-navy mb-2.5">
              <UserCircle className="w-5 h-5 text-brand-navy" /> ข้อมูลลูกค้า
            </div>
            {customer ? (
              <CustomerCard
                customer={customer}
                onClear={() => setCustomer(null)}
                cartTotal={totals.grand}
                onApproveCredit={() => setShowCreditApproval(true)}
              />
            ) : (
              <WalkInCard onSearch={() => { setCustomerSearchMode('search'); setShowCustomerSearch(true); }} onRegister={() => setShowRegister(true)} />
            )}

            {/* ── No-customer tips ── */}
            {!customer && (
              <SidebarSection icon={TrendingUp} title="คำแนะนำการขายเพิ่มเติม">
                <div className="space-y-2">
                  {[
                    { bg: 'bg-green-100',  text: 'text-green-700',  msg: 'ซื้อครบ ฿5,000 → ลด 5%' },
                    { bg: 'bg-sky-100',    text: 'text-sky-600',    msg: 'ซื้อครบ ฿7,000 รับพัดลม M-71 ฟรี 1 ตัว' },
                    { bg: 'bg-amber-100',  text: 'text-amber-700',  msg: `ซื้อครบ ฿10,000 ได้รับราคาพิเศษเฉพาะคุณเท่านั้น ซื้อเพิ่มเพียง ${fmt(Math.max(0, 10000 - totals.grand))} เท่านั้น` },
                    { bg: 'bg-pink-100',   text: 'text-pink-600',   msg: 'ทุก 1,500 บาท = 1 คะแนน → สมัครเพื่อเริ่มสะสม' },
                  ].map((tip, i) => (
                    <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-[12px] ${tip.bg}`}>
                      <Tag className={`w-5 h-5 mt-0.5 shrink-0 ${tip.text}`} />
                      <span className={`text-b2 leading-snug ${tip.text}`}>{tip.msg}</span>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* ══════════ SECTIONS WHEN CUSTOMER + ITEMS ══════════ */}
            {customer && cartItems.length > 0 && (<>

              {/* ── คำแนะนำการขายเพิ่มเติม ── */}
              <SidebarSection icon={Sparkles} title="คำแนะนำการขายเพิ่มเติม">
                <div className="space-y-3">

                  {/* 1 ── Blue bundle checklist */}
                  {cartItems.length >= 2 && (
                    <div className="rounded-[12px] bg-sky-100 px-3 py-3">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Tag className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="text-c1 font-semibold text-sky-700">ซื้อสินค้าเหล่านี้แล้วถึงโปรทันที</span>
                      </div>
                      <div className="space-y-1.5">
                        {cartItems.slice(0, 3).map(item => {
                          const p = productMap.get(item.sku)
                          const price = p ? pickPriceForTier(p, customer?.priceTier) : undefined
                          return (
                            <div key={item.sku} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </span>
                                <span className="text-c2 text-sky-800 truncate">{p?.name ?? item.sku}</span>
                              </div>
                              {price != null && (
                                <span className="text-c2 font-semibold text-sky-700 tabular-nums shrink-0">{fmt(price)}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2 ── Pink callout */}
                  {mockBuyGetItems.some(i => !claimedBuyGetSkus.has(i.sku) && Math.floor(i.qty / 2) >= 1) && (
                    <div className="rounded-[12px] bg-pink-100 px-3 py-3 flex items-start gap-2">
                      <Tag className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                      <span className="text-c1 font-semibold text-pink-700 leading-snug">
                        ซื้อปากกาเพิ่มอีก 1 ชิ้น รับฟรี สมุดโน้ต
                      </span>
                    </div>
                  )}

                  {/* 3 ── Amber brand promo cards — only NOT yet done */}
                  {mockBrandPromos.filter(bp => bp.spend < bp.threshold).map(bp => {
                    const pct = Math.min(100, Math.round((bp.spend / bp.threshold) * 100))
                    const remaining = Math.max(0, bp.threshold - bp.spend)
                    const brandProduct = cartItems.find(ci => productMap.get(ci.sku)?.brand === bp.brand)
                    const brandP = brandProduct ? productMap.get(brandProduct.sku) : undefined
                    const rewardUnitMatch = bp.reward.match(/(\d+)\s*(ชิ้น|ชุด|ตัว|อัน)/)
                    const rewardUnit = rewardUnitMatch ? `${rewardUnitMatch[1]} ${rewardUnitMatch[2]}` : null
                    return (
                      <div key={bp.brand} className="rounded-[14px] border border-amber-400 bg-amber-50 p-3.5 flex items-start gap-3">
                        <div className="w-14 h-14 rounded-[10px] bg-white overflow-hidden flex items-center justify-center shrink-0">
                          {brandP?.image
                            ? <img src={brandP.image} alt={bp.brand} className="w-full h-full object-cover" />
                            : <span className="text-[9px] font-bold text-amber-700 text-center leading-none px-0.5 break-all">{bp.brand.slice(0, 5)}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-s2 font-bold text-text-primary leading-snug">ซื้อเพิ่มอีก {fmt(remaining)}</div>
                            {rewardUnit && (
                              <span className="text-s2 font-bold shrink-0 mt-0.5" style={{ color: NAVY }}>{rewardUnit}</span>
                            )}
                          </div>
                          <div className="text-c2 text-text-secondary leading-snug line-clamp-2 mt-0.5">
                            โปรแบรนด์ {bp.brand} {bp.reward}
                          </div>
                          <div className="mt-2.5 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: '#F59E0B' }} />
                          </div>
                          <div className="mt-1 text-c2 text-gray-400 tabular-nums">
                            ยอดปัจจุบัน {fmt(bp.spend)} /เป้าหมาย {fmt(bp.threshold)}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* 4 ── Order gift progress cards — only below threshold */}
                  {mockOrderGifts.filter(g => totals.grand < g.threshold).map(gift => {
                    const pct = Math.min(100, Math.round((totals.grand / gift.threshold) * 100))
                    const remaining = Math.max(0, gift.threshold - totals.grand)
                    return (
                      <div key={gift.id} className="rounded-[14px] border border-amber-400 bg-amber-50 p-3.5 flex items-start gap-3">
                        <div className="w-14 h-14 rounded-[10px] bg-white overflow-hidden flex items-center justify-center shrink-0">
                          {gift.image
                            ? <img src={gift.image} alt={gift.name} className="w-full h-full object-cover" />
                            : <ProductThumb image={gift.image} name={gift.name} size={56} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-s2 font-bold text-text-primary leading-snug">ซื้อเพิ่มอีก {fmt(remaining)}</div>
                            <span className="text-s2 font-bold shrink-0 mt-0.5" style={{ color: NAVY }}>{gift.qty} {gift.unit}</span>
                          </div>
                          <div className="text-c2 text-text-secondary leading-snug line-clamp-2 mt-0.5">{gift.name}</div>
                          <div className="mt-2.5 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: '#F59E0B' }} />
                          </div>
                          <div className="mt-1 text-c2 text-gray-400 tabular-nums">
                            ยอดปัจจุบัน {fmt(totals.grand)} /เป้าหมาย {fmt(gift.threshold)}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* 5 ── White buy-get product cards — only UNCLAIMED */}
                  {mockBuyGetItems.map(item => {
                    const p = productMap.get(item.sku)
                    if (claimedBuyGetSkus.has(item.sku)) return null
                    const brandHash = (p?.brand ?? item.sku).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
                    const buyQty = brandHash % 2 === 0 ? 1 : 2
                    const giftQty = Math.floor(item.qty / buyQty)
                    if (giftQty < 1) return null
                    const promoTag = `ซื้อ ${buyQty} แถม 1`
                    return (
                      <div key={item.sku} className="rounded-[14px] border border-amber-400 bg-amber-50 p-3.5 flex items-start gap-3">
                        <ProductThumb image={p?.image} name={p?.name ?? item.sku} size={56} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-s2 font-bold text-text-primary line-clamp-2 leading-snug flex-1">{p?.name ?? item.sku}</div>
                            <span className="text-s2 font-bold shrink-0 mt-0.5" style={{ color: NAVY }}>{item.qty} {p?.unit ?? 'ชิ้น'}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2.5 gap-2">
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[8px] bg-red-100 text-red-600 shrink-0">
                              <Tag className="w-3 h-3" />{promoTag}
                            </span>
                            <button
                              onClick={() => setClaimedBuyGetSkus(prev => new Set([...prev, item.sku]))}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition shrink-0" style={{ backgroundColor: '#FFE3A3', color: '#C36800' }}
                            >
                              <Hourglass className="w-4 h-4" />รอสแกน
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                </div>
              </SidebarSection>

              {/* ── โปรโมชั่น & ของแถม ── */}
              {(claimedBuyGetSkus.size > 0 || mockBrandPromos.some(b => b.spend >= b.threshold) || mockOrderGifts.some(g => totals.grand >= g.threshold)) && (
                <SidebarSection icon={Gift} title="โปรโมชั่น & ของแถม">
                  <div className="space-y-4">

                    {/* ─ ของแถมที่ได้รับ (claimed buy-get) ─ */}
                    {(() => {
                      const claimedItems = mockBuyGetItems.filter(i => claimedBuyGetSkus.has(i.sku))
                      if (claimedItems.length === 0) return null
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-c1 font-semibold text-brand-navy">• ของแถมที่ได้รับ</span>
                            <span className="text-c2 text-text-muted">{claimedItems.length} รายการ</span>
                          </div>
                          <div className="space-y-2">
                            {claimedItems.map(item => {
                              const p = productMap.get(item.sku)
                              const brandHash = (p?.brand ?? item.sku).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
                              const buyQty = brandHash % 2 === 0 ? 1 : 2
                              const giftQty = Math.floor(item.qty / buyQty)
                              const promoTag = `ซื้อ ${buyQty} แถม 1`
                              return (
                                <div key={item.sku} className="rounded-[14px] bg-white border border-gray-200 p-3.5 flex items-start gap-3">
                                  <ProductThumb image={p?.image} name={p?.name ?? item.sku} size={56} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="text-s2 font-bold text-text-primary line-clamp-2 leading-snug flex-1">{p?.name ?? item.sku}</div>
                                      <span className="text-s2 font-bold shrink-0 mt-0.5" style={{ color: NAVY }}>{giftQty} {p?.unit ?? 'ชิ้น'}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2.5 gap-2">
                                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[8px] bg-red-100 text-red-600 shrink-0">
                                        <Tag className="w-3 h-3" />{promoTag}
                                      </span>
                                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold shrink-0" style={{ backgroundColor: '#CDFFE7', color: '#27AE60' }}>
                                        <CheckCircle2 className="w-4 h-4" />รับแล้ว
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* ─ ของรางวัลจากคำสั่งซื้อ ─ */}
                    {mockOrderGifts.filter(g => totals.grand >= g.threshold).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-c1 font-semibold text-brand-navy">• ของรางวัลจากคำสั่งซื้อ</span>
                          <span className="text-c2 text-text-muted">{mockOrderGifts.filter(g => totals.grand >= g.threshold).length} รายการ</span>
                        </div>
                        <div className="space-y-2">
                          {mockOrderGifts.filter(g => totals.grand >= g.threshold).map(gift => {
                            const claimed = claimedOrderGiftIds.has(gift.id)
                            return (
                              <div key={gift.id} className={`rounded-[14px] border p-3.5 flex items-start gap-3 ${claimed ? 'border-green-300 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
                                <div className={`w-14 h-14 rounded-[10px] bg-white overflow-hidden flex items-center justify-center shrink-0 `}>
                                  <ProductThumb image={gift.image} name={gift.name} size={56} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-s2 font-bold text-text-primary leading-snug">ได้รับของแถมแล้ว</div>
                                    <span className="text-s2 font-bold shrink-0 mt-0.5" style={{ color: NAVY }}>{gift.qty} {gift.unit}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1.5 gap-2">
                                    <div className="text-c2 text-text-secondary leading-snug line-clamp-2 min-w-0">{gift.name}</div>
                                    {claimed ? (
                                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold shrink-0" style={{ backgroundColor: '#CDFFE7', color: '#27AE60' }}>
                                        <CheckCircle2 className="w-4 h-4" />รับแล้ว
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => setClaimedOrderGiftIds(prev => new Set([...prev, gift.id]))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition shrink-0" style={{ backgroundColor: '#FFE3A3', color: '#C36800' }}
                                      >
                                        <Hourglass className="w-4 h-4" />รอสแกน
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* ─ โปรแบรนด์ที่ได้รับ ─ */}
                    {mockBrandPromos.filter(b => b.spend >= b.threshold).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-c1 font-semibold text-brand-navy">• โปรแบรนด์ที่ได้รับ</span>
                          <span className="text-c2 text-text-muted">{mockBrandPromos.filter(b => b.spend >= b.threshold).length} รายการ</span>
                        </div>
                        <div className="space-y-2">
                          {mockBrandPromos.filter(b => b.spend >= b.threshold).map(bp => {
                            const claimed = claimedBrandPromoNames.has(bp.brand)
                            const brandProduct = cartItems.find(ci => productMap.get(ci.sku)?.brand === bp.brand)
                            const brandP = brandProduct ? productMap.get(brandProduct.sku) : undefined
                            const rewardInfo = parseBrandReward(bp.reward)
                            return (
                              <div key={bp.brand} className={`rounded-[14px] border p-3.5 flex items-start gap-3 ${claimed ? 'border-green-300 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
                                <div className={`w-14 h-14 rounded-[10px] bg-white overflow-hidden flex items-center justify-center shrink-0 `}>
                                  {brandP?.image
                                    ? <img src={brandP.image} alt={bp.brand} className="w-full h-full object-cover" />
                                    : <span className="text-[9px] font-bold text-gray-500 text-center leading-none px-0.5 break-all">{bp.brand.slice(0, 5)}</span>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-s2 font-bold text-text-primary leading-snug flex-1">
                                      {claimed ? 'ได้รับแล้ว' : 'ได้รับโปรแบรนด์แล้ว'}
                                    </div>
                                    <span className="text-s2 font-bold shrink-0 mt-0.5" style={{ color: NAVY }}>
                                      {rewardInfo.qty} {rewardInfo.unit}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1.5 gap-2">
                                    <div className="text-c2 text-text-secondary leading-snug line-clamp-2 min-w-0">โปรแบรนด์ {bp.brand} {bp.reward}</div>
                                    {!claimed ? (
                                      <button
                                        onClick={() => setClaimedBrandPromoNames(prev => new Set([...prev, bp.brand]))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition shrink-0" style={{ backgroundColor: '#FFE3A3', color: '#C36800' }}
                                      >
                                        <Hourglass className="w-4 h-4" />รอสแกน
                                      </button>
                                    ) : (
                                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold shrink-0" style={{ backgroundColor: '#CDFFE7', color: '#27AE60' }}>
                                        <CheckCircle2 className="w-4 h-4" />รับแล้ว
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </SidebarSection>
              )}

              {/* ── ของรางวัลที่แลกไว้ ── */}
              {mockRedeemedRewards.length > 0 && (
                <SidebarSection icon={Trophy} title="ของรางวัลที่แลกไว้" count={mockRedeemedRewards.length}>
                  <div className="space-y-2">
                    {mockRedeemedRewards.map(reward => {
                      const claimed = claimedRewardIds.has(reward.id)
                      return (
                        <div key={reward.id} className={`rounded-[14px] border p-3.5 flex items-start gap-3 ${claimed ? 'border-green-300 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
                          <div className={`w-14 h-14 rounded-[10px] bg-white overflow-hidden flex items-center justify-center shrink-0 `}>
                            <ProductThumb image={reward.image} name={reward.name} size={56} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-s2 font-bold text-text-primary line-clamp-2 leading-snug flex-1">{reward.name}</div>
                              <span className="text-s2 font-bold shrink-0 mt-0.5" style={{ color: NAVY }}>{reward.qty} {reward.unit}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span className="text-c2 text-text-muted truncate">ใช้ได้ถึง: {reward.expiry}</span>
                              </div>
                              {claimed ? (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold shrink-0" style={{ backgroundColor: '#CDFFE7', color: '#27AE60' }}>
                                  <CheckCircle2 className="w-4 h-4" />รับแล้ว
                                </span>
                              ) : (
                                <button
                                  onClick={() => setClaimedRewardIds(prev => new Set([...prev, reward.id]))}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition shrink-0" style={{ backgroundColor: '#FFE3A3', color: '#C36800' }}
                                >
                                  <Hourglass className="w-4 h-4" />รอสแกน
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </SidebarSection>
              )}

            </>)}

            {/* ── คูปองส่วนลด ── */}
            {customer && (() => {
              const COUPON_BG: Record<'sky'|'red'|'green'|'amber'|'orange'|'teal'|'blue'|'purple', string> = {
                sky: '#0EA5E9', red: '#EF4444', green: '#22C55E',
                amber: '#F59E0B', orange: '#F97316', teal: '#14B8A6', blue: '#3B82F6', purple: '#A855F7',
              };
              const NEAR_EXPIRY_DAYS = 15;
              const isNear = (c: { daysUntilExpiry?: number }) =>
                c.daysUntilExpiry !== undefined && c.daysUntilExpiry <= NEAR_EXPIRY_DAYS;
              const cartTotal = totals.grand;
              const appliedDiscount = appliedCoupons.reduce((s, c) => s + c.amount, 0);
              const reasonFor = (c: { id: string; amount: number; minPurchase?: number }): string | null => {
                if (c.minPurchase != null && cartTotal < c.minPurchase) return 'ยอดซื้อยังไม่ถึงขั้นต่ำ';
                const alreadyApplied = appliedCoupons.some(a => a.id === c.id);
                if (!alreadyApplied && appliedDiscount + c.amount > cartTotal) return 'ส่วนลดเกินยอดซื้อ';
                return null;
              };
              // Sidebar shows up to 3 featured "default" coupons + any picked-from-popup
              // extras. The popup only carries the rest (so nothing duplicates between
              // the two views).
              const MAX_DEFAULT_COUPONS = 3;
              const defaultCoupons = mockAvailableCoupons.slice(0, MAX_DEFAULT_COUPONS);
              const defaultIds = new Set(defaultCoupons.map(c => c.id));
              const sidebarCoupons = [
                ...defaultCoupons,
                ...appliedCoupons.filter(c => !defaultIds.has(c.id)),
              ];
              const sortedSidebar = [...sidebarCoupons].sort((a, b) =>
                (isNear(b) ? 1 : 0) - (isNear(a) ? 1 : 0)
              );
              return (
                <SidebarSection
                  icon={Ticket}
                  title="คูปองส่วนลด"
                  action={
                    <button
                      type="button"
                      onClick={() => setShowCouponDialog(true)}
                      className="text-c2 text-sky-500 hover:text-sky-600 underline"
                    >
                      เลือกส่วนลด
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {sortedSidebar.map(c => {
                      const isApplied = appliedCoupons.some(a => a.id === c.id);
                      const isNearExpiry = isNear(c);
                      const reason = reasonFor(c);
                      const isDisabled = !isApplied && reason !== null;
                      const cardClass = isDisabled
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : isNearExpiry
                          ? 'border-red-400 bg-red-50 cursor-pointer'
                          : isApplied
                            ? 'border-sky-400 bg-sky-50 cursor-pointer'
                            : 'border-gray-300 bg-white hover:bg-bg-page-2 cursor-pointer';
                      const expiryText = isNearExpiry
                        ? `หมดอายุใน ${c.daysUntilExpiry} วัน`
                        : c.detail;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return;
                            setAppliedCoupons(prev =>
                              prev.some(x => x.id === c.id)
                                ? prev.filter(x => x.id !== c.id)
                                : [...prev, c]
                            );
                          }}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-[14px] border transition text-left ${cardClass}`}
                        >
                          <div
                            className="w-14 h-14 rounded-[10px] flex flex-col items-center justify-center gap-0.5 shrink-0"
                            style={{ backgroundColor: COUPON_BG[c.color] }}
                          >
                            <ShoppingCart className="w-5 h-5 text-white" />
                            <span className="text-[9px] font-bold text-white leading-none">ส่วนลด</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-s2 text-text-primary truncate">{c.label}</div>
                            {c.minPurchase != null && (
                              <div className="text-c2 text-text-secondary truncate">
                                ใช้เมื่อซื้อขั้นต่ำ ฿{c.minPurchase.toLocaleString('th-TH')}
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className={`w-3.5 h-3.5 shrink-0 ${isNearExpiry ? 'text-red-500' : 'text-text-muted'}`} />
                              <span className={`text-c3 truncate ${isNearExpiry ? 'text-red-600 font-semibold' : 'text-text-muted'}`}>
                                {expiryText}
                              </span>
                            </div>
                            {isDisabled && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Ban className="w-3 h-3 text-gray-500 shrink-0" />
                                <span className="text-c3 font-medium text-gray-600 truncate">{reason}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-row items-center gap-2 shrink-0 self-start">
                            <span
                              onClick={(e) => e.stopPropagation()}
                              className="text-c2 font-medium underline text-text-primary cursor-pointer"
                            >
                              เงื่อนไข
                            </span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                              isApplied ? 'bg-sky-500' : isDisabled ? 'border-2 border-gray-200 bg-gray-100' : 'border-2 border-gray-300 bg-white'
                            }`}>
                              {isApplied && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {sortedSidebar.length === 0 && (
                      <div className="rounded-[14px] border border-dashed border-gray-300 py-6 text-center text-c1 text-text-muted">
                        ไม่มีคูปองที่ใช้ได้
                      </div>
                    )}
                  </div>
                </SidebarSection>
              );
            })()}

            {/* ── การรับสินค้า ── */}
            {customer && (
              <SidebarSection icon={Truck} title="การรับสินค้า">
                <div className="space-y-3">
                  {/* Toggle buttons — both can be active when mixed */}
                  <div className="grid grid-cols-2 gap-2">
                    {(['pickup', 'delivery'] as const).map(mode => {
                      const active = mode === 'pickup' ? pickupCount > 0 : deliveryCount > 0
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            const alreadyAll = mode === 'pickup' ? deliveryCount === 0 : pickupCount === 0
                            if (alreadyAll || cartItems.length === 0) return
                            setPendingBulkFulfillment(mode)
                            setShowFulfillmentConfirm(true)
                          }}
                          className={`relative flex flex-col items-center gap-1.5 px-3 pt-3 pb-3 rounded-[14px] border transition ${
                            active ? 'bg-sky-50' : 'border-gray-300 bg-white hover:bg-bg-page-2'
                          }`}
                          style={active ? { borderColor: '#0197FF' } : undefined}
                        >
                          {mode === 'pickup'
                            ? <Store className="w-6 h-6 shrink-0" style={{ color: '#0197FF' }} />
                            : <Truck className="w-6 h-6 shrink-0" style={{ color: '#0197FF' }} />}
                          <span className="text-center leading-tight text-s2 whitespace-pre-line" style={{ color: '#0197FF' }}>
                            {mode === 'pickup' ? 'รับเอง\nหน้าร้าน' : 'จัดส่ง\nผ่านขนส่ง'}
                          </span>
                          <div
                            className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition ${
                              active ? '' : 'border-2 border-gray-300 bg-white'
                            }`}
                            style={active ? { backgroundColor: '#0197FF' } : undefined}
                          >
                            {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Mixed fulfillment banner — always visible when mixed */}
                  {hasMixedFulfillment && (
                    <div className="rounded-[12px] bg-sky-50 border border-sky-200 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="text-s2" style={{ color: '#111827' }}>บิลนี้มีการแยกรับสินค้า</span>
                        </div>
                        <button type="button" onClick={() => setShowFulfillmentSummary(true)} className="text-c2 text-sky-500 underline hover:text-sky-600 shrink-0">ดูเพิ่มเติม</button>
                      </div>
                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-c1" style={{ color: NAVY }}><Store className="w-3.5 h-3.5" /> รับเองหน้าร้าน</span>
                          <span className="text-s2" style={{ color: NAVY }}>{pickupCount} รายการ</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-c1" style={{ color: NAVY }}><Truck className="w-3.5 h-3.5" /> จัดส่งผ่านขนส่ง</span>
                          <span className="text-s2" style={{ color: NAVY }}>{deliveryCount} รายการ</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery details — show whenever any item is delivery */}
                  {deliveryCount > 0 && (
                    <div className="rounded-[14px] bg-sky-50 border border-sky-200 p-3 space-y-3">
                      {/* Address */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-c1 text-text-secondary">ที่อยู่สำหรับจัดส่ง</span>
                          {selectedAddress && (
                            <button type="button" onClick={() => setShowAddressDialog(true)} className="text-c2 text-sky-500 underline hover:text-sky-600">เปลี่ยนที่อยู่</button>
                          )}
                        </div>
                        {selectedAddress ? (
                          <div className="rounded-[10px] border border-gray-200 px-3 py-2.5 bg-white">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span className="text-c1 font-semibold text-text-primary">{selectedAddress.contactName ?? selectedAddress.branchName ?? customer.name}</span>
                            </div>
                            <div className="flex items-start gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                              <span className="text-c2 text-text-secondary leading-snug">{[selectedAddress.address, selectedAddress.district, selectedAddress.province, selectedAddress.postalCode].filter(Boolean).join(' ')}</span>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setShowAddressDialog(true)} className="w-full h-10 rounded-[10px] border border-dashed border-sky-300 bg-white text-c1 text-sky-500 hover:bg-sky-50 transition">
                            + เพิ่มที่อยู่
                          </button>
                        )}
                      </div>
                      {/* Courier + Contact — only after an address is picked */}
                      {selectedAddress && (
                        <>
                          <div className="border-t border-sky-200 pt-3">
                            <div className="text-c1 text-text-secondary mb-1.5">เลือกบริษัทขนส่ง</div>
                            <div className="relative">
                              <select
                                value={selectedCourier}
                                onChange={e => setSelectedCourier(e.target.value)}
                                className="w-full h-10 pl-3 pr-8 rounded-[10px] border border-gray-200 text-c1 text-text-primary bg-white appearance-none outline-none focus:border-sky-400"
                              >
                                {['Flash Express', 'Kerry Express', 'J&T Express', 'SCG Express', 'นิ่มซี่เส็ง', 'รถบริษัท'].map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          {(selectedAddress.phone || customer.phone) && (
                            <div className="flex items-center gap-1.5 text-c1 text-sky-500">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              เบอร์โทรติดต่อขนส่ง : {selectedAddress.phone ?? customer.phone}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Note */}
                  <div>
                    <div className="text-c1 text-text-secondary mb-1.5">รายละเอียดเพิ่มเติม</div>
                    <textarea
                      value={deliveryNote}
                      onChange={e => setDeliveryNote(e.target.value)}
                      placeholder="ระบุรายละเอียดเพิ่มเติม เช่น วิธีแพ็ค, เวลาจัดส่ง..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-[10px] border border-gray-200 text-c1 text-text-primary placeholder:text-gray-400 resize-none outline-none focus:border-sky-400 transition"
                    />
                  </div>
                </div>
              </SidebarSection>
            )}

            {/* ── การแพ็คสินค้า ── */}
            {customer && (
              <SidebarSection
                icon={Box}
                title="การแพ็คสินค้า"
                action={
                  packaging.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowPackagingDialog(true)}
                      className="text-c2 text-sky-500 hover:text-sky-600 underline"
                    >
                      แก้ไข
                    </button>
                  ) : undefined
                }
              >
                {(() => {
                  const TAG_COLOR: Record<string, { bg: string; text: string }> = {
                    ลัง:      { bg: 'bg-amber-100',  text: 'text-amber-700' },
                    ถุง:      { bg: 'bg-green-100',  text: 'text-green-700' },
                    ซอง:      { bg: 'bg-teal-100',   text: 'text-teal-700' },
                    พาเลท:    { bg: 'bg-purple-100', text: 'text-purple-700' },
                    บับเบิ้ล:  { bg: 'bg-sky-100',    text: 'text-sky-700' },
                    โฟม:      { bg: 'bg-orange-100', text: 'text-orange-700' },
                    กระดาษ:    { bg: 'bg-rose-100',   text: 'text-rose-700' },
                  };
                  if (packaging.length === 0) {
                    return (
                      <button
                        type="button"
                        onClick={() => setShowPackagingDialog(true)}
                        className="w-full h-12 rounded-[14px] border border-dashed border-gray-300 text-c1 text-text-secondary hover:bg-bg-page-2 transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        เลือกวัสดุที่ใช้แพ็ค
                      </button>
                    );
                  }
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {packaging.map(p => {
                        const tag = TAG_COLOR[p.category] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
                        return (
                          <span
                            key={p.id}
                            className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-c2 font-medium ${tag.bg} ${tag.text}`}
                          >
                            <span>{p.name}</span>
                            <span className="font-bold">×{p.qty}</span>
                            <button
                              type="button"
                              onClick={() => setPackaging(prev => prev.filter(x => x.id !== p.id))}
                              className="w-4 h-4 flex items-center justify-center rounded-full bg-white/70 hover:bg-white transition"
                              title="ลบรายการนี้"
                            >
                              <X className="w-2.5 h-2.5" strokeWidth={2.5} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
              </SidebarSection>
            )}

            {/* ── สรุปคำสั่งซื้อ ── */}
            {customer && cartItems.length > 0 && (
              <SidebarSection icon={ShoppingCart} title="สรุปคำสั่งซื้อ">
                <div className="space-y-1.5 text-c1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">ยอดรวม ({cartItems.length} รายการ)</span>
                    <span className="tabular-nums text-text-primary font-semibold">{fmt(totals.subtotal)}</span>
                  </div>
                  {mockBuyGetItems.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">สินค้าของแถม ({mockBuyGetItems.length} รายการ)</span>
                      <span className="text-green-600 font-semibold">฿ฟรี</span>
                    </div>
                  )}
                  {packagingCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">ค่าบรรจุภัณฑ์</span>
                      <span className="tabular-nums text-text-primary">{fmt(packagingCost)}</span>
                    </div>
                  )}
                  {totalDiscount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowDiscountDetail(d => !d)}
                        className="flex items-center justify-between w-full"
                      >
                        <span className="text-status-danger font-semibold">รวมส่วนลด</span>
                        <span className="flex items-center gap-1 text-status-danger font-semibold tabular-nums">
                          -{fmt(totalDiscount)}
                          {showDiscountDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                      {showDiscountDetail && (
                        <div className="pl-3 space-y-1 border-l-2 border-red-100">
                          {discountBreakdown.map((d, i) => (
                            <div key={i} className="flex justify-between text-c2">
                              <span className="text-text-muted truncate max-w-[160px]">{d.label}</span>
                              <span className="tabular-nums text-status-danger shrink-0">-{fmt(d.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {deliveryCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">ค่าจัดส่ง</span>
                      <span className="text-c2 text-text-muted italic">*ลูกค้าชำระที่ปลายทาง</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-between">
                    <span className="text-s2 font-bold text-text-primary">ยอดชำระสุทธิ</span>
                    <span className="text-s1 font-bold tabular-nums" style={{ color: NAVY }}>{fmt(netTotal)}</span>
                  </div>
                </div>
              </SidebarSection>
            )}

          </div>

          {/* F11 — สรุปบิล (sidebar bottom) */}
          {(() => {
            const noItems = cartItems.length === 0;
            const noCustomer = customer === null;
            const isDisabled = noItems || noCustomer;
            // Bill summary entry flow: gift-scan warning → near-promo warning → main summary
            const unscannedBuyGet = mockBuyGetItems.filter(i => !claimedBuyGetSkus.has(i.sku));
            const unscannedOrderGifts = mockOrderGifts.filter(g => totals.grand >= g.threshold && !claimedOrderGiftIds.has(g.id));
            const unscannedBrandPromos = mockBrandPromos.filter(b => b.spend >= b.threshold && !claimedBrandPromoNames.has(b.brand));
            const hasUnscanned = unscannedBuyGet.length > 0 || unscannedOrderGifts.length > 0 || unscannedBrandPromos.length > 0;
            const nearPromos = mockBrandPromos.filter(bp => bp.spend < bp.threshold);
            const hasNearPromo = nearPromos.length > 0;
            const openBillSummary = () => {
              if (hasUnscanned || hasNearPromo) setShowBillIntercept(true);
              else { setShowFulfillmentSummaryFull(true); setShowFulfillmentSummary(true); }
            };
            const tooltipMsg = noItems && noCustomer
              ? 'กรุณาเลือกลูกค้าและเพิ่มสินค้าก่อน'
              : noCustomer ? 'กรุณาเลือกลูกค้าก่อน'
              : noItems   ? 'กรุณาเพิ่มสินค้าก่อน'
              : '';
            return (
              <div className="p-2 border-t border-gray-200 bg-white">
                <div className="relative group">
                  <button
                    disabled={isDisabled}
                    onClick={openBillSummary}
                    className="w-full h-14 rounded-[12px] text-h5 transition-colors duration-200 disabled:cursor-not-allowed"
                    style={{ backgroundColor: isDisabled ? '#E5E7EB' : YELLOW, color: isDisabled ? '#9CA3AF' : NAVY }}
                  >
                    F11 - สรุปบิล
                  </button>
                  {isDisabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-[8px] bg-gray-800 text-white text-c2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {tooltipMsg}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}
