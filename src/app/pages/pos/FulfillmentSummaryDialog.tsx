import { X, Store, Truck, User, Phone, MapPin, Box, ShoppingCart } from 'lucide-react';
import type { PosCartItem } from '../../../services/cartApi';
import type { ApiProduct } from '../../../services/productsApi';
import { ProductThumb } from '../../components/ui/ProductThumb';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface SummaryFreeItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  image?: string;
}

/** Shipping details rendered at the bottom of the delivery section. */
export interface ShippingInfo {
  contactName?: string;
  phone?: string;
  address?: string;
  courier?: string;
}

/** Packaging chip in the "บรรจุภัณฑ์ที่ใช้" section. */
export interface SummaryPackagingItem {
  id: string;
  name: string;
  qty: number;
}

/** Numbers shown in the "สรุปคำสั่งซื้อ" section at the bottom. */
export interface SummaryTotals {
  /** Paid cart items count + ยอดรวม (subtotal before discounts). */
  subtotalCount: number;
  subtotal: number;
  /** Free promo/gift items count (สินค้าของแถม). */
  freeItemsCount?: number;
  /** Redeemed-reward items count. */
  rewardsCount?: number;
  /** ค่าบรรจุภัณฑ์ที่แตกง่าย */
  packagingCost?: number;
  /** รวมส่วนลด (single number for the breakdown row). */
  discountAmount?: number;
  /** Number of discount lines (shown next to "รวมส่วนลด (X รายการ)"). */
  discountLines?: number;
  /** True when there's at least one delivery item — shows ค่าจัดส่ง note. */
  hasDelivery: boolean;
  /** ยอดชำระสุทธิ */
  netTotal: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cartItems: PosCartItem[];
  fulfillmentMap: Record<string, 'pickup' | 'delivery'>;
  productMap: Map<string, ApiProduct>;
  /** buy-get free items — shown in pickup section */
  buyGetFreeItems?: SummaryFreeItem[];
  /** order threshold gifts — shown in pickup section */
  orderGifts?: SummaryFreeItem[];
  /** redeemed point rewards — shown in delivery section */
  redeemedRewards?: SummaryFreeItem[];
  /** Shipping address + courier shown at the foot of the delivery section. */
  shipping?: ShippingInfo;
  /** Packaging chips rendered after the pickup/delivery sections. */
  packaging?: SummaryPackagingItem[];
  /** Bill totals shown in the "สรุปคำสั่งซื้อ" block. Omit to hide that block. */
  totals?: SummaryTotals;
  /** Footer "Enter - ยืนยันข้อมูล" — triggers checkout. Omit to hide footer. */
  onConfirm?: () => void;
  /** Footer "สแกนสินค้าเพิ่มเติม" — keeps shopping; falls back to onClose. */
  onScanMore?: () => void;
}

