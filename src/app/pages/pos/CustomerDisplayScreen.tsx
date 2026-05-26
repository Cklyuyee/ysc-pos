import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Tag, BadgeCheck, Star } from 'lucide-react';
import {
  DISPLAY_CHANNEL,
  type DisplayMessage,
  type DisplayCartState,
  type DisplayThankYouState,
  type DisplayPingMessage,
} from '../../../services/customerDisplayChannel';
import { ProductThumb } from '../../components/ui/ProductThumb';

const NAVY   = '#0B1E8A';
const YELLOW = '#FFC518';
const GREEN  = '#16A34A';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Live clock (isolated component — prevents header re-render every second) ──
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const fmtTimeClock = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
const fmtDateTH = (d: Date) =>
  `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;

const ClockDisplay = memo(function ClockDisplay() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right shrink-0 leading-tight">
      <div className="text-h5 font-bold text-white tabular-nums">{fmtTimeClock(now)}</div>
      <div className="text-c3 font-normal text-white/60">{fmtDateTH(now)}</div>
    </div>
  );
});

// ─── Banner slides ─────────────────────────────────────────────────────────────
/**
 * Banners use static images placed in /public:
 *   - /banner-1.png  Sports — ลด 40%
 *   - /banner-2.png  Duracell ถ่านอัลคาไลน์ 9V — ฿96
 *   - /banner-3.png  คาราวานเครื่องเขียน — ลด 50%
 *   - /banner-4.png  SUMMER SALE — ลด 60%
 * Rendered with `object-cover` so the image fills the banner area cleanly.
 * To add a new slide, drop a PNG/JPG in /public and append to BANNER_SLIDES.
 */
const BANNER_SLIDES = [
  { id: 'banner-1', src: '/banner-1.png', bg: '#1D4ED8' },
  { id: 'banner-2', src: '/banner-2.png', bg: '#FDE8E0' },
  { id: 'banner-3', src: '/banner-3.png', bg: '#16A34A' },
  { id: 'banner-4', src: '/banner-4.png', bg: '#0EA5E9' },
];

/**
 * BannerCarousel — both slides are always mounted (position:absolute).
 * Active slide fades to opacity-1, inactive to opacity-0 via CSS transition.
 * No img unmount/remount → no flash between slides.
 */
const BannerCarousel = memo(function BannerCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive(a => (a + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="shrink-0 rounded-[16px] overflow-hidden relative bg-[#1D4ED8] w-full"
      style={{ aspectRatio: '7 / 1', minHeight: 120, maxHeight: 200 }}
    >
      {BANNER_SLIDES.map((slide, i) => (
        <img
          key={slide.id}
          src={slide.src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          style={{
            opacity: i === active ? 1 : 0,
            transition: 'opacity 700ms ease-in-out',
          }}
          draggable={false}
        />
      ))}
      {/* Slide dots */}
      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-2 z-10">
        {BANNER_SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === active ? 'bg-white scale-125 shadow' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

// ─── Promotion tag colour helper ───────────────────────────────────────────────
function promoTagClass(label: string) {
  if (label.includes('แบรนด์') || label.includes('ได้รับ'))
    return 'bg-amber-100 text-amber-700';
  if (label.includes('แถม'))
    return 'bg-red-50 text-red-600';
  return 'bg-red-50 text-red-600';
}

// ─── Cart item row ─────────────────────────────────────────────────────────────
const CartItemRow = memo(function CartItemRow({
  item, isLast,
}: {
  item: DisplayCartState['items'][number];
  isLast: boolean;
}) {
  const lineDiscount = item.lineDiscount ?? 0;
  const tags = item.promotionTags ?? [];
  const trRef = useRef<HTMLTableRowElement>(null);

  // Restart the flash animation each time this row becomes "last scanned" — even
  // if the same SKU is rescanned (qty increments). Remove the class, force a
  // reflow, then re-add so the CSS keyframes run from 0%.
  useEffect(() => {
    if (!isLast || !trRef.current) return;
    const tr = trRef.current;
    tr.classList.remove('animate-cart-flash');
    void tr.offsetWidth; // reflow
    tr.classList.add('animate-cart-flash');
  }, [isLast, item.qty]);

  return (
    <tr
      ref={trRef}
      className={`animate-cart-in ${isLast ? 'animate-cart-flash' : 'bg-white'}`}
    >
      {/* Name + image */}
      <td className="px-5 py-2">
        <div className="flex items-center gap-4">
          <ProductThumb image={item.image} name={item.name} size={64} />
          <div className="min-w-0 flex-1">
            <div className="text-xl font-semibold text-gray-900 leading-snug line-clamp-2">
              {item.name}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <span key={tag}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-sm font-semibold ${promoTagClass(tag)}`}
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-2 text-center">
        <span className="text-h5 text-gray-900 tabular-nums">{item.qty}</span>
      </td>
      <td className="px-5 py-2 text-right">
        <span className="text-h5 text-gray-900 tabular-nums">{fmt(item.unitPrice)}</span>
      </td>
      <td className="px-5 py-2 text-right">
        <span className="text-h5 text-gray-900 tabular-nums">{fmt(lineDiscount)}</span>
      </td>
      <td className="px-5 py-2 text-right">
        <span className="text-h5 tabular-nums" style={{ color: NAVY }}>{fmt(item.lineTotal)}</span>
      </td>
    </tr>
  );
});

