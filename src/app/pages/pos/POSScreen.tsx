import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Search, RefreshCw, XCircle, Ban, Pause, Inbox, Trash2,
  Truck, Store, Gift, Coins, CreditCard, Tag, Sparkles,
  ChevronRight, Plus, AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import {
  getActiveCart, createCart, addItem, setItemQty, removeItem,
  checkout, abandonCart,
  type PosCart, type PosCartItem,
} from '../../../services/cartApi';
import { searchProducts, getProductByBarcode, type ApiProduct } from '../../../services/productsApi';
import { CustomerSearchDialog } from './CustomerSearchDialog';
import { RegisterMemberDialog } from './RegisterMemberDialog';
import { PaymentDialog } from './PaymentDialog';
import { CancelBillDialog } from './CancelBillDialog';
import { HeldBillsDialog, type HeldBill } from './HeldBillsDialog';
import type { Customer } from '../../../data/customers';

const NAVY = '#14264E';
const NAVY_SOFT = '#1B3060';
const YELLOW = '#EFB419';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TIER_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'Gold 1':    { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200',  label: 'Gold Member' },
  'Gold 2':    { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200',  label: 'Gold Member' },
  'Platinum 1':{ bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200', label: 'Platinum Member' },
  'Platinum 2':{ bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200', label: 'Platinum Member' },
  'Diamond':   { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-200',    label: 'Diamond Member' },
  'Silver':    { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300',label: 'Silver Member' },
};

function FKey({
  hotkey, label, icon: Icon, count, onClick, iconOnly = false,
}: {
  hotkey?: string; label: string; icon: typeof Search;
  count?: number; onClick?: () => void; iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <button type="button" onClick={onClick}
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 transition"
        aria-label={label}>
        <Icon className="w-5 h-5 text-neutral-700" />
      </button>
    );
  }
  return (
    <button type="button" onClick={onClick}
      className="flex flex-col items-center justify-center min-w-[90px] h-12 px-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 transition">
      {hotkey && <span className="text-[10px] font-bold text-neutral-400 leading-none mb-0.5">{hotkey}</span>}
      <span className="flex items-center gap-1 text-[12px] font-semibold text-neutral-700 leading-none">
        <Icon className="w-3.5 h-3.5" />
        {label}
        {typeof count === 'number' && (
          <span className="text-[11px] font-bold text-amber-600">({count})</span>
        )}
      </span>
    </button>
  );
}

function WalkInCard({ onSearch, onRegister }: { onSearch: () => void; onRegister: () => void }) {
  return (
    <div className="rounded-2xl p-3 shadow-sm" style={{ backgroundColor: '#111827' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-neutral-700 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <div className="text-base font-bold text-white">Walk-in Customer</div>
          <div className="text-xs text-neutral-400">ไม่มีบันทึกการเป็นสมาชิก</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onSearch}
          className="flex items-center justify-center gap-1.5 h-9 rounded-xl font-bold text-xs border border-white/20 text-white hover:bg-white/10 transition">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          ค้นหาสมาชิก
        </button>
        <button onClick={onRegister}
          className="flex items-center justify-center gap-1.5 h-9 rounded-xl font-bold text-xs transition hover:opacity-90"
          style={{ backgroundColor: YELLOW, color: NAVY }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          สมัครสมาชิก
        </button>
      </div>
    </div>
  );
}

function CustomerCard({ customer, onClear }: { customer: Customer; onClear: () => void }) {
  const credit = customer.creditLimit ?? 0;
  const used = customer.creditUsed ?? 0;
  const remaining = credit - used;

  const tierBadge = TIER_MAP[customer.tier] ?? { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300', label: customer.tier };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-base shrink-0">
          {customer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-neutral-900 truncate">{customer.name}</div>
          <div className="text-xs text-neutral-500">ID: {customer.id}</div>
        </div>
        <button onClick={onClear} className="text-neutral-300 hover:text-neutral-500 transition" title="เปลี่ยนลูกค้า">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        <Badge bg={tierBadge.bg} text={tierBadge.text} border={tierBadge.border}>{tierBadge.label}</Badge>
        <Badge variant="neutral">Tier : {customer.priceTier}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[11px] text-neutral-500 mb-1">คะแนนสะสม</div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-neutral-900 tabular-nums">{(customer.rewardPoints ?? 0).toLocaleString()}</span>
            <span className="text-xs text-neutral-500">Point</span>
          </div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[11px] text-neutral-500 mb-1">วงเงินเครดิต</div>
          <div className="text-sm font-bold text-neutral-900 tabular-nums">
            {remaining >= 0 ? fmt(remaining).replace('.00', '') : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 truncate">ทั้งหมด {fmt(credit).replace('.00', '')}</div>
        </div>
      </div>
      <div className="flex items-center justify-end mt-2">
        <button className="text-[11px] text-sky-600 hover:underline inline-flex items-center gap-0.5">
          ข้อมูลเพิ่มเติม <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function SidebarSection({ icon: Icon, title, count, children }: {
  icon: typeof Sparkles; title: string; count?: number; children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5 text-white/90 text-sm font-semibold">
          <Icon className="w-4 h-4" />{title}
        </div>
        {typeof count === 'number' && <span className="text-[11px] text-white/60">{count} รายการ</span>}
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
  const [showRegister, setShowRegister] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [billSeq, setBillSeq] = useState(1);
  const [now, setNow] = useState(new Date());
  const [pendingQty, setPendingQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveCart();
        if (active && active.status === 'active') {
          setCartId(active.id);
          setCartItems(active.items);
        } else {
          const fresh = await createCart();
          setCartId(fresh.id);
          setCartItems([]);
        }
      } catch {
        // If API not available, proceed with null cartId
      }
    })();
  }, []);

  const applyCartResponse = (cart: PosCart) => {
    setCartId(cart.id);
    setCartItems(cart.items);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleAddBySku = async (sku: string, qty: number) => {
    if (!cartId) return;
    setApiLoading(true);
    try {
      const [products, updated] = await Promise.all([searchProducts(sku), addItem(cartId, sku, qty)]);
      const found = products.find(p => p.sku === sku || p.barcode === sku);
      if (found) setProductMap(prev => new Map(prev).set(found.sku, found));
      applyCartResponse(updated);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 409) showError('สต็อกสินค้าไม่เพียงพอ');
      else if (status === 404) showError('ไม่พบสินค้า');
      else showError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setApiLoading(false);
    }
  };

  const handleBarcodeSubmit = async () => {
    const q = barcodeInput.trim();
    if (!q || !cartId) return;
    setApiLoading(true);
    try {
      const byBarcode = await getProductByBarcode(q);
      let sku = q;
      if (byBarcode.length > 0) {
        const p = byBarcode[0];
        setProductMap(prev => new Map(prev).set(p.sku, p));
        sku = p.sku;
      } else {
        const bySearch = await searchProducts(q);
        const exact = bySearch.find(p => p.sku === q || p.barcode === q);
        if (exact) {
          setProductMap(prev => new Map(prev).set(exact.sku, exact));
          sku = exact.sku;
        } else {
          showError('ไม่พบสินค้า');
          return;
        }
      }
      const updated = await addItem(cartId, sku, pendingQty);
      applyCartResponse(updated);
      setBarcodeInput('');
      setPendingQty(1);
      qtyRef.current?.select();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 409) showError('สต็อกสินค้าไม่เพียงพอ');
      else showError('เกิดข้อผิดพลาด กรุณาลองใหม่');
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

  // F5 holdBill: stashes a snapshot locally; the active cart keeps living on the server
  const holdBill = () => {
    if (cartItems.length === 0 || !cartId) return;
    const displayItems = cartItems.map(item => {
      const p = productMap.get(item.sku);
      return {
        product: p
          ? {
              id: p.id, sku: p.sku, name: p.name, price: parseFloat(item.unitPrice),
              unit: p.unit, image: p.image ?? '', brand: p.brand ?? '',
              stock: p.stockOffline - p.reservedOffline, barcode: p.barcode,
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
    // Create new empty cart for next transaction
    createCart().then(fresh => {
      applyCartResponse(fresh);
      setCustomer(null);
      setBillSeq(n => n + 1);
    }).catch(() => {});
  };

  const restoreBill = (bill: HeldBill) => {
    // Simply switch UI view — the old cart stays on server with its own id
    // We need to hold current if there are items
    if (cartItems.length > 0) holdBill();
    setCustomer(bill.customer);
    setHeldBills(prev => prev.filter(b => b.id !== bill.id));
    // Note: bill.items are display-only; actual re-loading would require re-adding items
    // For now show the held items as-is (read-only display scenario)
  };

  const deleteHeldBill = (billId: string) => setHeldBills(prev => prev.filter(b => b.id !== billId));

  // Payment confirmation
  const handlePaymentConfirm = async (method: 'cash' | 'card' | 'credit' | 'qr') => {
    if (!cartId) return;
    const apiMethod = {
      cash: 'cash',
      card: 'credit-card',
      credit: 'credit-limit',
      qr: 'qr-code',
    }[method] as 'cash' | 'bank-transfer' | 'qr-code' | 'credit-card' | 'credit-limit';

    try {
      await checkout(cartId, apiMethod, customer?.id);
      const fresh = await createCart();
      applyCartResponse(fresh);
      setCustomer(null);
      setBillSeq(n => n + 1);
    } catch (err: unknown) {
      showError((err as Error).message ?? 'การชำระเงินล้มเหลว');
    }
  };

  // Totals
  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((s, i) => s + parseFloat(i.unitPrice) * i.qty, 0);
    return { subtotal, grand: subtotal, count: cartItems.length };
  }, [cartItems]);

  const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const billId = `#POS-${String(billSeq).padStart(3, '0')}`;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F4F5F7]">
      <CustomerSearchDialog open={showCustomerSearch} onClose={() => setShowCustomerSearch(false)}
        onRegister={() => { setShowCustomerSearch(false); setShowRegister(true); }}
        onSelect={c => { setCustomer(c); setShowCustomerSearch(false); }} />

      <RegisterMemberDialog open={showRegister} onClose={() => setShowRegister(false)}
        onRegistered={c => { setCustomer(c); setShowRegister(false); }} />

      <PaymentDialog open={showPayment} onClose={() => setShowPayment(false)} totalAmount={totals.grand} customer={customer}
        onConfirm={(method: 'cash' | 'card' | 'credit' | 'qr') => { setShowPayment(false); handlePaymentConfirm(method); }} />

      <CancelBillDialog open={showCancel} billId={billId} onClose={() => setShowCancel(false)}
        onConfirm={(_reason: string) => { setShowCancel(false); handleAbandonBill(); }} />

      <HeldBillsDialog open={showHeld} bills={heldBills} onClose={() => setShowHeld(false)}
        onRestore={restoreBill} onDelete={deleteHeldBill} />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 h-16 text-white shrink-0" style={{ backgroundColor: NAVY }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: YELLOW, color: NAVY }}>Y</div>
          <div className="leading-tight">
            <div className="text-base font-bold">POS System</div>
            <div className="text-[11px] text-white/60">ระบบหน้าขาย YSC • 10,000+ สินค้า</div>
          </div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-lg font-bold tabular-nums">{time}</div>
          <div className="text-[11px] text-white/60">{dateLabel}</div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* LEFT */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header + F-keys */}
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-neutral-100">
            <div>
              <div className="text-2xl font-bold text-neutral-900">{billId}</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {customer ? `${customer.name} • ${customer.priceTier}` : 'Walk-in Customer'}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <FKey hotkey="F1" label="ค้นหาสินค้า"   icon={Search}   onClick={async () => {
                const q = barcodeInput.trim();
                if (q) { await handleBarcodeSubmit(); }
              }} />
              <FKey hotkey="F2" label="เปลี่ยนลูกค้า"  icon={RefreshCw} onClick={() => setShowCustomerSearch(true)} />
              <FKey hotkey="F3" label="ยกเลิกรายการ"   icon={XCircle}  onClick={handleClearItems} />
              <FKey hotkey="F4" label="ยกเลิกบิล"      icon={Ban}      onClick={() => cartItems.length > 0 && setShowCancel(true)} />
              <FKey hotkey="F5" label="พักบิล"          icon={Pause}    onClick={holdBill} />
              <FKey label="ดึงบิล" icon={Inbox} count={heldBills.length} onClick={() => setShowHeld(true)} />
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 pt-4 pb-3 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-neutral-800">รายการสินค้า</div>
              <div className="text-[11px] text-neutral-400">กรอกจำนวน → สแกนบาร์โค้ด หรือพิมพ์ชื่อสินค้า → Enter</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border-2 border-amber-400 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                <button type="button" onClick={() => setPendingQty(q => Math.max(1, q - 1))}
                  className="w-9 h-10 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition text-lg font-bold">−</button>
                <input ref={qtyRef} type="number" min={1} max={9999} value={pendingQty}
                  onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setPendingQty(v); }}
                  onFocus={e => e.target.select()}
                  className="w-14 h-10 text-center text-lg font-extrabold text-neutral-900 outline-none tabular-nums bg-white border-x border-amber-200" />
                <button type="button" onClick={() => setPendingQty(q => q + 1)}
                  className="w-9 h-10 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition text-lg font-bold">+</button>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input ref={barcodeRef} value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleBarcodeSubmit(); }}
                  autoFocus
                  placeholder="สแกนบาร์โค้ด หรือพิมพ์ SKU แล้วกด Enter"
                  className="w-full h-12 pl-10 pr-4 border-2 border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:border-amber-400 transition" />
                {apiLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                )}
                {pendingQty !== 1 && !apiLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200">
                    ×{pendingQty}
                  </span>
                )}
              </div>
              <Button size="lg" className="h-12 px-6 font-bold hover:opacity-90 shrink-0"
                style={{ backgroundColor: YELLOW, color: NAVY }} onClick={() => handleAddBySku(barcodeInput.trim(), pendingQty)}>
                <Plus className="w-4 h-4" /> เพิ่มสินค้า
              </Button>
            </div>
            {errorMsg && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-50 text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 w-[130px]">รหัสสินค้า</th>
                  <th className="text-left px-3 py-2.5">รายการสินค้า</th>
                  <th className="text-center px-3 py-2.5 w-[140px]">จำนวน/สต็อก</th>
                  <th className="text-right px-3 py-2.5 w-[110px]">ราคา/หน่วย</th>
                  <th className="text-right px-3 py-2.5 w-[120px]">รวม</th>
                  <th className="text-center px-3 py-2.5 w-[90px]">วิธีรับสินค้า</th>
                  <th className="text-center px-3 py-2.5 w-[70px]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => {
                  const product = productMap.get(item.sku);
                  const price = parseFloat(item.unitPrice);
                  const total = price * item.qty;
                  const stock = product ? (product.stockOffline - product.reservedOffline) : 999;
                  return (
                    <tr key={item.sku} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition">
                      <td className="px-4 py-3 text-xs font-mono text-neutral-600">
                        <div className="truncate max-w-[110px]">{product?.barcode ?? item.sku}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-3">
                          {product?.image && (
                            <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-neutral-800 leading-snug">
                              {product?.name ?? item.sku}
                            </div>
                            {product?.brand && (
                              <div className="text-[11px] text-neutral-500 mt-0.5">{product.brand}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <QuantityStepper value={item.qty} onChange={q => handleQtyChange(item.sku, q)} min={1} max={stock} size="md" />
                        <div className="text-[11px] text-neutral-500 mt-1">สต็อก: {stock}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <div className="text-sm font-semibold text-neutral-800">{fmt(price)}</div>
                        <div className="text-[11px] text-neutral-500">/{product?.unit ?? 'ชิ้น'}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-bold text-neutral-900">{fmt(total)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button className="w-7 h-7 rounded-md border flex items-center justify-center transition bg-sky-50 text-sky-700 border-sky-200">
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 rounded-md border flex items-center justify-center transition bg-white text-neutral-400 border-neutral-200 hover:bg-neutral-50">
                            <Store className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => handleRemoveItem(item.sku)}
                          className="w-8 h-8 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center mx-auto transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {cartItems.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="text-7xl select-none">🛒</div>
                      <div className="text-xl font-bold text-neutral-300">ไม่มีสินค้าที่เลือก</div>
                      <div className="text-sm text-neutral-400">สแกนบาร์โค้ดหรือค้นหาสินค้า</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals footer */}
          <div className="border-t border-neutral-100 px-6 py-3 bg-white space-y-1">
            <div className="flex items-center justify-end gap-8 text-sm">
              <span className="text-neutral-500">ยอดรวม ({totals.count} รายการ)</span>
              <span className="tabular-nums font-semibold w-28 text-right">{fmt(totals.subtotal)}</span>
            </div>
          </div>

          {/* Grand total bar */}
          <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: NAVY }}>
            <div>
              <div className="text-xs text-white/60">ยอดชำระสุทธิ</div>
              <div className="text-sm text-white/80">(TOTAL)</div>
            </div>
            <div className="text-3xl font-extrabold tabular-nums" style={{ color: YELLOW }}>
              {fmt(totals.grand)}
            </div>
          </div>
        </main>

        {/* RIGHT sidebar */}
        <aside className="w-[380px] shrink-0 flex flex-col" style={{ backgroundColor: NAVY }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-0">
            <div className="text-xs text-white/60 font-medium mb-2">ข้อมูลลูกค้า</div>
            {customer ? (
              <CustomerCard customer={customer} onClear={() => setCustomer(null)} />
            ) : (
              <WalkInCard onSearch={() => setShowCustomerSearch(true)} onRegister={() => setShowRegister(true)} />
            )}

            {/* Credit warning */}
            {customer && (customer.creditLimit ?? 0) > 0 && totals.grand > 0 && (() => {
              const remaining = (customer.creditLimit ?? 0) - (customer.creditUsed ?? 0);
              if (remaining >= totals.grand) return null;
              return (
                <div className="mt-3 rounded-xl border px-4 py-3 flex items-start gap-2.5 bg-rose-950/40 border-rose-500/40">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <div className="text-xs font-bold text-rose-300">วงเงินเครดิตไม่เพียงพอ</div>
                    <div className="text-[11px] mt-0.5 text-rose-400">
                      คงเหลือ {fmt(remaining)} / ยอดบิล {fmt(totals.grand)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {!customer && (
              <SidebarSection icon={Sparkles} title="คำแนะนำการขายเพิ่มเติม">
                <div className="rounded-2xl bg-white p-3 space-y-2">
                  {[
                    { bg: 'bg-emerald-50', text: 'text-emerald-700', msg: 'สมัครสมาชิกวันนี้ รับส่วนลดทันที 5%' },
                    { bg: 'bg-sky-50',     text: 'text-sky-700',     msg: 'สมัครสมาชิกวันนี้ ซื้อครบ 500 บาท รับส่วนลด 50 บาท' },
                    { bg: 'bg-amber-50',   text: 'text-amber-700',   msg: 'สมัครสมาชิกเพื่อรับราคาพิเศษทันที' },
                    { bg: 'bg-pink-50',    text: 'text-pink-700',    msg: 'ทุก 1,500 บาท = 1 คะแนน → สมัครเพื่อเริ่มสะสม' },
                  ].map((tip, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded-xl ${tip.bg}`}>
                      <Tag className={`w-4 h-4 mt-0.5 shrink-0 ${tip.text}`} />
                      <span className={`text-xs font-medium leading-snug ${tip.text}`}>{tip.msg}</span>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {customer && (
              <SidebarSection icon={Coins} title="คูปองส่วนลด">
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-xs text-neutral-500">คูปองจะรองรับในเวอร์ชันถัดไป</div>
                </div>
              </SidebarSection>
            )}

            {customer && (
              <SidebarSection icon={Gift} title="ของรางวัลจากคำสั่งซื้อ">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center text-[11px] text-white/50">ยังไม่มีของรางวัล</div>
              </SidebarSection>
            )}
          </div>

          {/* Pay button */}
          <div className="p-4" style={{ backgroundColor: NAVY_SOFT }}>
            <Button size="lg" disabled={cartItems.length === 0} onClick={() => setShowPayment(true)}
              className="w-full h-12 font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1F4ED8' }}>
              <CreditCard className="w-4 h-4" /> F12 - ชำระเงิน — {fmt(totals.grand)}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
