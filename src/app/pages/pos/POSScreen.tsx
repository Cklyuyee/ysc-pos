import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, RefreshCw, XCircle, Ban, Pause, Inbox, Trash2,
  Truck, Store, Gift, Coins, CreditCard, Tag, Sparkles,
  ChevronRight, Plus, AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import {
  PRODUCT_DATABASE, type Product,
  getCustomerRecentPurchases, getCustomerFrequentPurchases,
} from '../../api/mock/products';
import { BILL_PROMOTIONS, getActiveBillPromotions, type BillPromotion } from '../../api/mock/promotions';
import { getActiveBrandPromotions, calculateBrandSpending } from '../../api/mock/brandPromotions';
import { ProductSearchDialog } from '../../components/product/ProductSearchDialog';
import {
  calculateCartWithPromotions, type CartItem as PromoCartItem,
} from '../../utils/promotionCalculator';
import { CustomersAPI, RewardsAPI, CouponsAPI } from '../../../services/mockApi';
import { CustomerSearchDialog } from './CustomerSearchDialog';
import { RegisterMemberDialog } from './RegisterMemberDialog';
import { PaymentDialog } from './PaymentDialog';
import { CancelBillDialog } from './CancelBillDialog';
import { HeldBillsDialog, type HeldBill } from './HeldBillsDialog';
import type { Customer } from '../../../data/customers';

const NAVY = '#14264E';
const NAVY_SOFT = '#1B3060';
const YELLOW = '#EFB419';

