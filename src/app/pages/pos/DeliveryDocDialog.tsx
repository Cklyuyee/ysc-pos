import { useState, useRef, useEffect } from 'react';
import {
  X, FileSearch, Search, Printer, Pencil,
  Trash2, FileText, CheckCircle2,
  User, Calendar, Hash, MapPin, CalendarDays,
} from 'lucide-react';
import { searchProducts, ApiProduct } from '../../../services/productsApi';
import { ProductThumb } from '../../components/ui/ProductThumb';
import { SupervisorAuthDialog } from './SupervisorAuthDialog';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

// ─── Mock data ───────────────────────────────────────────────────────────────

interface DocItem {
  sku: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

interface DeliveryDoc {
  id: string;
  docNumber: string;
  customer: string;
  customerId: string;
  date: string;       // YYYY-MM-DD
  address: string;
  items: DocItem[];
  createdBy: string;
  note?: string;
}

const MOCK_DOCS: DeliveryDoc[] = [
  {
    id: 'd1',
    docNumber: 'DLV-6804-00123',
    customer: 'บริษัท เอบีซี จำกัด',
    customerId: 'C-0042',
    date: '2026-05-19',
    address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    items: [
      { sku: 'PEN-001', name: 'ปากกาลูกลื่น Pilot G2 สีน้ำเงิน', qty: 12, unit: 'ด้าม', unitPrice: 35 },
      { sku: 'PAP-A4-500', name: 'กระดาษ A4 Double A 80g (1 รีม)', qty: 5, unit: 'รีม', unitPrice: 145 },
      { sku: 'FILE-ARCH', name: 'แฟ้มอาร์ช 2 นิ้ว สีดำ', qty: 10, unit: 'อัน', unitPrice: 65 },
    ],
    createdBy: 'somchai',
    note: 'จัดส่งก่อนเที่ยง',
  },
  {
    id: 'd2',
    docNumber: 'DLV-6804-00119',
    customer: 'โรงเรียนสาธิตกรุงเทพ',
    customerId: 'C-0107',
    date: '2026-05-18',
    address: '55 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    createdBy: 'wanna',
    items: [
      { sku: 'NB-A5-LINE', name: 'สมุดโน้ต A5 เส้นบรรทัด 80 แผ่น', qty: 50, unit: 'เล่ม', unitPrice: 28 },
      { sku: 'RULER-30', name: 'ไม้บรรทัด 30 ซม. พลาสติก', qty: 30, unit: 'อัน', unitPrice: 15 },
      { sku: 'SCISSORS-CRAFT', name: 'กรรไกรตัดกระดาษ Maped', qty: 20, unit: 'อัน', unitPrice: 85 },
    ],
  },
  {
    id: 'd3',
    docNumber: 'DLV-6804-00115',
    customer: 'คุณสมศรี วงษ์ทอง',
    customerId: 'C-0215',
    date: '2026-05-17',
    address: '8/12 ซ.ลาดพร้าว 101 เขตลาดพร้าว กรุงเทพฯ 10230',
    createdBy: 'somchai',
    items: [
      { sku: 'STAMP-PAD-BK', name: 'แป้นประทับตรา Shiny สีดำ', qty: 2, unit: 'กล่อง', unitPrice: 95 },
      { sku: 'TAPE-OPP-1', name: 'เทปใส OPP 1 นิ้ว x 50 หลา', qty: 6, unit: 'ม้วน', unitPrice: 22 },
    ],
  },
  {
    id: 'd4',
    docNumber: 'DLV-6804-00108',
    customer: 'ห้างหุ้นส่วน เดอะออฟฟิศ',
    customerId: 'C-0088',
    date: '2026-05-15',
    address: '77/3 ถ.รัชดาภิเษก แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
    createdBy: 'napat',
    items: [
      { sku: 'INK-HP-BK', name: 'หมึกพิมพ์ HP 680 สีดำ', qty: 3, unit: 'ตลับ', unitPrice: 285 },
    ],
    note: 'ลูกค้าขอยกเลิก',
  },
  {
    id: 'd5',
    docNumber: 'DLV-6804-00101',
    customer: 'บริษัท กรีนไลฟ์ จำกัด',
    customerId: 'C-0033',
    date: '2026-05-14',
    address: '22 ถ.นนทบุรี อ.เมือง นนทบุรี 11000',
    createdBy: 'wanna',
    items: [
      { sku: 'CLIP-BINDER', name: 'คลิปดำ ขนาด 2 นิ้ว (12 ตัว/กล่อง)', qty: 5, unit: 'กล่อง', unitPrice: 35 },
      { sku: 'POST-IT-3x3', name: 'กระดาษโน้ต Post-it 3x3 นิ้ว สีเหลือง', qty: 10, unit: 'แพ็ค', unitPrice: 55 },
      { sku: 'PEN-WHITEBOARD', name: 'ปากกาไวท์บอร์ด สีดำ (12 ด้าม)', qty: 3, unit: 'กล่อง', unitPrice: 180 },
      { sku: 'STAPLER-HD-50', name: 'เครื่องเย็บกระดาษ Max HD-50', qty: 2, unit: 'เครื่อง', unitPrice: 420 },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (s: string) => {
  const [y, m, d] = s.split('-');
  const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${parseInt(d)} ${thMonths[parseInt(m) - 1]} ${parseInt(y) + 543}`;
};
/** "2026-05-21" → "21/05/2569" (DD/MM/BE) */
const fmtDateSlash = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${parseInt(y) + 543}`;
};
const docTotal = (items: DocItem[]) => items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

// ─── Component ───────────────────────────────────────────────────────────────

type DialogView = 'search' | 'detail' | 'edit';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DeliveryDocDialog({ open, onClose }: Props) {
  const [view, setView] = useState<DialogView>('search');
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  /** null = ยังไม่ได้กดค้นหาเลย; array = กดแล้ว (อาจว่าง) */
  const [results, setResults] = useState<DeliveryDoc[] | null>(null);
  const [selected, setSelected] = useState<DeliveryDoc | null>(null);
  const [editItems, setEditItems] = useState<DocItem[]>([]);
  const [editNote, setEditNote] = useState('');
  const [addSku, setAddSku] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [suggestions, setSuggestions] = useState<ApiProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [pendingDeleteSku, setPendingDeleteSku] = useState<string | null>(null);
  const addSkuRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // focus search on open
  useEffect(() => {
    if (open && view === 'search') setTimeout(() => searchRef.current?.focus(), 50);
  }, [open, view]);

  // focus add-sku when entering edit
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

  // ── search ──
  const handleSearch = () => {
    const cc = custCode.trim().toLowerCase();
    const cn = custName.trim().toLowerCase();
    const dn = docNumber.trim().toLowerCase();
    setResults(
      MOCK_DOCS.filter(d => {
        const matchCc = !cc || d.customerId.toLowerCase().includes(cc);
        const matchCn = !cn || d.customer.toLowerCase().includes(cn);
        const matchDn = !dn || d.docNumber.toLowerCase().includes(dn);
        const matchFrom = !dateFrom || d.date >= dateFrom;
        const matchTo = !dateTo || d.date <= dateTo;
        return matchCc && matchCn && matchDn && matchFrom && matchTo;
      })
    );
  };
  const hasFilter = custCode || custName || docNumber || dateFrom || dateTo;
  const handleReset = () => { setCustCode(''); setCustName(''); setDocNumber(''); setDateFrom(''); setDateTo(''); setResults(null); };

  // ── open detail ──
  const openDetail = (doc: DeliveryDoc) => {
    setSelected(doc);
    setView('detail');
  };

  // ── open edit ──
  const openEdit = (doc: DeliveryDoc) => {
    setSelected(doc);
    setEditItems(doc.items.map(i => ({ ...i })));
    setEditNote(doc.note ?? '');
    setView('edit');
  };

  // ── edit helpers ──
  const removeEditItem = (sku: string) => setEditItems(prev => prev.filter(i => i.sku !== sku));
  const confirmDelete = async (_creds: { username: string; password: string }) => {
    // In production: validate supervisor credentials with backend before removing.
    if (pendingDeleteSku) {
      removeEditItem(pendingDeleteSku);
    }
    setPendingDeleteSku(null);
  };
  const handleAddSku = (e: React.FormEvent) => {
    e.preventDefault();
    const s = addSku.trim().toUpperCase();
    if (!s) return;
    if (editItems.some(i => i.sku === s)) {
      setEditItems(prev => prev.map(i => i.sku === s ? { ...i, qty: i.qty + addQty } : i));
    } else {
      setEditItems(prev => [...prev, { sku: s, name: `สินค้า ${s}`, qty: addQty, unit: 'ชิ้น', unitPrice: 0 }]);
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
        qty: addQty,
        unit: product.unit,
        unitPrice: product.standardPrice,
      }]);
    }
    setAddSku('');
    setAddQty(1);
    addSkuRef.current?.focus();
  };
  const saveEdit = () => {
    // In production: call API to update the document
    alert(`บันทึกใบ ${selected?.docNumber} เรียบร้อย`);
    setView('search');
  };

  const handlePrint = (doc: DeliveryDoc) => {
    // In production: open PDF URL
    alert(`พิมพ์ใบส่งสินค้า ${doc.docNumber}`);
  };

  // ─── VIEWS ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-[1280px] mx-4 flex flex-col overflow-hidden" style={{ maxHeight: '88vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center gap-3">
            <span className="text-h5 font-bold text-white">
              {view === 'search' && 'ค้นหา/พิมพ์ใบส่งสินค้า'}
              {view === 'detail' && `ใบส่งสินค้า ${selected?.docNumber}`}
              {view === 'edit' && `แก้ไข ${selected?.docNumber}`}
            </span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ══════════════ SEARCH VIEW ══════════════ */}
        {view === 'search' && (
          <>
            {/* Filter bar */}
            {/* Filter — 3-col grid, both rows share same column widths */}
            <div className="px-6 pt-5 pb-4 shrink-0 border-b border-gray-200">
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
                  <label className="text-c1 text-text-secondary mb-1.5 block">เลขที่ใบส่งสินค้า</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border border-gray-300 rounded-[10px] focus-within:border-sky-400 focus-within:border-2 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input type="text" value={docNumber}
                      onChange={e => setDocNumber(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="เช่น DLV-6804-00123"
                      className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400 min-w-0" />
                  </div>
                </div>

                {/* Row 2 — Date pickers (DD/MM/BE display, native picker hidden underneath) */}
                <div className="min-w-0">
                  <label className="text-c1 text-text-secondary mb-1.5 block">ตั้งแต่</label>
                  <div className="relative flex items-center gap-2 h-11 px-3 bg-white border border-gray-300 rounded-[10px] hover:border-sky-300 transition cursor-pointer"
                    onClick={() => dateFromRef.current?.showPicker()}>
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className={`flex-1 text-b3 ${!dateFrom ? 'text-gray-400' : 'text-text-primary'}`}>
                      {dateFrom ? fmtDateSlash(dateFrom) : 'วว/ดด/ปปปป'}
                    </span>
                    <input ref={dateFromRef} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="absolute inset-0 opacity-0 pointer-events-none" tabIndex={-1} />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="text-c1 text-text-secondary mb-1.5 block">ถึงวันที่</label>
                  <div className="relative flex items-center gap-2 h-11 px-3 bg-white border border-gray-300 rounded-[10px] hover:border-sky-300 transition cursor-pointer"
                    onClick={() => dateToRef.current?.showPicker()}>
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className={`flex-1 text-b3 ${!dateTo ? 'text-gray-400' : 'text-text-primary'}`}>
                      {dateTo ? fmtDateSlash(dateTo) : 'วว/ดด/ปปปป'}
                    </span>
                    <input ref={dateToRef} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="absolute inset-0 opacity-0 pointer-events-none" tabIndex={-1} />
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
                    className="h-11 px-8 rounded-[10px] text-s2 font-bold transition hover:brightness-95 flex items-center gap-2 whitespace-nowrap"
                    style={{ backgroundColor: YELLOW, color: NAVY }}>
                    <Search className="w-5 h-5" strokeWidth={2.5} />ค้นหา
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
                      กรุณาพิมพ์รหัส ชื่อลูกค้า เลขที่ใบส่งสินค้า วันที่บิล<br />เพื่อเริ่มการค้นหา
                    </div>
                  </div>
                )}

                {/* No results */}
                {results !== null && results.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 bg-gray-50">
                    <FileSearch className="w-12 h-12 text-gray-300" />
                    <div className="text-b3 text-text-muted">ไม่พบใบส่งสินค้าที่ตรงกัน</div>
                  </div>
                )}

                {/* Results table */}
                {results !== null && results.length > 0 && (
                  <table className="w-full text-c1">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">เลขที่ใบ</th>
                        <th className="text-center px-3 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">วันที่</th>
                        <th className="text-left px-3 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">รหัสลูกค้า</th>
                        <th className="text-left px-3 py-2.5 text-c1 text-text-secondary font-semibold">ชื่อลูกค้า</th>
                        <th className="text-right px-4 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">ยอดสุทธิ</th>
                        <th className="text-center px-3 py-2.5 text-c1 text-text-secondary font-semibold whitespace-nowrap">ผู้ทำรายการ</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((doc, i) => (
                        <tr key={doc.id}
                          className={`border-b border-gray-100 last:border-b-0 hover:bg-sky-50 cursor-pointer transition-colors ${i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}
                          onClick={() => openDetail(doc)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span className="font-mono font-bold text-text-primary whitespace-nowrap">{doc.docNumber}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-text-secondary whitespace-nowrap">
                            {fmtDate(doc.date)}
                          </td>
                          <td className="px-3 py-3 text-text-secondary whitespace-nowrap">
                            {doc.customerId}
                          </td>
                          <td className="px-3 py-3 text-text-primary">
                            {doc.customer}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold tabular-nums whitespace-nowrap" style={{ color: NAVY }}>
                              ฿{fmt(docTotal(doc.items))}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-text-secondary">
                            {doc.createdBy}
                          </td>
                          <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 justify-end">
                              <button type="button" title="พิมพ์ใบส่งสินค้า" onClick={() => handlePrint(doc)}
                                className="w-9 h-9 rounded-[8px] flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-text-primary transition">
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </>
        )}

        {/* ══════════════ DETAIL VIEW ══════════════ */}
        {view === 'detail' && selected && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Info strip — single card, 4 equal columns */}
              <div className="rounded-[14px] border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-4 divide-x divide-gray-200">
                  {([
                    { icon: Hash,     label: 'เลขที่ใบส่งสินค้า', value: selected.docNumber,              mono: true },
                    { icon: User,     label: 'ลูกค้า',             value: selected.customer,               sub: selected.customerId },
                    { icon: Calendar, label: 'วันที่',              value: fmtDate(selected.date) },
                    { icon: User,     label: 'ผู้ทำรายการ',         value: selected.createdBy },
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

              {/* Address */}
              <div className="rounded-[14px] bg-sky-50 border border-sky-100 px-5 py-4 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-c1 text-sky-600 font-medium mb-1">ที่อยู่จัดส่ง</div>
                  <div className="text-b3 text-text-primary leading-relaxed">{selected.address}</div>
                </div>
              </div>

              {/* Note */}
              {selected.note && (
                <div className="rounded-[14px] bg-amber-50 border border-amber-100 px-5 py-4 flex items-start gap-3">
                  <span className="text-c1 font-semibold text-amber-700 shrink-0">หมายเหตุ:</span>
                  <span className="text-b3 text-amber-800">{selected.note}</span>
                </div>
              )}

              {/* Items table */}
              <div>
                <div className="text-s2 font-bold mb-3" style={{ color: NAVY }}>รายการสินค้า</div>
                <div className="rounded-[14px] border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-s2 font-semibold text-text-secondary w-10">#</th>
                        <th className="text-left px-4 py-3 text-s2 font-semibold text-text-secondary">รหัส / ชื่อสินค้า</th>
                        <th className="text-right px-4 py-3 text-s2 font-semibold text-text-secondary">จำนวน</th>
                        <th className="text-right px-4 py-3 text-s2 font-semibold text-text-secondary">ราคา/หน่วย</th>
                        <th className="text-right px-4 py-3 text-s2 font-semibold text-text-secondary">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr key={item.sku} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5 text-c1 text-text-muted">{i + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="text-b3 font-medium text-text-primary">{item.name}</div>
                            <div className="text-c2 text-text-muted font-mono mt-0.5">{item.sku}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right align-middle">
                            <div className="text-s2 text-text-primary tabular-nums">{item.qty.toLocaleString()}</div>
                            <div className="text-c2 text-text-muted">/{item.unit}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-s2 tabular-nums text-text-primary">
                            ฿{fmt(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3.5 text-right text-b3 font-bold tabular-nums" style={{ color: NAVY }}>
                            ฿{fmt(item.qty * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td colSpan={4} className="px-4 py-3.5 text-right text-b3 font-semibold text-text-secondary">
                          ยอดสุทธิ
                        </td>
                        <td className="px-4 py-3.5 text-right text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                          ฿{fmt(docTotal(selected.items))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setView('search')}
                className="h-12 px-6 rounded-[12px] border border-gray-300 bg-white text-s2 text-text-primary hover:bg-gray-50 transition"
              >
                กลับ
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => handlePrint(selected)}
                className="h-12 px-8 rounded-[12px] text-s2 font-bold transition hover:brightness-95 flex items-center gap-2"
                style={{ backgroundColor: YELLOW, color: NAVY }}
              >
                <Printer className="w-4 h-4" />
                พิมพ์ใบส่งสินค้า
              </button>
            </div>
          </>
        )}

        {/* ══════════════ EDIT VIEW ══════════════ */}
        {view === 'edit' && selected && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Add SKU */}
              <div>
                <div className="text-s2 font-bold mb-3" style={{ color: NAVY }}>รายการสินค้า</div>
                <form onSubmit={handleAddSku} className="flex items-center gap-3">
                  {/* Qty stepper — matches main POS screen */}
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
                  {/* Search input with dropdown */}
                  <div className="flex-1 relative">
                    <div className="flex items-center gap-2 h-11 px-4 bg-white border border-gray-300 rounded-[10px] focus-within:border-sky-400 focus-within:border-2 transition">
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        ref={addSkuRef}
                        type="text"
                        value={addSku}
                        onChange={e => setAddSku(e.target.value)}
                        onFocus={() => addSku.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
                        placeholder="สแกนบาร์โค้ด หรือ ค้นหาด้วยชื่อสินค้า, SKU, รหัสบาร์โค้ด, แบรนด์"
                        className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400"
                      />
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
              </div>

              {/* Edit items table */}
              <div className="rounded-[14px] border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="text-left px-3 py-3 text-s2 font-semibold text-text-secondary w-[140px] whitespace-nowrap">รหัสสินค้า</th>
                      <th className="text-left px-3 py-3 text-s2 font-semibold text-text-secondary whitespace-nowrap">รายการสินค้า</th>
                      <th className="text-center px-3 py-3 text-s2 font-semibold text-text-secondary w-[100px] whitespace-nowrap">จำนวน</th>
                      <th className="text-right px-3 py-3 text-s2 font-semibold text-text-secondary w-[130px] whitespace-nowrap">ราคา/หน่วย</th>
                      <th className="text-right px-3 py-3 text-s2 font-semibold text-text-secondary w-[140px] whitespace-nowrap">รวม</th>
                      <th className="px-3 py-3 w-[70px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {editItems.map(item => (
                      <tr key={item.sku} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
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
                        <td className="px-3 py-3 text-right align-middle text-s2 tabular-nums text-text-primary">
                          {fmt(item.unitPrice)}
                        </td>
                        <td className="px-3 py-3 text-right align-middle text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                          {fmt(item.qty * item.unitPrice)}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setPendingDeleteSku(item.sku)}
                              title="ลบรายการสินค้า"
                              className="w-10 h-10 rounded-[10px] bg-status-danger-bg text-status-danger hover:brightness-95 flex items-center justify-center transition"
                            >
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
                  {editItems.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td colSpan={4} className="px-3 py-3.5 text-right text-b3 font-semibold text-text-secondary">ยอดสุทธิ</td>
                        <td className="px-3 py-3.5 text-right text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                          ฿{fmt(docTotal(editItems))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Note */}
              <div>
                <label className="text-c1 text-text-secondary mb-1.5 block">หมายเหตุ</label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  rows={2}
                  placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] text-b3 outline-none focus:border-sky-400 focus:border-2 transition resize-none"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
              <button type="button" onClick={() => setView('detail')}
                className="h-12 px-6 rounded-[12px] border border-gray-300 bg-white text-s2 text-text-primary hover:bg-gray-50 transition">
                ยกเลิก
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={saveEdit}
                disabled={editItems.length === 0}
                className="h-12 px-8 rounded-[12px] text-s2 font-bold transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: YELLOW, color: NAVY }}
              >
                <CheckCircle2 className="w-4 h-4" />
                บันทึกการแก้ไข
              </button>
            </div>
          </>
        )}

      </div>

      {/* Supervisor approval to delete an item */}
      <SupervisorAuthDialog
        open={pendingDeleteSku !== null}
        mode="cancel-item"
        onClose={() => setPendingDeleteSku(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
