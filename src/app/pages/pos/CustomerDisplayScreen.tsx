import { memo, useEffect, useRef, useState, useTransition } from 'react';
import { ShoppingCart } from 'lucide-react';
import { DISPLAY_CHANNEL, type DisplayMessage, type DisplayCartState, type DisplayPingMessage } from '../../../services/customerDisplayChannel';
import { ProductThumb } from '../../components/ui/ProductThumb';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Memoised item row — only re-renders when its own data or highlight changes ─
const CartItemRow = memo(function CartItemRow({
  item,
  index,
  isLast,
}: {
  item: DisplayCartState['items'][number];
  index: number;
  isLast: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-[12px] border-2 transition-colors duration-200 ${
        isLast
          ? 'bg-sky-50 border-sky-300 shadow-sm'
          : 'bg-white border-transparent'
      }`}
    >
      {/* Row number */}
      <div className="w-6 text-center text-c2 text-text-muted shrink-0">{index + 1}</div>

      {/* Image */}
      <ProductThumb image={item.image} name={item.name} size={52} />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-b3 text-text-primary leading-snug line-clamp-2">{item.name}</div>
        {isLast && (
          <div className="text-c2 text-sky-600 font-medium mt-0.5 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            สแกนล่าสุด
          </div>
        )}
      </div>

      {/* Qty × price */}
      <div className="text-right shrink-0">
        <div className="text-s2 text-text-primary tabular-nums">
          {item.qty} {item.unit} × {fmt(item.unitPrice)}
        </div>
        <div className="text-s1 text-brand-navy tabular-nums font-semibold">
          {fmt(item.lineTotal)}
        </div>
      </div>
    </div>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CustomerDisplayScreen() {
  const [state, setState] = useState<DisplayCartState | null>(null);
  const [lastSku, setLastSku] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // useTransition: marks cart state updates as non-urgent so React can batch/defer
  // them without blocking the browser's paint cycle → no visible jank
  const [, startTransition] = useTransition();

  useEffect(() => {
    const ch = new BroadcastChannel(DISPLAY_CHANNEL);
    channelRef.current = ch;

    // Request current cart state from POSScreen immediately on open
    ch.postMessage({ type: 'ping' } satisfies DisplayPingMessage);

    ch.onmessage = (e: MessageEvent<DisplayMessage>) => {
      setConnected(true);

      if (e.data.type === 'idle') {
        // idle is urgent — hide cart right away
        setState(null);
        setLastSku(null);
        return;
      }

      if (e.data.type === 'cart-update') {
        // lastScannedSku highlight is urgent (flash feedback) — set it immediately
        if (e.data.lastScannedSku) {
          setLastSku(e.data.lastScannedSku);
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => setLastSku(null), 2500);
        }
        // cart list update is non-urgent — defer so React can paint the highlight first
        startTransition(() => {
          setState(e.data as DisplayCartState);
        });
      }
    };

    return () => {
      ch.close();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const items = state?.items ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-bg-page-2" style={{ fontFamily: 'inherit' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-8 h-16 shrink-0" style={{ backgroundColor: NAVY }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center font-bold text-sm shrink-0"
            style={{ backgroundColor: YELLOW, color: NAVY }}
          >
            YSC
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">ยงเจริญ สเตชั่นเนอรี่</span>
        </div>
        {state?.customerName && (
          <div className="text-white/80 text-sm">
            ลูกค้า: <span className="text-white font-semibold">{state.customerName}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left — cart items */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">

          {/* Section label */}
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-text-secondary" />
            <span className="text-b3 text-text-secondary font-medium">รายการสินค้า</span>
            {items.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-navy text-white text-xs font-bold">
                {items.length}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted">
              {!connected ? (
                <>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-gray-300" />
                  </div>
                  <div className="text-b3">รอการเชื่อมต่อจากเคาน์เตอร์...</div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <div className="text-h5 text-text-secondary">ยินดีต้อนรับ</div>
                  <div className="text-b3">กรุณาแสดงสินค้าเพื่อเริ่มการสแกน</div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-2">
                {items.map((item, idx) => (
                  <CartItemRow
                    key={item.sku}
                    item={item}
                    index={idx}
                    isLast={item.sku === lastSku}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — totals panel */}
        <div className="w-[320px] shrink-0 flex flex-col p-6 border-l border-gray-200 bg-white">
          <div className="text-b3 text-text-secondary font-medium mb-6">สรุปยอด</div>

          <div className="flex flex-col gap-3 text-b3">
            <div className="flex justify-between">
              <span className="text-text-secondary">ราคาสินค้า</span>
              <span className="tabular-nums text-text-primary">{fmt(state?.subtotal ?? 0)}</span>
            </div>
            {(state?.discount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">ส่วนลด</span>
                <span className="tabular-nums text-status-danger">−{fmt(state!.discount)}</span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex items-end justify-between">
              <span className="text-b2 text-text-secondary">ยอดรวมทั้งสิ้น</span>
              <div className="text-right">
                <div className="text-h4 font-bold tabular-nums" style={{ color: NAVY }}>
                  {fmt(state?.grand ?? 0)}
                </div>
                <div className="text-c2 text-text-muted">รวม VAT 7%</div>
              </div>
            </div>
          </div>

          {/* YSC branding footer */}
          <div className="mt-8 text-center">
            <div className="text-c2 text-text-muted">ขอบคุณที่ใช้บริการ</div>
            <div className="text-c1 font-semibold mt-0.5" style={{ color: NAVY }}>
              ยงเจริญ สเตชั่นเนอรี่
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
