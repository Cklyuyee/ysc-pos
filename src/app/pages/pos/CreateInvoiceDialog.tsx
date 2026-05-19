import { useState, useRef, useEffect } from 'react';
import {
  X, FilePlus, Search, ChevronLeft, Trash2, Plus, Minus,
  FileText, CheckCircle2, Package, User, Calendar, Hash,
  AlertCircle, BadgeCheck, RefreshCcw, Info,
} from 'lucide-react';

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
  note?: string;
}

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

// ─── Component ────────────────────────────────────────────────────────────────

type DialogView = 'search' | 'edit' | 'success';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateInvoiceDialog({ open, onClose }: Props) {
  const [view, setView]         = useState<DialogView>('search');
  const [query, setQuery]       = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [results, setResults]   = useState<PurchaseOrder[]>(MOCK_ORDERS);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editNote, setEditNote] = useState('');
  const [addSku, setAddSku]     = useState('');
  const [createdInvoiceNo, setCreatedInvoiceNo] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const addSkuRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && view === 'search') setTimeout(() => searchRef.current?.focus(), 50);
  }, [open, view]);

  useEffect(() => {
    if (view === 'edit') setTimeout(() => addSkuRef.current?.focus(), 50);
  }, [view]);

  if (!open) return null;

  // ── handlers ──
  const handleSearch = () => {
    const q = query.trim().toLowerCase();
    setResults(MOCK_ORDERS.filter(o => {
      const matchQ    = !q || o.orderNumber.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
      const matchFrom = !dateFrom || o.date >= dateFrom;
      const matchTo   = !dateTo   || o.date <= dateTo;
      return matchQ && matchFrom && matchTo;
    }));
  };

  const openEdit = (order: PurchaseOrder) => {
    setSelected(order);
    setEditItems(order.items.map(i => ({ ...i })));
    setEditNote(order.note ?? '');
    setView('edit');
  };

  const changeQty = (sku: string, delta: number) =>
    setEditItems(prev => prev.map(i => i.sku === sku ? { ...i, qty: Math.max(0, i.qty + delta) } : i));

  const removeItem = (sku: string) =>
    setEditItems(prev => prev.filter(i => i.sku !== sku));

  const handleAddSku = (e: React.FormEvent) => {
    e.preventDefault();
    const s = addSku.trim().toUpperCase();
    if (!s) return;
    if (editItems.some(i => i.sku === s)) {
      changeQty(s, 1);
    } else {
      setEditItems(prev => [...prev, {
        sku: s, name: `สินค้า ${s}`, orderedQty: 0, qty: 1,
        unit: 'ชิ้น', originalPrice: 0, currentPrice: 0,
      }]);
    }
    setAddSku('');
  };

  const handleCreateInvoice = () => {
    const now = new Date();
    const inv = `INV-${(now.getFullYear() % 100).toString().padStart(2,'0')}${(now.getMonth()+1).toString().padStart(2,'0')}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    setCreatedInvoiceNo(inv);
    setView('success');
  };

  const handleClose = () => {
    setView('search');
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setResults(MOCK_ORDERS);
    setSelected(null);
    setCreatedInvoiceNo('');
    onClose();
  };

  const activeItems = editItems.filter(i => i.qty > 0);
  const priceChanged = editItems.some(i => i.currentPrice !== i.originalPrice && i.qty > 0);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-[960px] mx-4 flex flex-col overflow-hidden" style={{ maxHeight: '88vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center gap-3">
            {view === 'edit' && (
              <button type="button" onClick={() => setView('search')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition mr-1">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <FilePlus className="w-5 h-5 text-white/70" />
            <span className="text-s1 font-bold text-white">
              {view === 'search'  && 'สร้างใบแจ้งหนี้จากรับคำสั่งซื้อ'}
              {view === 'edit'    && `สร้างใบแจ้งหนี้ — ${selected?.orderNumber}`}
              {view === 'success' && 'สร้างใบแจ้งหนี้สำเร็จ'}
            </span>
            {view === 'edit' && selected && (
              <span className="px-2.5 py-1 rounded-[8px] text-c2 font-bold"
                style={{ backgroundColor: STATUS_BG[selected.status], color: STATUS_COLOR[selected.status] }}>
                {STATUS_LABEL[selected.status]}
              </span>
            )}
          </div>
          <button type="button" onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* ══════════════ SEARCH VIEW ══════════════ */}
        {view === 'search' && (
          <>
            {/* Filter bar */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-c1 text-text-secondary mb-1.5 block">ค้นหา</label>
                  <div className="flex items-center gap-2 h-11 px-4 bg-white border-2 border-gray-200 rounded-[10px] focus-within:border-sky-400 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input ref={searchRef} type="text" value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="เลขที่คำสั่งซื้อ หรือ ชื่อลูกค้า"
                      className="flex-1 text-b2 outline-none bg-transparent placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-c1 text-text-secondary mb-1.5 block">วันที่ (จาก)</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="h-11 px-3 border-2 border-gray-200 rounded-[10px] text-b2 outline-none focus:border-sky-400 transition bg-white" />
                </div>
                <div>
                  <label className="text-c1 text-text-secondary mb-1.5 block">ถึง</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="h-11 px-3 border-2 border-gray-200 rounded-[10px] text-b2 outline-none focus:border-sky-400 transition bg-white" />
                </div>
                <button type="button" onClick={handleSearch}
                  className="h-11 px-6 rounded-[10px] text-h5 font-bold transition hover:brightness-95 shrink-0"
                  style={{ backgroundColor: YELLOW, color: NAVY }}>
                  ค้นหา
                </button>
                {(query || dateFrom || dateTo) && (
                  <button type="button"
                    onClick={() => { setQuery(''); setDateFrom(''); setDateTo(''); setResults(MOCK_ORDERS); }}
                    className="h-11 px-4 rounded-[10px] border border-gray-300 text-c1 text-text-secondary hover:bg-gray-50 transition shrink-0">
                    ล้าง
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
                  <FilePlus className="w-12 h-12 text-gray-300" />
                  <div className="text-b2">ไม่พบคำสั่งซื้อที่ตรงกัน</div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                    <tr>
                      <th className="text-left px-5 py-3 text-c1 text-text-secondary font-semibold">เลขที่คำสั่งซื้อ</th>
                      <th className="text-left px-5 py-3 text-c1 text-text-secondary font-semibold">ชื่อลูกค้า</th>
                      <th className="text-center px-4 py-3 text-c1 text-text-secondary font-semibold">วันที่สั่ง</th>
                      <th className="text-center px-4 py-3 text-c1 text-text-secondary font-semibold">รายการ</th>
                      <th className="text-right px-5 py-3 text-c1 text-text-secondary font-semibold">ยอดสั่ง</th>
                      <th className="text-center px-4 py-3 text-c1 text-text-secondary font-semibold">สถานะ</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((order, i) => {
                      const canCreate = order.status === 'waiting' || order.status === 'partial';
                      const total = order.items.reduce((s, item) => s + item.orderedQty * item.currentPrice, 0);
                      return (
                        <tr key={order.id}
                          className={`border-b border-gray-100 last:border-b-0 transition-colors ${canCreate ? 'hover:bg-amber-50 cursor-pointer' : 'opacity-60'} ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                          onClick={() => canCreate && openEdit(order)}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-b2 font-mono font-bold text-text-primary">{order.orderNumber}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-b2 text-text-primary">{order.customer}</div>
                            <div className="text-c2 text-text-muted">{order.customerId}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center text-b3 text-text-secondary whitespace-nowrap">
                            {fmtDate(order.date)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-c2 text-text-secondary">
                              <Package className="w-3 h-3" />
                              {order.items.length} รายการ
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                              ฿{fmt(total)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-[8px] text-c2 font-bold whitespace-nowrap"
                              style={{ backgroundColor: STATUS_BG[order.status], color: STATUS_COLOR[order.status] }}>
                              {STATUS_LABEL[order.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                            {canCreate && (
                              <button type="button" onClick={() => openEdit(order)}
                                className="h-8 px-4 rounded-[8px] text-c2 font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 transition whitespace-nowrap">
                                สร้างใบแจ้งหนี้
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-c1 text-text-muted">พบ {results.length} รายการ</span>
              <button type="button" onClick={handleClose}
                className="h-10 px-5 rounded-[10px] border border-gray-300 text-c1 text-text-secondary hover:bg-gray-50 transition">
                ปิด (Esc)
              </button>
            </div>
          </>
        )}

        {/* ══════════════ EDIT / REVIEW VIEW ══════════════ */}
        {view === 'edit' && selected && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Order meta */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Hash,     label: 'เลขที่คำสั่งซื้อ',  value: selected.orderNumber },
                  { icon: User,     label: 'ลูกค้า',            value: `${selected.customer}` },
                  { icon: Calendar, label: 'วันที่สั่งซื้อ',      value: fmtDate(selected.date) },
                  { icon: Calendar, label: 'วันที่สร้างใบแจ้งหนี้', value: fmtDate(new Date().toISOString().split('T')[0]), color: '#0197FF' },
                ].map(row => (
                  <div key={row.label} className="rounded-[12px] bg-gray-50 border border-gray-200 px-4 py-3 flex items-start gap-3">
                    <row.icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-c2 text-text-muted">{row.label}</div>
                      <div className="text-b2 font-bold truncate" style={{ color: row.color ?? '#111827' }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price notice */}
              {priceChanged && (
                <div className="rounded-[12px] bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-c1 text-amber-800 leading-relaxed">
                    สินค้าบางรายการมีราคา <span className="font-bold">เปลี่ยนแปลง</span> จากวันที่สั่งซื้อ — ใบแจ้งหนี้จะใช้ <span className="font-bold">ราคาปัจจุบัน</span> ทุกกรณี
                  </p>
                </div>
              )}

              {/* Add item */}
              <div className="rounded-[14px] bg-sky-50 border border-sky-200 p-4">
                <div className="text-s2 font-bold text-sky-700 mb-3">เพิ่มสินค้า</div>
                <form onSubmit={handleAddSku} className="flex gap-3">
                  <div className="flex-1 flex items-center gap-2 h-11 px-4 bg-white border-2 border-sky-300 rounded-[10px] focus-within:border-sky-500 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input ref={addSkuRef} type="text" value={addSku}
                      onChange={e => setAddSku(e.target.value)}
                      placeholder="สแกน / พิมพ์ รหัสสินค้าที่ต้องการเพิ่ม"
                      className="flex-1 text-b2 outline-none bg-transparent placeholder:text-gray-400" />
                  </div>
                  <button type="submit"
                    className="h-11 px-5 rounded-[10px] text-s2 font-bold transition hover:brightness-95 flex items-center gap-1.5"
                    style={{ backgroundColor: NAVY, color: 'white' }}>
                    <Plus className="w-4 h-4" />เพิ่ม
                  </button>
                </form>
              </div>

              {/* Items table */}
              <div>
                <div className="text-s2 font-bold mb-3" style={{ color: NAVY }}>รายการสินค้า</div>
                <div className="rounded-[12px] border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-c1 text-text-secondary">รหัส / ชื่อสินค้า</th>
                        <th className="text-center px-4 py-3 text-c1 text-text-secondary">จำนวน (สั่ง)</th>
                        <th className="text-center px-4 py-3 text-c1 text-text-secondary">จำนวนที่ออกใบ</th>
                        <th className="text-right px-4 py-3 text-c1 text-text-secondary">ราคาปัจจุบัน</th>
                        <th className="text-right px-4 py-3 text-c1 text-text-secondary">รวม</th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {editItems.map(item => (
                        <tr key={item.sku} className={`border-b border-gray-100 last:border-b-0 ${item.qty === 0 ? 'opacity-40' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="text-b2 text-text-primary">{item.name}</div>
                            <div className="text-c2 text-text-muted font-mono">{item.sku}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-b3 text-text-muted tabular-nums">
                              {item.orderedQty > 0 ? `${item.orderedQty} ${item.unit}` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button type="button" onClick={() => changeQty(item.sku, -1)}
                                className="w-8 h-8 rounded-[8px] border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center transition">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-10 text-center text-b2 font-bold tabular-nums">{item.qty}</span>
                              <button type="button" onClick={() => changeQty(item.sku, 1)}
                                className="w-8 h-8 rounded-[8px] border border-sky-300 bg-sky-50 hover:bg-sky-100 flex items-center justify-center transition text-sky-600">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                              ฿{fmt(item.currentPrice)}
                            </div>
                            {item.currentPrice !== item.originalPrice && item.originalPrice > 0 && (
                              <div className="text-c3 text-text-muted line-through tabular-nums">
                                ฿{fmt(item.originalPrice)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-s2 font-bold tabular-nums"
                            style={{ color: item.qty > 0 ? NAVY : '#9CA3AF' }}>
                            {item.qty > 0 ? `฿${fmt(item.qty * item.currentPrice)}` : '—'}
                          </td>
                          <td className="px-3 py-3">
                            <button type="button" onClick={() => removeItem(item.sku)}
                              className="w-8 h-8 rounded-[8px] border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {editItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-b2 text-text-muted">
                            ยังไม่มีรายการสินค้า
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {activeItems.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td colSpan={4} className="px-4 py-3 text-right text-s2 font-bold text-text-primary">
                            ยอดรวมใบแจ้งหนี้
                          </td>
                          <td className="px-4 py-3 text-right text-h5 font-bold tabular-nums" style={{ color: NAVY }}>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-[12px] text-b2 outline-none focus:border-sky-400 transition resize-none" />
              </div>

              {/* Price info box */}
              <div className="rounded-[12px] bg-sky-50 border border-sky-200 px-4 py-3 flex items-start gap-3">
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <p className="text-c1 text-sky-700 leading-relaxed">
                  ราคาในใบแจ้งหนี้จะใช้ <span className="font-bold">ราคาปัจจุบัน ณ วันที่สร้าง</span> ทุกกรณี ไม่ใช่ราคาตอนรับคำสั่งซื้อ
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 items-center shrink-0">
              <button type="button" onClick={() => setView('search')}
                className="h-12 px-5 rounded-[12px] border border-gray-300 text-c1 text-text-secondary hover:bg-gray-50 transition flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                ยกเลิก
              </button>
              <div className="flex-1">
                {activeItems.length > 0 && (
                  <span className="text-c1 text-text-muted">
                    {activeItems.length} รายการ • ยอดรวม{' '}
                    <span className="font-bold" style={{ color: NAVY }}>฿{fmt(invoiceTotal(activeItems))}</span>
                  </span>
                )}
              </div>
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
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <BadgeCheck className="w-10 h-10 text-green-600" strokeWidth={1.8} />
            </div>

            <h2 className="text-h1 font-bold mb-2" style={{ color: NAVY }}>สร้างใบแจ้งหนี้สำเร็จ</h2>
            <p className="text-b2 text-text-secondary mb-8">ระบบสร้างใบแจ้งหนี้จากคำสั่งซื้อ {selected?.orderNumber} เรียบร้อยแล้ว</p>

            {/* Invoice detail box */}
            <div className="w-full max-w-[460px] rounded-[16px] bg-sky-50 border border-sky-200 p-5 text-left space-y-2.5 mb-8">
              <div className="flex justify-between text-b2">
                <span className="text-text-secondary">เลขที่ใบแจ้งหนี้</span>
                <span className="font-bold font-mono" style={{ color: NAVY }}>{createdInvoiceNo}</span>
              </div>
              <div className="flex justify-between text-b2">
                <span className="text-text-secondary">ลูกค้า</span>
                <span className="font-bold text-text-primary">{selected?.customer}</span>
              </div>
              <div className="flex justify-between text-b2">
                <span className="text-text-secondary">จำนวนรายการ</span>
                <span className="font-bold text-text-primary">{activeItems.length} รายการ</span>
              </div>
              <div className="border-t border-sky-200 pt-2.5 flex justify-between">
                <span className="text-s2 font-bold text-text-primary">ยอดรวม</span>
                <span className="text-h5 font-bold tabular-nums" style={{ color: NAVY }}>฿{fmt(invoiceTotal(activeItems))}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full max-w-[460px]">
              <button type="button" onClick={() => { setView('search'); setResults(MOCK_ORDERS); }}
                className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-c1 text-text-secondary hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <RefreshCcw className="w-4 h-4" />
                สร้างใบใหม่
              </button>
              <button type="button" onClick={handleClose}
                className="flex-1 h-12 rounded-[12px] text-s2 font-bold transition hover:brightness-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: YELLOW, color: NAVY }}>
                <CheckCircle2 className="w-4 h-4" />
                เสร็จสิ้น
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