// ─── Product cell ─────────────────────────────────────────────────────────────
function ProductCell({
  image, name, qty, unit, price, free,
}: {
  image?: string; name: string; qty: number; unit: string; price?: number; free?: boolean;
  tone?: 'pickup' | 'delivery'; // kept for API compatibility, no longer affects styling
}) {
  return (
    <div className="flex items-stretch gap-3 py-2 px-3 bg-white rounded-[12px] h-full">
      <ProductThumb image={image} name={name} size={44} />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-b2 text-text-primary leading-snug line-clamp-2 mb-2">{name}</div>
        <div className="flex items-end justify-between gap-2 mt-auto">
          <span className="text-c1 shrink-0" style={{ color: '#4D5461' }}>จำนวน : {qty} {unit}</span>
          {free ? (
            <span className="text-s1 font-bold text-green-500 shrink-0">ฟรี</span>
          ) : price != null ? (
            <span className="text-s1 font-bold tabular-nums shrink-0" style={{ color: NAVY }}>{fmt(price)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-section ──────────────────────────────────────────────────────────────
function SubSection({
  label, count, children,
}: {
  label: string; count: number; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-s1 mb-3" style={{ color: NAVY }}>
        {label} ({count} รายการ)
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function FulfillmentSummaryDialog({
  open, onClose, cartItems, fulfillmentMap, productMap,
  buyGetFreeItems = [], orderGifts = [], redeemedRewards = [],
  shipping, packaging = [], totals, onConfirm, onScanMore,
}: Props) {
  if (!open) return null;

  const pickupItems = cartItems.filter(i => (fulfillmentMap[i.sku] ?? 'pickup') === 'pickup');
  const deliveryItems = cartItems.filter(i => fulfillmentMap[i.sku] === 'delivery');

  // total counts per section
  const pickupTotal = pickupItems.length + buyGetFreeItems.length + orderGifts.length;
  const deliveryTotal = deliveryItems.length + redeemedRewards.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[1100px] mx-4 flex flex-col overflow-hidden max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 shrink-0" style={{ backgroundColor: NAVY }}>
          <div>
            <div className="text-h5 font-bold text-white">สรุปรายละเอียดสินค้า</div>
            <div className="text-c2 text-white/60 mt-0.5">ตรวจสอบรายการก่อนยืนยันคำสั่งซื้อสำเร็จ</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 transition mt-0.5">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 bg-white">
          {/* ── Pickup ── */}
          {pickupTotal > 0 && (
            <div>
              <div className="flex items-center gap-2 text-s2 mb-3" style={{ color: '#0197FF' }}>
                <Store className="w-5 h-5 shrink-0" />
                รับเองหน้าร้าน ({pickupTotal} รายการ)
              </div>
              <div className="rounded-[16px] bg-sky-50 border border-sky-200 p-5 space-y-5">
                {pickupItems.length > 0 && (
                  <SubSection label="รายการสินค้าที่สั่งซื้อ" count={pickupItems.length}>
                    {pickupItems.map(item => {
                      const p = productMap.get(item.sku);
                      return (
                        <ProductCell
                          key={item.sku}
                          image={p?.image}
                          name={p?.name ?? item.sku}
                          qty={item.qty}
                          unit={p?.unit ?? 'ชิ้น'}
                          price={parseFloat(item.unitPrice) * item.qty}
                          tone="pickup"
                        />
                      );
                    })}
                  </SubSection>
                )}
                {buyGetFreeItems.length > 0 && (
                  <SubSection label="รายการของแถมที่ได้รับ" count={buyGetFreeItems.length}>
                    {buyGetFreeItems.map(item => (
                      <ProductCell key={item.id} image={item.image} name={item.name} qty={item.qty} unit={item.unit} free tone="pickup" />
                    ))}
                  </SubSection>
                )}
                {orderGifts.length > 0 && (
                  <SubSection label="รายการของรางวัลจากคำสั่งซื้อ" count={orderGifts.length}>
                    {orderGifts.map(item => (
                      <ProductCell key={item.id} image={item.image} name={item.name} qty={item.qty} unit={item.unit} free tone="pickup" />
                    ))}
                  </SubSection>
                )}
              </div>
            </div>
          )}

          {/* ── Delivery ── */}
          {deliveryTotal > 0 && (
            <div>
              <div className="flex items-center gap-2 text-s2 text-amber-600 mb-3">
                <Truck className="w-5 h-5 shrink-0" />
                จัดส่งผ่านขนส่ง ({deliveryTotal} รายการ)
              </div>
              <div className="rounded-[16px] bg-amber-50 border border-amber-200 p-5 space-y-5">
                {deliveryItems.length > 0 && (
                  <SubSection label="รายการสินค้าที่สั่งซื้อ" count={deliveryItems.length}>
                    {deliveryItems.map(item => {
                      const p = productMap.get(item.sku);
                      return (
                        <ProductCell
                          key={item.sku}
                          image={p?.image}
                          name={p?.name ?? item.sku}
                          qty={item.qty}
                          unit={p?.unit ?? 'ชิ้น'}
                          price={parseFloat(item.unitPrice) * item.qty}
                          tone="delivery"
                        />
                      );
                    })}
                  </SubSection>
                )}
                {redeemedRewards.length > 0 && (
                  <SubSection label="รายการของรางวัลที่แลกไว้" count={redeemedRewards.length}>
                    {redeemedRewards.map(item => (
                      <ProductCell key={item.id} image={item.image} name={item.name} qty={item.qty} unit={item.unit} free tone="delivery" />
                    ))}
                  </SubSection>
                )}
                {/* Shipping address block — always show inside delivery section */}
                {(() => {
                  const hasInfo = !!(shipping?.contactName || shipping?.phone || shipping?.address || shipping?.courier);
                  return (
                    <div className="rounded-[12px] bg-white px-4 py-3 mt-1">
                      <div className="text-c2 text-text-muted mb-2">ที่อยู่สำหรับจัดส่ง</div>
                      {hasInfo ? (
                        <div className="space-y-1.5">
                          {shipping!.contactName && (
                            <div className="flex items-center gap-2 text-s2 text-text-primary">
                              <User className="w-4 h-4 shrink-0" style={{ color: NAVY }} />
                              <span>คลังสินค้า {shipping!.contactName}</span>
                            </div>
                          )}
                          {shipping!.phone && (
                            <div className="flex items-center gap-2 text-c1 text-text-primary">
                              <Phone className="w-4 h-4 shrink-0" style={{ color: NAVY }} />
                              <span>{shipping!.phone}</span>
                            </div>
                          )}
                          {shipping!.address && (
                            <div className="flex items-start gap-2 text-c1 text-text-primary">
                              <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: NAVY }} />
                              <span>{shipping!.address}</span>
                            </div>
                          )}
                          {shipping!.courier && (
                            <div className="flex items-center gap-2 text-c1 text-text-primary">
                              <Truck className="w-4 h-4 shrink-0" style={{ color: NAVY }} />
                              <span>{shipping!.courier}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-c1 text-text-muted py-2 text-center">
                          ยังไม่ได้เลือกที่อยู่สำหรับจัดส่ง
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {pickupTotal === 0 && deliveryTotal === 0 && (
            <div className="py-12 text-center text-b3 text-text-muted">
              ยังไม่มีรายการสินค้า
            </div>
          )}

          {/* ── บรรจุภัณฑ์ที่ใช้ ── */}
          {packaging.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-s2 mb-3" style={{ color: NAVY }}>
                <Box className="w-5 h-5 shrink-0" />
                บรรจุภัณฑ์ที่ใช้
              </div>
              <div className="rounded-[16px] bg-gray-50 border border-gray-200 p-4">
                <div className="text-c1 text-text-secondary mb-2.5">
                  รายการบรรจุภัณฑ์ ({packaging.length} รายการ)
                </div>
                <div className="flex flex-wrap gap-2">
                  {packaging.map(p => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-300 text-c1"
                      style={{ color: NAVY }}
                    >
                      <Box className="w-3.5 h-3.5" />
                      {p.name} x{p.qty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── สรุปคำสั่งซื้อ ── */}
          {totals && (
            <div>
              <div className="flex items-center gap-2 text-s2 mb-3" style={{ color: NAVY }}>
                <ShoppingCart className="w-5 h-5 shrink-0" />
                สรุปคำสั่งซื้อ
              </div>
              <div className="rounded-[16px] bg-gray-50 border border-gray-200 p-5 space-y-2 text-c1">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">ยอดรวม ({totals.subtotalCount} รายการ)</span>
                  <span className="tabular-nums text-text-primary">{fmt(totals.subtotal)}</span>
                </div>
                {(totals.freeItemsCount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">สินค้าของแถม ({totals.freeItemsCount} รายการ)</span>
                    <span className="text-green-600 font-semibold">฿ฟรี</span>
                  </div>
                )}
                {(totals.rewardsCount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">ของรางวัลที่แลกไว้ ({totals.rewardsCount} รายการ)</span>
                    <span className="text-green-600 font-semibold">฿ฟรี</span>
                  </div>
                )}
                {(totals.packagingCost ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">ค่าบรรจุภัณฑ์ที่แตกง่าย</span>
                    <span className="tabular-nums text-text-primary">{fmt(totals.packagingCost!)}</span>
                  </div>
                )}
                {(totals.discountAmount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-status-danger font-semibold">
                      รวมส่วนลด{totals.discountLines ? ` (${totals.discountLines} รายการ)` : ''}
                    </span>
                    <span className="text-status-danger font-semibold tabular-nums">-{fmt(totals.discountAmount!)}</span>
                  </div>
                )}
                {totals.hasDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">ค่าจัดส่ง</span>
                    <span className="text-c2 text-text-muted italic">*ลูกค้าชำระค่าจัดส่งสินค้าที่ปลายทาง</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-2 flex items-center justify-between">
                  <span className="text-s2 text-text-primary">ยอดชำระสุทธิ</span>
                  <span className="text-s1 font-bold tabular-nums" style={{ color: NAVY }}>{fmt(totals.netTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {onConfirm && (
          <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onScanMore ?? onClose}
              className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
            >
              สแกนสินค้าเพิ่มเติม
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-[2] h-12 rounded-[12px] text-h5 font-bold transition hover:brightness-95"
              style={{ backgroundColor: YELLOW, color: NAVY }}
            >
              Enter - ยืนยันข้อมูล
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
