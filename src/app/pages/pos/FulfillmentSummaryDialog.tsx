import { X, Store, Truck } from 'lucide-react';
import type { PosCartItem } from '../../../services/cartApi';
import type { ApiProduct } from '../../../services/productsApi';
import { ProductThumb } from '../../components/ui/ProductThumb';

const NAVY = '#0B1E8A';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface SummaryFreeItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  image?: string;
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
              </div>
            </div>
          )}

          {pickupTotal === 0 && deliveryTotal === 0 && (
            <div className="py-12 text-center text-b3 text-text-muted">
              ยังไม่มีรายการสินค้า
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