// ─── Customer info snapshot (only fields used by header) ──────────────────────
interface CustomerInfo {
  customerName?: string;
  memberId?: string;
  memberLevel?: string;
  memberTier?: string;
}

/** Memoised — only re-renders when customer info actually changes, not on every cart scan. */
const CustomerHeaderInfo = memo(function CustomerHeaderInfo({ info }: { info: CustomerInfo | null }) {
  if (!info?.customerName) {
    return <div className="text-white font-bold text-2xl mt-1">ยินดีต้อนรับ</div>;
  }
  return (
    <div className="flex items-center justify-start gap-4 mt-1 flex-wrap">
      <span className="text-white font-bold text-2xl">
        สวัสดีคุณ {info.customerName}
      </span>
      {info.memberId && (
        <span className="text-white/80 text-xl border-l-2 border-white/30 pl-4">
          รหัสสมาชิก {info.memberId}
        </span>
      )}
      {info.memberLevel && (
        <span
          className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full font-bold text-base"
          style={{ backgroundColor: YELLOW, color: NAVY }}
        >
          <Crown className="w-4 h-4" />
          {info.memberLevel}
        </span>
      )}
      {info.memberTier && (
        <span className="px-4 py-1 rounded-full border border-white/50 text-white font-bold text-base">
          Price : {info.memberTier}
        </span>
      )}
    </div>
  );
});

// ─── Empty / waiting state ────────────────────────────────────────────────────
const EmptyState = memo(function EmptyState({ connected }: { connected: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <img
        src="/empty-cart.png"
        alt=""
        className="w-52 h-52 object-contain select-none pointer-events-none"
        draggable={false}
      />
      {!connected ? (
        <div className="text-b3 text-text-muted">รอการเชื่อมต่อจากเคาน์เตอร์...</div>
      ) : (
        <>
          <div className="text-h4 text-gray-300">ยินดีต้อนรับ</div>
          <div className="text-c2 text-text-muted">กรุณาแสดงสินค้าเพื่อเริ่มการสแกน</div>
        </>
      )}
    </div>
  );
});