interface CartEntry {
  lineId: string;
  product: Product;
  qty: number;
  fulfillment: 'delivery' | 'pickup';
}

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getPrice(product: Product, tier: string = 'P5'): number {
  return (product.prices as Record<string, number>)?.[tier] ?? product.price;
}

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

  const tierBadge = {
    'Gold 1':    { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200',  label: 'Gold Member' },
    'Gold 2':    { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200',  label: 'Gold Member' },
    'Platinum 1':{ bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200', label: 'Platinum Member' },
    'Platinum 2':{ bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200', label: 'Platinum Member' },
    'Diamond':   { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-200',    label: 'Diamond Member' },
    'Silver':    { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300',label: 'Silver Member' },
  }[customer.tier] ?? { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300', label: customer.tier };

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
            <span className="text-lg font-bold text-neutral-900 tabular-nums">{customer.rewardPoints.toLocaleString()}</span>
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

export default function POSScreen() {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeBillPromos, setActiveBillPromos] = useState<BillPromotion[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [orderRewards, setOrderRewards] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
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
  const barcodeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getActiveBillPromotions().then(p => setActiveBillPromos(p)); }, []);

  useEffect(() => {
    if (!customer) return;
    getCustomerRecentPurchases(customer.id).then(p => setRecentProducts(p));
    getCustomerFrequentPurchases(customer.id).then(p => setFrequentProducts(p));
  }, [customer?.id]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const promoCart = useMemo(() =>
    cart.map(e => ({ product: { ...e.product, price: getPrice(e.product, customer?.priceTier) }, qty: e.qty })),
    [cart, customer?.priceTier]);

  const promoResult = useMemo(
    () => calculateCartWithPromotions(promoCart, BILL_PROMOTIONS, customer?.tier),
    [promoCart, customer?.tier]);

  const brandSpending = useMemo(() => calculateBrandSpending(promoCart), [promoCart]);
  const activeBrandPromos = useMemo(() => getActiveBrandPromotions(), []);
  const earnedBrandPromos = useMemo(
    () => activeBrandPromos.filter(bp => (brandSpending.get(bp.brandName) ?? 0) >= bp.threshold),
    [activeBrandPromos, brandSpending]);

  const salesRecs = useMemo(() =>
    activeBrandPromos.map(bp => {
      const spent = brandSpending.get(bp.brandName) ?? 0;
      const earned = spent >= bp.threshold;
      return {
        id: bp.id, label: bp.description, achieved: earned,
        highlight: !earned && spent / bp.threshold >= 0.6,
        sub: earned ? undefined : `ซื้อเพิ่มอีก ${fmt(bp.threshold - spent).replace('.00', '')} เพื่อรับรางวัล`,
      };
    }), [activeBrandPromos, brandSpending]);

  const totals = useMemo(() => {
    const subtotal = promoResult.subtotal;
    const promoDiscount = promoResult.totalDiscount;
    const billDiscount = promoResult.billDiscount + couponDiscount;
    const grand = Math.max(0, subtotal - promoDiscount - billDiscount);
    return { subtotal, promoDiscount, billDiscount, grand, count: cart.length };
  }, [promoResult, couponDiscount, cart.length]);

  useEffect(() => {
    if (totals.grand > 0) RewardsAPI.getByOrderTotal(totals.grand).then(r => setOrderRewards(r as any));
    else setOrderRewards([]);
  }, [totals.grand]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await CouponsAPI.validate(couponCode.trim(), totals.grand);
    if (res.valid) { setCouponDiscount(res.discount ?? 0); setCouponMsg(`✓ ${res.message}`); }
    else { setCouponDiscount(0); setCouponMsg(`✗ ${res.message}`); }
  };

  const addProduct = (product: Product, qty: number = 1) => {
    setCart(c => {
      const existing = c.find(e => e.product.id === product.id);
      if (existing) return c.map(e => e.product.id === product.id ? { ...e, qty: Math.min(e.qty + qty, product.stock) } : e);
      return [...c, { lineId: `L${Date.now()}`, product, qty: Math.min(qty, product.stock), fulfillment: 'delivery' }];
    });
  };

  const addProductFromDialog = (product: Product, qty: number = 1) => {
    addProduct(product, qty);
    setPendingQty(1);
    setBarcodeInput('');
    setTimeout(() => barcodeRef.current?.focus(), 100);
  };

  const updateQty = (lineId: string, qty: number) =>
    setCart(c => c.map(e => e.lineId === lineId ? { ...e, qty } : e));

  const removeLine = (lineId: string) => setCart(c => c.filter(e => e.lineId !== lineId));

  const resetBill = () => {
    setCart([]); setCustomer(null);
    setCouponCode(''); setCouponDiscount(0); setCouponMsg('');
  };

  const holdBill = () => {
    if (cart.length === 0) return;
    const held: HeldBill = {
      id: `#POS-${String(billSeq).padStart(3, '0')}`,
      heldAt: new Date(), customer,
      items: cart.map(e => ({ product: e.product, qty: e.qty, fulfillment: e.fulfillment })),
      total: totals.grand,
    };
    setHeldBills(prev => [held, ...prev]);
    resetBill();
    setBillSeq(n => n + 1);
  };

  const restoreBill = (bill: HeldBill) => {
    if (cart.length > 0) holdBill();
    setCart(bill.items.map((item, i) => ({
      lineId: `L${Date.now()}_${i}`, product: item.product,
      qty: item.qty, fulfillment: item.fulfillment,
    })));
    setCustomer(bill.customer);
    setHeldBills(prev => prev.filter(b => b.id !== bill.id));
  };

  const deleteHeldBill = (billId: string) => setHeldBills(prev => prev.filter(b => b.id !== billId));

  const handleBarcodeSubmit = () => {
    const q = barcodeInput.trim();
    if (!q) { setShowSearch(true); return; }
    const found = PRODUCT_DATABASE.find(
      p => p.barcode === q || p.sku === q || p.name.toLowerCase().includes(q.toLowerCase()));
    if (found) {
      addProduct(found, pendingQty);
      setBarcodeInput(''); setPendingQty(1);
      qtyRef.current?.select();
    } else {
      setShowSearch(true); setBarcodeInput('');
    }
  };

  const toggleFulfillment = (lineId: string) =>
    setCart(c => c.map(e => e.lineId === lineId
      ? { ...e, fulfillment: e.fulfillment === 'delivery' ? 'pickup' : 'delivery' } : e));

  const displayRows = useMemo(() => {
    type Row =
      | { kind: 'item'; entry: CartEntry; promoItem: PromoCartItem }
      | { kind: 'free'; parentLineId: string; freeItem: NonNullable<PromoCartItem['freeItems']>[number] };
    const rows: Row[] = [];
    cart.forEach((entry, idx) => {
      const promoItem = promoResult.cartItems[idx];
      if (!promoItem) return;
      rows.push({ kind: 'item', entry, promoItem });
      promoItem.freeItems?.forEach(fi => rows.push({ kind: 'free', parentLineId: entry.lineId, freeItem: fi }));
    });
    return rows;
  }, [cart, promoResult]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof displayRows>();
    displayRows.forEach(row => {
      const brand = row.kind === 'item' ? row.entry.product.brand : '(ของแถม)';
      const arr = map.get(brand) ?? [];
      arr.push(row);
      map.set(brand, arr);
    });
    return Array.from(map.entries());
  }, [displayRows]);

  const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const billId = `#POS-${String(billSeq).padStart(3, '0')}`;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F4F5F7]">
      <CustomerSearchDialog open={showCustomerSearch} onClose={() => setShowCustomerSearch(false)}
        onRegister={() => { setShowCustomerSearch(false); setShowRegister(true); }}
        onSelect={c => {
          setCustomer(c);
          getCustomerRecentPurchases(c.id).then(p => setRecentProducts(p));
          getCustomerFrequentPurchases(c.id).then(p => setFrequentProducts(p));
        }} />

      <RegisterMemberDialog open={showRegister} onClose={() => setShowRegister(false)}
        onRegistered={c => { setCustomer(c); setShowRegister(false); }} />

      <PaymentDialog open={showPayment} onClose={() => setShowPayment(false)} totalAmount={totals.grand} customer={customer}
        onConfirm={() => { resetBill(); setBillSeq(n => n + 1); }} />

      <CancelBillDialog open={showCancel} billId={billId} onClose={() => setShowCancel(false)}
        onConfirm={() => { resetBill(); setBillSeq(n => n + 1); }} />

      <HeldBillsDialog open={showHeld} bills={heldBills} onClose={() => setShowHeld(false)}
        onRestore={restoreBill} onDelete={deleteHeldBill} />

      <ProductSearchDialog open={showSearch} onClose={() => setShowSearch(false)}
        onSelectProduct={addProductFromDialog} customerRecentProducts={recentProducts}
        customerFrequentProducts={frequentProducts} activePromotions={activeBillPromos}
        priceTier={customer?.priceTier ?? 'P5'} />

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
                {customer ? `${customer.name} • ${customer.priceTier}` : 'กำลังโหลด...'}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <FKey hotkey="F1" label="ค้นหาสินค้า"    icon={Search}   onClick={() => setShowSearch(true)} />
              <FKey hotkey="F2" label="เปลี่ยนลูกค้า"  icon={RefreshCw} onClick={() => setShowCustomerSearch(true)} />
              <FKey hotkey="F3" label="ยกเลิกรายการ"   icon={XCircle}  onClick={() => setCart([])} />
              <FKey hotkey="F4" label="ยกเลิกบิล"      icon={Ban}      onClick={() => cart.length > 0 && setShowCancel(true)} />
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
                  placeholder="สแกนบาร์โค้ด หรือพิมพ์ชื่อสินค้า / SKU แล้วกด Enter"
                  className="w-full h-12 pl-10 pr-4 border-2 border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:border-amber-400 transition" />
                {pendingQty !== 1 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200">
                    ×{pendingQty}
                  </span>
                )}
              </div>
              <Button size="lg" className="h-12 px-6 font-bold hover:opacity-90 shrink-0"
                style={{ backgroundColor: YELLOW, color: NAVY }} onClick={() => setShowSearch(true)}>
                <Plus className="w-4 h-4" /> ค้นหาเพิ่มเติม
              </Button>
            </div>
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
                  <th className="text-right px-3 py-2.5 w-[100px]">ส่วนลด</th>
                  <th className="text-right px-3 py-2.5 w-[120px]">รวม</th>
                  <th className="text-center px-3 py-2.5 w-[90px]">วิธีรับสินค้า</th>
                  <th className="text-center px-3 py-2.5 w-[70px]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(([brand, rows]) => (
                  <BrandGroup key={brand} brand={brand} rows={rows}
                    priceTier={customer?.priceTier ?? 'P5'} earnedBrandPromos={earnedBrandPromos}
                    onQty={updateQty} onRemove={removeLine} onToggleFulfillment={toggleFulfillment} />
                ))}
                {cart.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="text-7xl select-none">🛒</div>
                      <div className="text-xl font-bold text-neutral-300">ไม่มีสินค้าที่เลือก</div>
                      <div className="text-sm text-neutral-400">สแกนบาร์โค้ดหรือค้นหาสินค้า</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
            {promoResult.billGifts.length > 0 && (
              <div className="mx-4 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">ของแถมจากยอดซื้อ</span>
                </div>
                {promoResult.billGifts.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-emerald-800">
                    <span>{g.name} ({g.unit}) × {g.qty}</span>
                    <Badge variant="success">ฟรี</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals footer */}
          <div className="border-t border-neutral-100 px-6 py-3 bg-white space-y-1">
            <div className="flex items-center justify-end gap-8 text-sm">
              <span className="text-neutral-500">ยอดรวม ({totals.count} รายการ)</span>
              <span className="tabular-nums font-semibold w-28 text-right">{fmt(totals.subtotal)}</span>
            </div>
            {totals.promoDiscount > 0 && (
              <div className="flex items-center justify-end gap-8 text-sm">
                <span className="text-neutral-500">ส่วนลดโปรโมชั่น</span>
                <span className="tabular-nums text-rose-600 font-semibold w-28 text-right">-{fmt(totals.promoDiscount)}</span>
              </div>
            )}
            {totals.billDiscount > 0 && (
              <div className="flex items-center justify-end gap-8 text-sm">
                <span className="text-neutral-500">ส่วนลดท้ายบิล</span>
                <span className="tabular-nums text-rose-600 font-semibold w-28 text-right">-{fmt(totals.billDiscount)}</span>
              </div>
            )}
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
            {customer && customer.creditLimit > 0 && totals.grand > 0 && (() => {
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

            {customer && salesRecs.length > 0 && (
              <SidebarSection icon={Sparkles} title="คำแนะนำการขายเพิ่มเติม">
                <div className="rounded-2xl bg-white p-3 space-y-2">
                  {salesRecs.map(r => (
                    <div key={r.id} className={`flex items-start gap-2 p-2 rounded-lg ${r.highlight ? 'bg-amber-50 border border-amber-200' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0 ${r.achieved ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
                        {r.achieved ? '✓' : '!'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-neutral-800 leading-snug">{r.label}</div>
                        {r.sub && <div className="text-[11px] text-neutral-500 mt-0.5">{r.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {customer && (
              <SidebarSection icon={Tag} title="โปรแบรนด์ที่ได้รับ" count={earnedBrandPromos.length}>
                {earnedBrandPromos.length > 0 ? (
                  <div className="space-y-2">
                    {earnedBrandPromos.map(bp => (
                      <div key={bp.id} className="rounded-2xl bg-white p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-xs shrink-0">
                          {bp.brandName.slice(0, 4)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-neutral-800">{bp.brandName}</div>
                          <div className="text-[11px] text-neutral-500 leading-snug">{bp.description}</div>
                        </div>
                        {bp.reward.giftItem && <Badge variant="success" className="shrink-0">ฟรี</Badge>}
                        {bp.reward.discountPercent && <Badge variant="warning" className="shrink-0">-{bp.reward.discountPercent}%</Badge>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center text-[11px] text-white/50">ยังไม่ถึงเกณฑ์โปรแบรนด์</div>
                )}
              </SidebarSection>
            )}

            {customer && (
              <SidebarSection icon={Coins} title="คูปองส่วนลด">
                <div className="rounded-2xl bg-white p-3">
                  <div className="flex items-center gap-2">
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                      placeholder="กรอกรหัสคูปอง..."
                      className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 h-9 outline-none focus:ring-2 focus:ring-amber-300/40" />
                    <Button size="sm" onClick={validateCoupon} className="font-bold hover:opacity-90" style={{ backgroundColor: YELLOW, color: NAVY }}>
                      ใช้
                    </Button>
                  </div>
                  {couponMsg && (
                    <div className={`text-xs mt-2 ${couponMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{couponMsg}</div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-neutral-600">ส่วนลดคูปอง</span>
                      <span className="text-sm font-bold text-emerald-600">-{fmt(couponDiscount)}</span>
                    </div>
                  )}
                </div>
              </SidebarSection>
            )}

            {customer && (
              <SidebarSection icon={Gift} title="ของรางวัลจากคำสั่งซื้อ" count={orderRewards.length}>
                {orderRewards.length > 0 ? (
                  <div className="space-y-2">
                    {orderRewards.map((r: any, i: number) => (
                      <div key={i} className="rounded-2xl bg-white p-3 flex items-center justify-between">
                        <div className="text-xs font-semibold text-neutral-800">{r.name ?? r.reward_name ?? 'ของรางวัล'}</div>
                        <Badge variant="success">รับได้</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center text-[11px] text-white/50">ยังไม่มีของรางวัล</div>
                )}
              </SidebarSection>
            )}
          </div>

          {/* Pay button */}
          <div className="p-4" style={{ backgroundColor: NAVY_SOFT }}>
            <Button size="lg" disabled={cart.length === 0} onClick={() => setShowPayment(true)}
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

// ─── Brand group ──────────────────────────────────────────────────────────────
type DisplayRow =
  | { kind: 'item'; entry: CartEntry; promoItem: PromoCartItem }
  | { kind: 'free'; parentLineId: string; freeItem: NonNullable<PromoCartItem['freeItems']>[number] };

function BrandGroup({ brand, rows, priceTier, earnedBrandPromos, onQty, onRemove, onToggleFulfillment }: {
  brand: string; rows: DisplayRow[]; priceTier: string;
  earnedBrandPromos: ReturnType<typeof getActiveBrandPromotions>;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onToggleFulfillment: (id: string) => void;
}) {
  const brandPromo = earnedBrandPromos.find(bp => bp.brandName === brand);
  return (
    <>
      <tr className="bg-sky-50/70">
        <td colSpan={8} className="px-4 py-2 text-xs font-semibold text-sky-800">
          <span className="inline-block w-1.5 h-3 bg-sky-500 rounded-sm mr-2 align-middle" />
          แบรนด์ : {brand}
          {brandPromo && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">✓ ได้รับโปรแบรนด์</span>}
        </td>
      </tr>
      {rows.map((row, i) =>
        row.kind === 'item' ? (
          <ItemRow key={row.entry.lineId} entry={row.entry} promoItem={row.promoItem}
            priceTier={priceTier} onQty={onQty} onRemove={onRemove} onToggleFulfillment={onToggleFulfillment} />
        ) : (
          <FreeRow key={`${row.parentLineId}-free-${i}`} freeItem={row.freeItem} />
        )
      )}
      {brandPromo && (
        <tr className="bg-amber-50">
          <td colSpan={8} className="px-4 py-2.5 text-xs text-amber-900">
            <span className="font-bold mr-1">โปรแบรนด์ {brandPromo.brandName}:</span>{brandPromo.description}
          </td>
        </tr>
      )}
    </>
  );
}

function ItemRow({ entry, promoItem, priceTier, onQty, onRemove, onToggleFulfillment }: {
  entry: CartEntry; promoItem: PromoCartItem; priceTier: string;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onToggleFulfillment: (id: string) => void;
}) {
  const price = getPrice(entry.product, priceTier);
  const discount = promoItem.discount;
  const total = price * entry.qty - discount;
  const promoTag = entry.product.promo ? { label: entry.product.promo.desc } : null;

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50/50 transition">
      <td className="px-4 py-3 text-xs font-mono text-neutral-600">
        <div className="truncate max-w-[110px]">{entry.product.barcode ?? entry.product.sku}</div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-start gap-3">
          <img src={entry.product.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-800 leading-snug">{entry.product.name}</div>
            {promoTag && <div className="mt-1"><Badge variant="success" className="!py-0.5">{promoTag.label}</Badge></div>}
            {promoItem.upsellMsg && <div className="text-[11px] text-amber-600 mt-1">{promoItem.upsellMsg}</div>}
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <QuantityStepper value={entry.qty} onChange={q => onQty(entry.lineId, q)} min={1} max={entry.product.stock} size="md" />
        <div className="text-[11px] text-neutral-500 mt-1">สต็อก: {entry.product.stock}</div>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        <div className="text-sm font-semibold text-neutral-800">{fmt(price)}</div>
        <div className="text-[11px] text-neutral-500">/{entry.product.unit}</div>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        {discount > 0
          ? <span className="text-rose-600 font-semibold text-sm">-{fmt(discount)}</span>
          : <span className="text-neutral-400 text-sm">{fmt(0)}</span>}
      </td>
      <td className="px-3 py-3 text-right tabular-nums font-bold text-neutral-900">{fmt(Math.max(0, total))}</td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => onToggleFulfillment(entry.lineId)}
            className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${entry.fulfillment === 'delivery' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-white text-neutral-400 border-neutral-200 hover:bg-neutral-50'}`}>
            <Truck className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onToggleFulfillment(entry.lineId)}
            className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${entry.fulfillment === 'pickup' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-white text-neutral-400 border-neutral-200 hover:bg-neutral-50'}`}>
            <Store className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <button onClick={() => onRemove(entry.lineId)}
          className="w-8 h-8 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center mx-auto transition">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function FreeRow({ freeItem }: { freeItem: NonNullable<PromoCartItem['freeItems']>[number] }) {
  return (
    <tr className="border-b border-neutral-100 bg-emerald-50/40">
      <td className="px-4 py-2.5 text-xs"><Badge variant="success" className="!py-0.5">ของแถม</Badge></td>
      <td className="px-3 py-2.5 text-sm text-neutral-700 font-medium" colSpan={3}>
        {freeItem.name}<span className="ml-2 text-neutral-500 text-xs">× {freeItem.qty} {freeItem.unit}</span>
      </td>
      <td className="px-3 py-2.5" />
      <td className="px-3 py-2.5 text-right text-sm font-bold text-emerald-600">ฟรี</td>
      <td colSpan={2} />
    </tr>
  );
}
