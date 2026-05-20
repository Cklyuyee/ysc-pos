import { useState, useRef, useEffect } from 'react';
import {
  X, Search, Trash2, FileText, FilePlus, Printer,
  CheckCircle2, User, Calendar, Hash, CalendarDays,
  AlertCircle, BadgeCheck, RefreshCcw, Info,
} from 'lucide-react';
import { searchProducts, ApiProduct } from '../../../services/productsApi';
import { ProductThumb } from '../../components/ui/ProductThumb';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  sku: string;
  name: string;
  orderedQty: number;     // qty from original order
  qty: number;            // qty to invoice (editable)
  unit: string;
  originalPrice: number;  // price at time of order (display only)
  currentPrice: number;   // latest price — used for invoice
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  customer: string;
  customerId: string;
  date: string;
  status: 'waiting' | 'partial' | 'invoiced' | 'cancelled';
  items: OrderItem[];
  createdBy: string;
  note?: string;
}

/** Mock current staff member creating invoices. In production this comes from auth context. */
const CURRENT_STAFF = 'wichai';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<PurchaseOrder['status'], string> = {
  waiting:  'รอสร้างใบแจ้งหนี้',
  partial:  'สร้างบางส่วนแล้ว',
  invoiced: 'สร้างครบแล้ว',
  cancelled: 'ยกเลิก',
};
const STATUS_COLOR: Record<PurchaseOrder['status'], string> = {
  waiting:  '#D97706',
  partial:  '#0EA5E9',
  invoiced: '#16A34A',
  cancelled: '#EF4444',
};
const STATUS_BG: Record<PurchaseOrder['status'], string> = {
  waiting:  '#FFFBEB',
  partial:  '#F0F9FF',
  invoiced: '#F0FDF4',
  cancelled: '#FEF2F2',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: PurchaseOrder[] = [
  {
    id: 'po1',
    orderNumber: 'PO-6804-00087',
    customer: 'บริษัท เทคสตาร์ จำกัด',
    customerId: 'C-0055',
    date: '2026-05-17',
    status: 'waiting',
    items: [
      { sku: 'PEN-001',    name: 'ปากกาลูกลื่น Pilot G2 สีน้ำเงิน',   orderedQty: 24, qty: 24, unit: 'ด้าม',   originalPrice: 33, currentPrice: 35 },
      { sku: 'PAP-A4-500', name: 'กระดาษ A4 Double A 80g (1 รีม)',     orderedQty: 10, qty: 10, unit: 'รีม',    originalPrice: 142, currentPrice: 145 },
      { sku: 'FILE-ARCH',  name: 'แฟ้มอาร์ช 2 นิ้ว สีดำ',               orderedQty: 20, qty: 20, unit: 'อัน',   originalPrice: 65, currentPrice: 65 },
    ],
    createdBy: 'somchai',
    note: 'ต้องการก่อนสิ้นเดือน',
  },
  {
    id: 'po2',
    orderNumber: 'PO-6804-00081',
    customer: 'มหาวิทยาลัยรังสิต',
    customerId: 'C-0120',
    date: '2026-05-15',
    status: 'partial',
    items: [
      { sku: 'NB-A5-LINE',    name: 'สมุดโน้ต A5 เส้นบรรทัด 80 แผ่น', orderedQty: 100, qty: 100, unit: 'เล่ม', originalPrice: 27, currentPrice: 28 },
      { sku: 'RULER-30',      name: 'ไม้บรรทัด 30 ซม. พลาสติก',        orderedQty: 50,  qty: 50,  unit: 'อัน',  originalPrice: 14, currentPrice: 15 },
      { sku: 'PENCIL-2B-12',  name: 'ดินสอ 2B (กล่อง 12 แท่ง)',         orderedQty: 40,  qty: 0,   unit: 'กล่อง', originalPrice: 45, currentPrice: 48 },
    ],
    createdBy: 'wanna',
    note: 'ดินสอยังไม่พร้อม รอส่วนที่เหลือ',
  },
  {
    id: 'po3',
    orderNumber: 'PO-6804-00074',
    customer: 'ร้านเครื่องเขียนดาวทอง',
    customerId: 'C-0031',
    date: '2026-05-12',
    status: 'invoiced',
    items: [
      { sku: 'STAMP-PAD-BK', name: 'แป้นประทับตรา Shiny สีดำ',         orderedQty: 5, qty: 5, unit: 'กล่อง', originalPrice: 95,  currentPrice: 95 },
      { sku: 'TAPE-OPP-1',   name: 'เทปใส OPP 1 นิ้ว x 50 หลา',       orderedQty: 12, qty: 12, unit: 'ม้วน', originalPrice: 22,  currentPrice: 22 },
    ],
    createdBy: 'napat',
  },
  {
    id: 'po4',
    orderNumber: 'PO-6804-00068',
    customer: 'คุณวิภาดา นาคสุข',
    customerId: 'C-0299',
    date: '2026-05-10',
    status: 'waiting',
    items: [
      { sku: 'INK-HP-BK',     name: 'หมึกพิมพ์ HP 680 สีดำ',            orderedQty: 5,  qty: 5,  unit: 'ตลับ',  originalPrice: 280, currentPrice: 285 },
      { sku: 'INK-HP-COL',    name: 'หมึกพิมพ์ HP 680 สีสี',             orderedQty: 3,  qty: 3,  unit: 'ตลับ',  originalPrice: 295, currentPrice: 310 },
      { sku: 'PAPER-PHOTO-A4',name: 'กระดาษโฟโต้ A4 (20 แผ่น)',          orderedQty: 4,  qty: 4,  unit: 'แพ็ค', originalPrice: 85,  currentPrice: 85 },
    ],
    createdBy: 'somchai',
  },
  {
    id: 'po5',
    orderNumber: 'PO-6804-00055',
    customer: 'บริษัท กรีนไลฟ์ จำกัด',
    customerId: 'C-0033',
    date: '2026-05-08',
    status: 'cancelled',
    items: [
      { sku: 'STAPLER-HD-50', name: 'เครื่องเย็บกระดาษ Max HD-50',      orderedQty: 5, qty: 5, unit: 'เครื่อง', originalPrice: 420, currentPrice: 435 },
    ],
    createdBy: 'wanna',
    note: 'ลูกค้าขอยกเลิกคำสั่งซื้อ',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (s: string) => {
  const [y, m, d] = s.split('-');
  const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${parseInt(d)} ${thMonths[parseInt(m) - 1]} ${parseInt(y) + 543}`;
};
const invoiceTotal = (items: OrderItem[]) => items.reduce((s, i) => s + i.qty * i.currentPrice, 0);
const fmtDateTime = (d: Date) => {
  const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const dd = d.getDate();
  const mm = thMonths[d.getMonth()];
  const yy = d.getFullYear() + 543;
  const hh = d.getHours().toString().padStart(2, '0');
  const mi = d.getMinutes().toString().padStart(2, '0');
  return `${dd} ${mm} ${yy} | ${hh}:${mi}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

type DialogView = 'search' | 'edit' | 'success';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateInvoiceDialog({ open, onClose }: Props) {
  const [view, setView]         = useState<DialogView>('search');
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  /** null = ยังไม่ได้กดค้นหา; array = กดแล้ว (อาจว่าง) */
  const [results, setResults]   = useState<PurchaseOrder[] | null>(null);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editNote, setEditNote] = useState('');
  const [addSku, setAddSku]     = useState('');
  const [addQty, setAddQty]     = useState(1);
  const [createdInvoiceNo, setCreatedInvoiceNo] = useState('');
  const [invoiceCreatedAt, setInvoiceCreatedAt] = useState<Date | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<PurchaseOrder | null>(null);
  const [suggestions, setSuggestions] = useState<ApiProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const searchRef   = useRef<HTMLInputElement>(null);
  const addSkuRef   = useRef<HTMLInputElement>(null);
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef   = useRef<HTMLInputElement>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open && view === 'search') setTimeout(() => searchRef.current?.focus(), 50);
  }, [open, view]);

  useEffect(() => {
    if (view === 'edit') setTimeout(() => addSkuRef.current?.focus(), 50);
  }, [view]);

  // debounced product search for edit-view dropdown
  useEffect(() => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    const q = addSku.trim();
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
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 250);
    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [addSku]);

  if (!open) return null;

  // ── handlers ──
  const handleSearch = () => {
    const cc = custCode.trim().toLowerCase();
    const cn = custName.trim().toLowerCase();
    const on = orderNumber.trim().toLowerCase();
    setResults(MOCK_ORDERS.filter(o => {
      const matchCc   = !cc || o.customerId.toLowerCase().includes(cc);
      const matchCn   = !cn || o.customer.toLowerCase().includes(cn);
      const matchOn   = !on || o.orderNumber.toLowerCase().includes(on);
      const matchFrom = !dateFrom || o.date >= dateFrom;
      const matchTo   = !dateTo   || o.date <= dateTo;
      return matchCc && matchCn && matchOn && matchFrom && matchTo;
    }));
  };
  const hasFilter = custCode || custName || orderNumber || dateFrom || dateTo;
  const handleReset = () => { setCustCode(''); setCustName(''); setOrderNumber(''); setDateFrom(''); setDateTo(''); setResults(null); };

  const openEdit = (order: PurchaseOrder) => {
    setSelected(order);
    setEditItems(order.items.map(i => ({ ...i })));
    setEditNote(order.note ?? '');
    setView('edit');
  };

  const removeItem = (sku: string) =>
    setEditItems(prev => prev.filter(i => i.sku !== sku));

  const handleAddSku = (e: React.FormEvent) => {
    e.preventDefault();
    const s = addSku.trim().toUpperCase();
    if (!s) return;
    if (editItems.some(i => i.sku === s)) {
      setEditItems(prev => prev.map(i => i.sku === s ? { ...i, qty: i.qty + addQty } : i));
    } else {
      setEditItems(prev => [...prev, {
        sku: s, name: `สินค้า ${s}`, orderedQty: 0, qty: addQty,
        unit: 'ชิ้น', originalPrice: 0, currentPrice: 0,
      }]);
    }
    setAddSku('');
    setAddQty(1);
    addSkuRef.current?.focus();
  };

  const handleSuggestionPick = (product: ApiProduct) => {
    setShowSuggestions(false);
    setSuggestions([]);
    const sku = product.sku;
    if (editItems.some(i => i.sku === sku)) {
      setEditItems(prev => prev.map(i => i.sku === sku ? { ...i, qty: i.qty + addQty } : i));
    } else {
      setEditItems(prev => [...prev, {
        sku,
        name: product.name,
        orderedQty: 0,
        qty: addQty,
        unit: product.unit,
        originalPrice: product.standardPrice,
        currentPrice: product.standardPrice,
      }]);
    }
    setAddSku('');
    setAddQty(1);
    addSkuRef.current?.focus();
  };

  const handleCreateInvoice = () => {
    const now = new Date();
    const inv = `INV-${(now.getFullYear() % 100).toString().padStart(2,'0')}${(now.getMonth()+1).toString().padStart(2,'0')}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    setCreatedInvoiceNo(inv);
    setInvoiceCreatedAt(now);
    setView('success');
  };

  const handlePrintInvoice = () => {
    // In production: open PDF / send to printer
    alert(`พิมพ์ใบแจ้งหนี้ ${createdInvoiceNo}`);
  };

  const handleClose = () => {
    setView('search');
    setCustCode('');
    setCustName('');
    setOrderNumber('');
    setDateFrom('');
    setDateTo('');
    setResults(null);
    setSelected(null);
    setCreatedInvoiceNo('');
    setInvoiceCreatedAt(null);
    onClose();
  };

  const activeItems = editItems.filter(i => i.qty > 0);
  const priceChanged = editItems.some(i => i.currentPrice !== i.originalPrice && i.qty > 0);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className={`relative bg-white rounded-[20px] shadow-2xl w-full mx-4 flex flex-col overflow-hidden ${view === 'success' ? 'max-w-[760px]' : 'max-w-[1280px]'}`} style={{ maxHeight: '92vh' }}>

        {/* ── Header ── (hidden on success — green hero takes its place) */}
        {view !== 'success' && (
          <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ backgroundColor: NAVY }}>
            <div className="flex items-center gap-3">
              <span className="text-h5 font-bold text-white">
                {view === 'search'  && 'สร้างใบแจ้งหนี้จากรับคำสั่งซื้อ'}
                {view === 'edit'    && `สร้างใบแจ้งหนี้ ${selected?.orderNumber}`}
              </span>
              {view === 'edit' && selected && (
                <span className="px-2.5 py-1 rounded-[8px] text-c2 font-bold"
                  style={{ backgroundColor: STATUS_BG[selected.status], color: STATUS_COLOR[selected.status] }}>
                  {STATUS_LABEL[selected.status]}
                </span>
              )}
            </div>
            <button type="button" onClick={handleClose}
              className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center transition">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* ══════════════ SEARCH VIEW ══════════════ */}
        {view === 'search' && (
          <>
            {/* Filter — 3-col grid, both rows share same column widths */}
            <div className="px-6 pt-5 pb-4 shrink-0">
              <div className="grid grid-cols-3 gap-x-3 gap-y-3">

                {/* Row 1 */}
                <div className="min-w-0">
                  <label className="text-c1 text-text-secondary mb-1.5 block">รหัสลูกค้า</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border border-gray-300 rounded-[10px] focus-within:border-sky-400 focus-within:border-2 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input ref={searchRef} type="text" value={custCode}
                      onChange={e => setCustCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="เช่น C-0042"
                      className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400 min-w-0" />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="text-c1 text-text-secondary mb-1.5 block">ชื่อลูกค้า</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border border-gray-300 rounded-[10px] focus-within:border-sky-400 focus-within:border-2 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input type="text" value={custName}
                      onChange={e => setCustName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="ชื่อลูกค้า"
                      className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400 min-w-0" />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="text-c1 text-text-secondary mb-1.5 block">เลขที่คำสั่งซื้อ</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border border-gray-300 rounded-[10px] focus-within:border-sky-400 focus-within:border-2 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input type="text" value={orderNumber}
                      onChange={e => setOrderNumber(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="เช่น PO-6804-00087"
                      className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400 min-w-0" />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="min-w-0">
                  <label className="text-c1 text-text-secondary mb-1.5 block">ตั้งแต่</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border border-gray-300 rounded-[10px] focus-within:border-sky-400 focus-within:border-2 transition cursor-pointer"
                    onClick={() => dateFromRef.current?.showPicker()}>
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <input ref={dateFromRef} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className={`flex-1 text-b3 outline-none bg-transparent min-w-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden ${!dateFrom ? 'text-gray-400' : 'text-text-primary'}`} />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="text-c1 text-text-secondary mb-1.5 block">ถึงวันที่</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border border-gray-300 rounded-[10px] focus-within:border-sky-400 focus-within:border-2 transition cursor-pointer"
                    onClick={() => dateToRef.current?.showPicker()}>
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <input ref={dateToRef} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className={`flex-1 text-b3 outline-none bg-transparent min-w-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden ${!dateTo ? 'text-gray-400' : 'text-text-primary'}`} />
                  </div>
                </div>
                {/* Row 2 col 3: buttons right-aligned */}
                <div className="flex items-end justify-end gap-3">
                  {hasFilter && (
                    <button type="button" onClick={handleReset}
                      className="h-11 px-3 text-c1 text-sky-500 hover:text-sky-700 hover:underline transition whitespace-nowrap">
                      ล้างการค้นหา
                    </button>
                  )}
                  <button type="button" onClick={handleSearch}
                    className="h-11 px-8 rounded-[10px] text-h5 font-bold transition hover:brightness-95 flex items-center gap-2 whitespace-nowrap"
                    style={{ backgroundColor: YELLOW, color: NAVY }}>
                    <Search className="w-4 h-4" />ค้นหา
                  </button>
                </div>

              </div>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-normal" style={{ color: '#6D717F', fontSize: '18px' }}>ผลการค้นหา</span>
                {results !== null && (
                  <span className="text-c1 text-text-muted">พบ {results.length} รายการ</span>
                )}
              </div>

              <div className="rounded-[14px] border border-gray-200 overflow-hidden">
                {/* Initial empty state */}
                {results === null && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 bg-gray-50">
                    <Search className="w-12 h-12 text-gray-300" />
                    <div className="text-b3 text-text-muted text-center">
                      กรุณาพิมพ์เลขที่คำสั่งซื้อ ชื่อลูกค้า หรือเลือกวันที่<br />เพื่อเริ่มการค้นหา
                    </div>
                  </div>
                )}

                {/* No results */}
                {results !== null && results.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 bg-gray-50">
                    <FilePlus className="w-12 h-12 text-gray-300" />
                    <div className="text-b3 text-text-muted">ไม่พบคำสั่งซื้อที่ตรงกัน</div>
                  </div>
                )}

                {/* Results table */}
                {results !== null && results.length > 0 && (
                  <table className="w-full text-c1">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">เลขที่คำสั่งซื้อ</th>
                        <th className="text-center px-3 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">วันที่สั่ง</th>
                        <th className="text-left px-3 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">รหัสลูกค้า</th>
                        <th className="text-left px-3 py-2.5 text-c1 text-text-secondary font-semibold">ชื่อลูกค้า</th>
                        <th className="text-right px-4 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">ยอดสั่ง</th>
                        <th className="text-center px-3 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">ผู้ทำรายการ</th>
                        <th className="text-center px-3 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">สถานะ</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((order, i) => {
                        const canCreate = order.status === 'waiting' || order.status === 'partial';
                        const total = order.items.reduce((s, item) => s + item.orderedQty * item.currentPrice, 0);
                        return (
                          <tr key={order.id}
                            className={`border-b border-gray-100 last:border-b-0 transition-colors ${canCreate ? 'hover:bg-sky-50 cursor-pointer' : 'opacity-60'} ${i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}
                            onClick={() => canCreate && setConfirmOrder(order)}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="font-mono font-bold text-text-primary whitespace-nowrap">{order.orderNumber}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center text-text-secondary whitespace-nowrap">
                              {fmtDate(order.date)}
                            </td>
                            <td className="px-3 py-3 text-text-secondary whitespace-nowrap">
                              {order.customerId}
                            </td>
                            <td className="px-3 py-3 text-text-primary">
                              {order.customer}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold tabular-nums whitespace-nowrap" style={{ color: NAVY }}>
                                ฿{fmt(total)}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-text-secondary">
                              {order.createdBy}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-[6px] font-semibold whitespace-nowrap"
                                style={{ backgroundColor: STATUS_BG[order.status], color: STATUS_COLOR[order.status] }}>
                                {STATUS_LABEL[order.status]}
                              </span>
                            </td>
                            <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-2 justify-end">
                                {canCreate && (
                                  <button type="button" title="ตรวจสอบและสร้างใบแจ้งหนี้" onClick={() => setConfirmOrder(order)}
                                    className="w-9 h-9 rounded-[8px] flex items-center justify-center border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-600 transition">
                                    <FilePlus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══════════════ EDIT / REVIEW VIEW ══════════════ */}
        {view === 'edit' && selected && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Info strip — single card, 4 equal columns */}
              <div className="rounded-[14px] border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-4 divide-x divide-gray-200">
                  {([
                    { icon: Hash,     label: 'เลขที่คำสั่งซื้อ',       value: selected.orderNumber, mono: true },
                    { icon: User,     label: 'ลูกค้า',                  value: selected.customer,    sub: selected.customerId },
                    { icon: Calendar, label: 'วันที่สั่งซื้อ',           value: fmtDate(selected.date) },
                    { icon: Calendar, label: 'วันที่สร้างใบแจ้งหนี้',    value: fmtDate(new Date().toISOString().split('T')[0]) },
                  ] as const).map(row => (
                    <div key={row.label} className="px-5 py-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <row.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-c1 text-text-muted">{row.label}</span>
                      </div>
                      <div className={`text-b3 font-semibold text-text-primary ${'mono' in row && row.mono ? 'font-mono' : ''}`}>
                        {row.value}
                      </div>
                      {'sub' in row && row.sub && (
                        <div className="text-c2 text-text-muted mt-0.5">{row.sub}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price changed notice */}
              {priceChanged && (
                <div className="rounded-[14px] bg-amber-50 border border-amber-100 px-5 py-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-b3 text-amber-800 leading-relaxed">
                    สินค้าบางรายการมีราคา <span className="font-bold">เปลี่ยนแปลง</span> จากวันที่สั่งซื้อ — ใบแจ้งหนี้จะใช้ <span className="font-bold">ราคาปัจจุบัน</span> ทุกกรณี
                  </div>
                </div>
              )}

              {/* PO note */}
              {selected.note && (
                <div className="rounded-[14px] bg-sky-50 border border-sky-100 px-5 py-4 flex items-start gap-3">
                  <Info className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-c1 text-sky-600 font-medium mb-1">หมายเหตุจากคำสั่งซื้อ</div>
                    <div className="text-b3 text-text-primary leading-relaxed">{selected.note}</div>
                  </div>
                </div>
              )}

              {/* Add item + table */}
              <div>
                <div className="text-s2 font-bold mb-3" style={{ color: NAVY }}>รายการสินค้า</div>

                {/* Add SKU — stepper + search (no submit button) */}
                <form onSubmit={handleAddSku} className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => setAddQty(q => Math.max(1, q - 1))}
                      className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-blue-100 border border-sky-200 text-sky-500 hover:brightness-95 transition text-h5 leading-none">
                      −
                    </button>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*" value={addQty}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        const v = raw ? parseInt(raw) : 1;
                        if (v >= 1 && v <= 9999) setAddQty(v);
                      }}
                      onFocus={e => e.target.select()}
                      className="w-12 h-11 rounded-[12px] bg-white border border-sky-200 text-center text-c1 !font-extrabold text-text-primary outline-none tabular-nums focus:border-sky-400"
                    />
                    <button type="button" onClick={() => setAddQty(q => q + 1)}
                      className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-blue-100 border border-sky-200 text-sky-500 hover:brightness-95 transition text-h5 leading-none">
                      +
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    <div className="flex items-center gap-2 h-11 px-4 bg-white border border-gray-300 rounded-[10px] focus-within:border-sky-400 focus-within:border-2 transition">
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                      <input ref={addSkuRef} type="text" value={addSku}
                        onChange={e => setAddSku(e.target.value)}
                        onFocus={() => addSku.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
                        placeholder="สแกนบาร์โค้ด หรือ ค้นหาด้วยชื่อสินค้า, SKU, รหัสบาร์โค้ด, แบรนด์"
                        className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400" />
                      {suggestLoading && (
                        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </div>
                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-[12px] shadow-[var(--shadow-elev)] max-h-[480px] overflow-y-auto">
                        <div className="px-5 py-3 bg-bg-page text-c1 text-text-secondary sticky top-0 z-10 border-b border-gray-100">
                          ผลการค้นหา ({suggestions.length})
                        </div>
                        {suggestions.map(p => {
                          const available = (p.stockOffline ?? 0) - (p.reservedOffline ?? 0);
                          const out = available <= 0;
                          return (
                            <button
                              key={p.sku}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => handleSuggestionPick(p)}
                              disabled={out}
                              className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition border-b border-gray-100 last:border-b-0 ${out ? 'opacity-60 cursor-not-allowed' : 'hover:bg-bg-page-2'}`}
                            >
                              <ProductThumb image={p.image} name={p.name} size={56} />
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
                                    {p.brand && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-c3 font-semibold">
                                        โปรแบรนด์ {p.brand}
                                      </span>
                                    )}
                                    {out && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-c3 font-bold">
                                        สินค้าหมด
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-s1 font-bold tabular-nums shrink-0" style={{ color: NAVY }}>
                                ฿{fmt(p.standardPrice)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </form>

                {/* Items table */}
                <div className="rounded-[14px] border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="text-left  px-3 py-3 text-s2 font-semibold text-text-secondary w-[140px] whitespace-nowrap">รหัสสินค้า</th>
                        <th className="text-left  px-3 py-3 text-s2 font-semibold text-text-secondary whitespace-nowrap">รายการสินค้า</th>
                        <th className="text-center px-3 py-3 text-s2 font-semibold text-text-secondary w-[100px] whitespace-nowrap">จำนวน</th>
                        <th className="text-right  px-3 py-3 text-s2 font-semibold text-text-secondary w-[130px] whitespace-nowrap">ราคา/หน่วย</th>
                        <th className="text-right  px-3 py-3 text-s2 font-semibold text-text-secondary w-[140px] whitespace-nowrap">รวม</th>
                        <th className="px-3 py-3 w-[70px]" />
                      </tr>
                    </thead>
                    <tbody>
                      {editItems.map(item => (
                        <tr key={item.sku} className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors ${item.qty === 0 ? 'opacity-50' : ''}`}>
                          <td className="px-3 py-3 align-middle text-c2 font-mono text-text-secondary">
                            {item.sku}
                          </td>
                          <td className="px-3 py-3 align-middle">
                            <div className="text-b4 text-text-primary leading-snug">{item.name}</div>
                          </td>
                          <td className="px-3 py-3 text-center align-middle">
                            <div className="text-s2 text-text-primary tabular-nums">{item.qty}</div>
                            <div className="text-c2 text-text-muted">/{item.unit}</div>
                          </td>
                          <td className="px-3 py-3 text-right align-middle">
                            <div className="text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                              {fmt(item.currentPrice)}
                            </div>
                            {item.currentPrice !== item.originalPrice && item.originalPrice > 0 && (
                              <div className="text-c3 text-text-muted line-through tabular-nums">
                                {fmt(item.originalPrice)}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right align-middle text-s2 font-bold tabular-nums"
                            style={{ color: item.qty > 0 ? NAVY : '#9CA3AF' }}>
                            {item.qty > 0 ? fmt(item.qty * item.currentPrice) : '—'}
                          </td>
                          <td className="px-3 py-3 align-middle">
                            <div className="flex items-center justify-center">
                              <button type="button" onClick={() => removeItem(item.sku)}
                                title="ลบรายการสินค้า"
                                className="w-10 h-10 rounded-[10px] bg-status-danger-bg text-status-danger hover:brightness-95 flex items-center justify-center transition">
                                <Trash2 className="w-5 h-5" strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {editItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-b3 text-text-muted">
                            ยังไม่มีรายการสินค้า
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {activeItems.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td colSpan={4} className="px-3 py-3.5 text-right text-b3 font-semibold text-text-secondary">
                            ยอดรวมใบแจ้งหนี้
                          </td>
                          <td className="px-3 py-3.5 text-right text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                            ฿{fmt(invoiceTotal(activeItems))}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-c1 text-text-secondary mb-1.5 block">หมายเหตุ</label>
                <textarea value={editNote} onChange={e => setEditNote(e.target.value)}
                  rows={2} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] text-b3 outline-none focus:border-sky-400 focus:border-2 transition resize-none" />
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
              <button type="button" onClick={() => setView('search')}
                className="h-12 px-6 rounded-[12px] border border-gray-300 bg-white text-s2 text-text-primary hover:bg-gray-50 transition">
                กลับ
              </button>
              <div className="flex-1" />
              <button type="button" onClick={handleCreateInvoice}
                disabled={activeItems.length === 0}
                className="h-12 px-8 rounded-[12px] text-s2 font-bold transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: YELLOW, color: NAVY }}>
                <CheckCircle2 className="w-4 h-4" />
                สร้างใบแจ้งหนี้
              </button>
            </div>
          </>
        )}

        {/* ══════════════ SUCCESS VIEW ══════════════ */}
        {view === 'success' && (
          <>
            {/* Green hero header — replaces navy header */}
            <div className="relative px-6 py-10 text-center shrink-0" style={{ backgroundColor: '#27AE60' }}>
              <button type="button" onClick={handleClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center transition">
                <X className="w-5 h-5 text-white" />
              </button>
              <BadgeCheck className="w-20 h-20 mx-auto mb-3 text-white" strokeWidth={1.8} />
              <div className="text-h1 font-bold text-white">สร้างใบแจ้งหนี้สำเร็จ!</div>
              <div className="text-b2 text-white/90 mt-1.5">ขอบคุณที่ใช้บริการ ยงเจริญ</div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Top meta: invoice number + datetime */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-c1 text-text-muted mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    เลขที่ใบแจ้งหนี้
                  </div>
                  <div className="text-s1 font-bold font-mono" style={{ color: NAVY }}>{createdInvoiceNo}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end text-c1 text-text-muted mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    วันและเวลา
                  </div>
                  <div className="text-s1 font-bold text-text-primary">
                    {invoiceCreatedAt ? fmtDateTime(invoiceCreatedAt) : ''}
                  </div>
                </div>
              </div>

              {/* Detail card */}
              <div className="rounded-[14px] border border-sky-100 bg-sky-50/60 overflow-hidden">
                <div className="px-5 py-3 text-s2 font-bold text-text-primary text-center border-b border-sky-100">
                  รายละเอียดใบแจ้งหนี้
                </div>
                <div className="px-5 py-4 space-y-2.5">
                  <div className="flex justify-between text-b3">
                    <span className="text-text-muted">ลูกค้า</span>
                    <span className="font-bold text-text-primary">{selected?.customer}</span>
                  </div>
                  <div className="flex justify-between text-b3">
                    <span className="text-text-muted">รหัสลูกค้า</span>
                    <span className="font-bold font-mono text-text-primary">{selected?.customerId}</span>
                  </div>
                  <div className="flex justify-between text-b3">
                    <span className="text-text-muted">จากคำสั่งซื้อ</span>
                    <span className="font-bold font-mono text-text-primary">{selected?.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-b3">
                    <span className="text-text-muted">จำนวนรายการ</span>
                    <span className="font-bold text-text-primary">{activeItems.length} รายการ</span>
                  </div>
                  <div className="flex justify-between text-b3">
                    <span className="text-text-muted">ผู้ทำรายการ</span>
                    <span className="font-bold text-text-primary">{CURRENT_STAFF}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-sky-100">
                    <span className="text-s2 font-bold text-text-primary">ยอดรวม</span>
                    <span className="text-h4 font-bold tabular-nums" style={{ color: NAVY }}>฿{fmt(invoiceTotal(activeItems))}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer — 3 buttons */}
            <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
              <button type="button"
                onClick={() => { setView('search'); setResults(null); setCustCode(''); setCustName(''); setOrderNumber(''); setDateFrom(''); setDateTo(''); setInvoiceCreatedAt(null); }}
                className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-s2 font-bold text-text-primary hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <RefreshCcw className="w-4 h-4" />
                สร้างใบใหม่
              </button>
              <button type="button" onClick={handlePrintInvoice}
                className="flex-1 h-12 rounded-[12px] text-s2 font-bold transition hover:brightness-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: YELLOW, color: NAVY }}>
                <Printer className="w-4 h-4" />
                พิมพ์
              </button>
              <button type="button" onClick={handleClose}
                className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-s2 font-bold text-text-primary hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                เสร็จสิ้น
              </button>
            </div>
          </>
        )}

      </div>

      {/* ── Confirmation popup before opening edit view ── */}
      {confirmOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmOrder(null)} />
          <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-[480px] mx-4 flex flex-col overflow-hidden">
            {/* Hero */}
            <div className="flex flex-col items-center text-center px-6 pt-10 pb-7 bg-gradient-to-b from-sky-50/60 to-white">
              <div className="w-20 h-20 flex items-center justify-center mb-5">
                <FileText className="w-16 h-16 text-sky-500" strokeWidth={1.8} />
              </div>
              <div className="text-h3 font-bold text-text-primary">ตรวจสอบและสร้าง</div>
              <div className="text-b3 text-text-secondary mt-2">
                คุณต้องการตรวจสอบและสร้างใบแจ้งหนี้ <span className="font-bold font-mono text-text-primary">{confirmOrder.orderNumber}</span>
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 bg-bg-page flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmOrder(null)}
                className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 font-bold text-text-primary hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => { const o = confirmOrder; setConfirmOrder(null); openEdit(o); }}
                className="flex-1 h-12 rounded-[12px] text-h5 font-bold text-white transition hover:brightness-95"
                style={{ backgroundColor: '#0EA5E9' }}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