// ─── Product table card (LEFT TOP) ─────────────────────────────────────────────
const ProductTableCard = memo(function ProductTableCard({
  items, lastSku, connected,
}: {
  items: DisplayCartState['items'];
  lastSku: string | null;
  connected: boolean;
}) {
  return (
    <div className="flex-1 min-h-0 bg-white rounded-[16px] shadow-sm overflow-hidden flex flex-col">
      {/* Sticky header table */}
      <table className="w-full shrink-0" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col />
          <col style={{ width: 110 }} />
          <col style={{ width: 160 }} />
          <col style={{ width: 160 }} />
          <col style={{ width: 190 }} />
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: '#111827' }}>
            <th className="text-left  px-5 py-4 text-lg font-bold text-white whitespace-nowrap">รายการสินค้า</th>
            <th className="text-center px-5 py-4 text-lg font-bold text-white whitespace-nowrap">จำนวน</th>
            <th className="text-right  px-5 py-4 text-lg font-bold text-white whitespace-nowrap">ราคา/หน่วย</th>
            <th className="text-right  px-5 py-4 text-lg font-bold text-white whitespace-nowrap">ส่วนลด</th>
            <th className="text-right  px-5 py-4 text-lg font-bold text-white whitespace-nowrap">รวม</th>
          </tr>
        </thead>
      </table>
      {items.length === 0 ? (
        <EmptyState connected={connected} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col />
              <col style={{ width: 110 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 190 }} />
            </colgroup>
            <tbody className="divide-y divide-gray-200">
              {items.map(item => (
                <CartItemRow
                  key={item.sku}
                  item={item}
                  isLast={item.sku === lastSku}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ─── TOTAL card (RIGHT TOP) ────────────────────────────────────────────────────
const TotalCard = memo(function TotalCard({
  grand, subtotal, itemCount, freeItemCount, promoDisc, billDisc, totalDisc,
}: {
  grand: number; subtotal: number; itemCount: number; freeItemCount: number;
  promoDisc: number; billDisc: number; totalDisc: number;
}) {
  const showBreakdown = promoDisc > 0 || billDisc > 0;
  return (
    <div className="shrink-0 bg-white rounded-[16px] shadow-sm overflow-hidden">
      <div className="px-5 py-3 text-center" style={{ backgroundColor: '#111827' }}>
        <span className="text-h5 text-white tracking-wide">ยอดชำระสุทธิ (TOTAL)</span>
      </div>
      <div className="px-5 py-5">
        <div className="text-center mb-5">
          <div className="font-black tabular-nums leading-none" style={{ color: NAVY, fontSize: '52px' }}>
            {fmt(grand)}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-b3">
            <span className="text-text-secondary">ยอดรวม ({itemCount} รายการ)</span>
            <span className="tabular-nums font-bold text-text-primary">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-b3">
            <span className="text-text-secondary">
              ยอดรวมของแถม{freeItemCount > 0 ? ` (${freeItemCount} รายการ)` : ''}
            </span>
            <span className="tabular-nums font-bold text-text-primary">฿0.00</span>
          </div>
          {showBreakdown ? (
            <>
              {promoDisc > 0 && (
                <div className="flex justify-between text-b3">
                  <span className="text-text-secondary">ส่วนลดโปรโมชัน</span>
                  <span className="tabular-nums font-bold text-text-primary">−{fmt(promoDisc)}</span>
                </div>
              )}
              {billDisc > 0 && (
                <div className="flex justify-between text-b3">
                  <span className="text-text-secondary">ส่วนลดท้ายบิล</span>
                  <span className="tabular-nums font-bold text-text-primary">−{fmt(billDisc)}</span>
                </div>
              )}
            </>
          ) : totalDisc > 0 ? (
            <div className="flex justify-between text-b3">
              <span className="text-text-secondary">ส่วนลดรวม</span>
              <span className="tabular-nums font-bold text-text-primary">−{fmt(totalDisc)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

// ─── Free items card (RIGHT BOTTOM) ────────────────────────────────────────────
const FreeItemsCard = memo(function FreeItemsCard({
  freeItems,
}: {
  freeItems: NonNullable<DisplayCartState['freeItems']>;
}) {
  return (
    <div
      className="flex-1 min-h-0 flex flex-col rounded-[16px] overflow-hidden shadow-sm"
      style={{ backgroundColor: '#E8F8EE' }}
    >
      <div className="px-5 py-3 shrink-0" style={{ backgroundColor: GREEN }}>
        <span className="text-h5 text-white leading-snug">
          ของแถม / สิทธิ์ประโยชน์ที่คุณได้รับ
        </span>
      </div>
      {freeItems.length > 0 ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {freeItems.map((fi, i) => (
            <div key={i}
              className="flex items-center gap-3 bg-white rounded-[12px] px-3 py-2.5 border border-gray-100"
            >
              <ProductThumb image={fi.image} name={fi.name} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-b3 font-medium text-text-primary line-clamp-1 leading-snug">{fi.name}</div>
                <div className="text-c2 text-text-muted mt-0.5">x{fi.qty} {fi.unit}</div>
              </div>
              <span className="shrink-0 text-s2 font-bold tabular-nums" style={{ color: GREEN }}>ฟรี</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="text-center text-c1 text-text-muted leading-relaxed">
            ยังไม่มีสิทธิ์ประโยชน์<br />สำหรับรายการนี้
          </div>
        </div>
      )}
    </div>
  );
});

const EMPTY_ARRAY: never[] = [];

// ─── Thank-you overlay (shown after checkout) ──────────────────────────────────
const ThankYouOverlay = memo(function ThankYouOverlay({
  data,
}: {
  data: DisplayThankYouState;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center px-8 animate-cart-in"
      style={{ backgroundColor: NAVY }}
    >
      {/* Big checkmark badge */}
      <div
        className="flex items-center justify-center rounded-full mb-8"
        style={{
          width: 160,
          height: 160,
          backgroundColor: YELLOW,
          boxShadow: '0 8px 32px rgba(255, 197, 24, 0.4)',
        }}
      >
        <BadgeCheck className="w-24 h-24" style={{ color: NAVY }} strokeWidth={2.5} />
      </div>

      {/* Thank-you headline */}
      <div className="text-center mb-3">
        <div className="text-white font-bold tracking-wide" style={{ fontSize: 72, lineHeight: 1.1 }}>
          ขอบคุณที่ใช้บริการ
        </div>
      </div>

      {data.customerName && (
        <div className="text-white/80 text-3xl font-medium mb-8">
          คุณ {data.customerName}
        </div>
      )}

      {/* Order detail card */}
      <div
        className="bg-white rounded-[20px] shadow-2xl px-12 py-8 min-w-[520px]"
        style={{ marginTop: data.customerName ? 0 : 24 }}
      >
        <div className="text-center mb-6">
          <div className="text-text-muted text-lg mb-1">เลขที่คำสั่งซื้อ</div>
          <div
            className="font-bold tabular-nums tracking-wider"
            style={{ color: NAVY, fontSize: 40 }}
          >
            {data.orderId}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5 text-center">
          <div className="text-text-muted text-lg mb-1">ยอดชำระสุทธิ</div>
          <div
            className="font-black tabular-nums leading-none"
            style={{ color: NAVY, fontSize: 56 }}
          >
            {fmt(data.grand)}
          </div>
        </div>

        {data.earnedPoints != null && data.earnedPoints > 0 && (
          <div
            className="mt-6 pt-5 border-t border-gray-200 flex items-center justify-center gap-2"
          >
            <Star className="w-6 h-6" style={{ color: YELLOW, fill: YELLOW }} />
            <span className="text-xl text-text-secondary">
              คะแนนสะสมที่ได้รับ
            </span>
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: NAVY }}
            >
              {data.earnedPoints.toLocaleString('th-TH')} คะแนน
            </span>
          </div>
        )}
      </div>

      {/* Tagline */}
      <div className="mt-10 text-white/70 text-xl">
        แล้วพบกันใหม่ — ยงเจริญเครื่องเขียน
      </div>
    </div>
  );
});

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function CustomerDisplayScreen() {
  const [cartState,    setCartState]    = useState<DisplayCartState | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [lastSku,      setLastSku]      = useState<string | null>(null);
  const [connected,    setConnected]    = useState(false);
  const [thankYou,     setThankYou]     = useState<DisplayThankYouState | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thankYouTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ch = new BroadcastChannel(DISPLAY_CHANNEL);
    ch.postMessage({ type: 'ping' } satisfies DisplayPingMessage);
    ch.onmessage = (e: MessageEvent<DisplayMessage>) => {
      setConnected(true);
      if (e.data.type === 'thank-you') {
        const ty = e.data as DisplayThankYouState;
        setThankYou(ty);
        // Clear cart immediately so we go back to a clean idle state behind the overlay.
        setCartState(null);
        setCustomerInfo(null);
        setLastSku(null);
        if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
        // Auto-dismiss after 10 seconds — POSScreen will start broadcasting a fresh
        // (empty) cart for the next customer; we just hide the overlay.
        thankYouTimerRef.current = setTimeout(() => setThankYou(null), 10000);
        return;
      }
      if (e.data.type === 'idle') {
        setCartState(null);
        setCustomerInfo(null);
        setLastSku(null);
        return;
      }
      if (e.data.type === 'cart-update') {
        const d = e.data as DisplayCartState;
        // A new scan arrived — close any lingering thank-you overlay so the next
        // customer's cart is visible immediately.
        if (d.items.length > 0) {
          if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
          setThankYou(null);
        }
        // Update customer info only when values actually change
        setCustomerInfo(prev => {
          if (
            prev?.customerName === d.customerName &&
            prev?.memberId     === d.memberId     &&
            prev?.memberLevel  === d.memberLevel  &&
            prev?.memberTier   === d.memberTier
          ) return prev;
          return {
            customerName: d.customerName,
            memberId:     d.memberId,
            memberLevel:  d.memberLevel,
            memberTier:   d.memberTier,
          };
        });
        if (d.lastScannedSku) {
          setLastSku(d.lastScannedSku);
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => setLastSku(null), 2500);
        }
        // Skip cartState update if nothing meaningful changed
        // (POSScreen may re-broadcast with identical data on minor state changes).
        // Deep-compare item arrays to avoid spurious re-renders.
        setCartState(prev => {
          if (
            prev &&
            prev.grand    === d.grand    &&
            prev.subtotal === d.subtotal &&
            prev.discount === d.discount &&
            (prev.promoDiscount ?? 0) === (d.promoDiscount ?? 0) &&
            (prev.billDiscount  ?? 0) === (d.billDiscount  ?? 0) &&
            prev.lastScannedSku === d.lastScannedSku &&
            prev.items.length === d.items.length &&
            (prev.freeItems?.length ?? 0) === (d.freeItems?.length ?? 0) &&
            prev.items.every((it, i) => it.sku === d.items[i].sku && it.qty === d.items[i].qty && it.unitPrice === d.items[i].unitPrice) &&
            (prev.freeItems ?? []).every((it, i) =>
              it.sku === d.freeItems![i].sku && it.qty === d.freeItems![i].qty
            )
          ) return prev;
          return d;
        });
      }
    };
    return () => {
      ch.close();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
    };
  }, []);

  // Stable array references when cartState is stable
  const items     = useMemo(() => cartState?.items ?? EMPTY_ARRAY, [cartState]);
  const freeItems = useMemo(() => cartState?.freeItems ?? EMPTY_ARRAY, [cartState]);
  const grand     = cartState?.grand    ?? 0;
  const subtotal  = cartState?.subtotal ?? 0;
  const promoDisc = cartState?.promoDiscount ?? 0;
  const billDisc  = cartState?.billDiscount  ?? 0;
  const totalDisc = cartState?.discount      ?? 0;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden relative"
      style={{ fontFamily: 'inherit', backgroundColor: NAVY }}
    >
      {/* ─── Thank-you overlay (covers entire screen) ─── */}
      {thankYou && <ThankYouOverlay data={thankYou} />}

      {/* ─── Header bar ─── */}
      <div
        className="flex items-center justify-between px-8 h-[64px] shrink-0 border-b-2 border-white/20"
        style={{ backgroundColor: NAVY }}
      >
        {/* Logo */}
        <div className="shrink-0">
          <img
            src="/logo-ysc.png"
            alt="Yong Charaden"
            className="h-10 w-auto object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Customer info — left, isolated memo so cart scans don't re-render it */}
        <div className="flex-1 text-left px-8">
          <div className="text-white/60 text-base leading-tight">ขอบคุณที่ใช้บริการ</div>
          <CustomerHeaderInfo info={customerInfo} />
        </div>

        {/* Clock — isolated component so it doesn't re-render the header */}
        <ClockDisplay />
      </div>

      {/* ─── Body ─── */}
      <div className="flex flex-1 min-h-0 overflow-hidden gap-3 p-3">
        {/* LEFT */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
          <ProductTableCard items={items} lastSku={lastSku} connected={connected} />
          <BannerCarousel />
        </div>
        {/* RIGHT */}
        <div className="w-[400px] shrink-0 flex flex-col gap-3 overflow-hidden">
          <TotalCard
            grand={grand}
            subtotal={subtotal}
            itemCount={items.length}
            freeItemCount={freeItems.length}
            promoDisc={promoDisc}
            billDisc={billDisc}
            totalDisc={totalDisc}
          />
          <FreeItemsCard freeItems={freeItems} />
        </div>
      </div>
    </div>
  );
}
