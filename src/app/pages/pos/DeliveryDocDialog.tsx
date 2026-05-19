import { useState, useRef, useEffect } from 'react';
import {
  X, FileSearch, Search, Printer, Pencil, ChevronLeft,
  Trash2, Plus, Minus, FileText, CheckCircle2, Clock,
  Package, User, Calendar, Hash, MapPin,
} from 'lucide-react';

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
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  items: DocItem[];
  note?: string;
}

const STATUS_LABEL: Record<DeliveryDoc['status'], string> = {
  pending:   'รอดำเนินการ',
  shipped:   'จัดส่งแล้ว',
  delivered: 'ส่งถึงแล้ว',
  cancelled: 'ยกเลิก',
};
const STATUS_COLOR: Record<DeliveryDoc['status'], string> = {
  pending:   '#D97706',
  shipped:   '#0EA5E9',
  delivered: '#16A34A',
  cancelled: '#EF4444',
};
const STATUS_BG: Record<DeliveryDoc['status'], string> = {
  pending:   '#FFFBEB',
  shipped:   '#F0F9FF',
  delivered: '#F0FDF4',
  cancelled: '#FEF2F2',
};

const MOCK_DOCS: DeliveryDoc[] = [
  {
    id: 'd1',
    docNumber: 'DLV-6804-00123',
    customer: 'บริษัท เอบีซี จำกัด',
    customerId: 'C-0042',
    date: '2026-05-19',
    address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    status: 'pending',
    items: [
      { sku: 'PEN-001', name: 'ปากกาลูกลื่น Pilot G2 สีน้ำเงิน', qty: 12, unit: 'ด้าม', unitPrice: 35 },
      { sku: 'PAP-A4-500', name: 'กระดาษ A4 Double A 80g (1 รีม)', qty: 5, unit: 'รีม', unitPrice: 145 },
      { sku: 'FILE-ARCH', name: 'แฟ้มอาร์ช 2 นิ้ว สีดำ', qty: 10, unit: 'อัน', unitPrice: 65 },
    ],
    note: 'จัดส่งก่อนเที่ยง',
  },
  {
    id: 'd2',
    docNumber: 'DLV-6804-00119',
    customer: 'โรงเรียนสาธิตกรุงเทพ',
    customerId: 'C-0107',
    date: '2026-05-18',
    address: '55 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    status: 'shipped',
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
    status: 'delivered',
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
    status: 'cancelled',
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
    status: 'delivered',
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
  const addSkuRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // focus search on open
  useEffect(() => {
    if (open && view === 'search') setTimeout(() => searchRef.current?.focus(), 50);
  }, [open, view]);

  // focus add-sku when entering edit
  useEffect(() => {
    if (view === 'edit') setTimeout(() => addSkuRef.current?.focus(), 50);
  }, [view]);

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
  const changeQty = (sku: string, delta: number) => {
    setEditItems(prev =>
      prev.map(i => i.sku === sku ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  };
  const removeEditItem = (sku: string) => setEditItems(prev => prev.filter(i => i.sku !== sku));
  const handleAddSku = (e: React.FormEvent) => {
    e.preventDefault();
    const s = addSku.trim().toUpperCase();
    if (!s) return;
    if (editItems.some(i => i.sku === s)) {
      changeQty(s, 1);
    } else {
      setEditItems(prev => [...prev, { sku: s, name: `สินค้า ${s}`, qty: 1, unit: 'ชิ้น', unitPrice: 0 }]);
    }
    setAddSku('');
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
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-[920px] mx-4 flex flex-col overflow-hidden" style={{ maxHeight: '88vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center gap-3">
            {(view === 'detail' || view === 'edit') && (
              <button
                type="button"
                onClick={() => setView(view === 'edit' ? 'detail' : 'search')}
                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <span className="text-h5 font-bold text-white">
              {view === 'search' && 'ค้นหา/พิมพ์/แก้ไขใบส่งสินค้า'}
              {view === 'detail' && `ใบส่งสินค้า ${selected?.docNumber}`}
              {view === 'edit' && `แก้ไข ${selected?.docNumber}`}
            </span>
            {view === 'detail' && selected && (
              <span
                className="px-2.5 py-1 rounded-[8px] text-c2 font-bold"
                style={{ backgroundColor: STATUS_BG[selected.status], color: STATUS_COLOR[selected.status] }}
              >
                {STATUS_LABEL[selected.status]}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ══════════════ SEARCH VIEW ══════════════ */}
        {view === 'search' && (
          <>
            {/* Filter bar */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-end gap-3">
                {/* รหัสลูกค้า */}
                <div className="flex-1">
                  <label className="text-c1 text-text-secondary mb-1.5 block">รหัสลูกค้า</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border-2 border-gray-200 rounded-[10px] focus-within:border-sky-400 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input ref={searchRef} type="text" value={custCode}
                      onChange={e => setCustCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="เช่น C-0042"
                      className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400" />
                  </div>
                </div>
                {/* ชื่อลูกค้า */}
                <div className="flex-1">
                  <label className="text-c1 text-text-secondary mb-1.5 block">ชื่อลูกค้า</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border-2 border-gray-200 rounded-[10px] focus-within:border-sky-400 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input type="text" value={custName}
                      onChange={e => setCustName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="ชื่อลูกค้า"
                      className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400" />
                  </div>
                </div>
                {/* เลขที่ใบ */}
                <div className="flex-1">
                  <label className="text-c1 text-text-secondary mb-1.5 block">เลขที่ใบส่งสินค้า</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-white border-2 border-gray-200 rounded-[10px] focus-within:border-sky-400 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input type="text" value={docNumber}
                      onChange={e => setDocNumber(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="เช่น DLV-6804-00123"
                      className="flex-1 text-b3 outline-none bg-transparent placeholder:text-gray-400" />
                  </div>
                </div>
                {/* วันที่ */}
                <div className="flex-1">
                  <label className="text-c1 text-text-secondary mb-1.5 block">วันที่บิล — วันสิ้นสุดบิล</label>
                  <div className="flex items-center gap-1.5 h-11 px-3 bg-white border-2 border-gray-200 rounded-[10px] focus-within:border-sky-400 transition">
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="flex-1 text-b3 outline-none bg-transparent min-w-0" />
                    <span className="text-gray-400 shrink-0">—</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="flex-1 text-b3 outline-none bg-transparent min-w-0" />
                  </div>
                </div>
                {/* ค้นหา */}
                <button type="button" onClick={handleSearch}
                  className="h-11 px-6 rounded-[10px] text-h5 font-bold transition hover:brightness-95 shrink-0 flex items-center gap-2"
                  style={{ backgroundColor: YELLOW, color: NAVY }}>
                  <Search className="w-4 h-4" />ค้นหา
                </button>
              </div>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto px-6 pt-5 pb-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-s2 font-bold text-text-primary">ผลการค้นหา</span>
                {results !== null && (
                  <div className="flex items-center gap-3">
                    <span className="text-c1 text-text-muted">พบ {results.length} รายการ</span>
                    {hasFilter && (
                      <button type="button" onClick={handleReset}
                        className="text-c1 text-sky-500 hover:underline">ล้างการค้นหา</button>
                    )}
                  </div>
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
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                      <tr>
                        <th className="text-left px-5 py-3 text-c1 text-text-secondary font-semibold">เลขที่ใบ</th>
                        <th className="text-left px-5 py-3 text-c1 text-text-secondary font-semibold">ชื่อลูกค้า</th>
                        <th className="text-center px-4 py-3 text-c1 text-text-secondary font-semibold">วันที่</th>
                        <th className="text-center px-4 py-3 text-c1 text-text-secondary font-semibold">รายการ</th>
                        <th className="text-right px-5 py-3 text-c1 text-text-secondary font-semibold">ยอดสุทธิ</th>
                        <th className="text-center px-4 py-3 text-c1 text-text-secondary font-semibold">สถานะ</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((doc, i) => (
                        <tr key={doc.id}
                          className={`border-b border-gray-100 last:border-b-0 hover:bg-sky-50 cursor-pointer transition-colors ${i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}
                          onClick={() => openDetail(doc)}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                              <span className="text-b2 font-mono font-bold text-text-primary">{doc.docNumber}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-b2 text-text-primary">{doc.customer}</div>
                            <div className="text-c2 text-text-muted">{doc.customerId}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center text-b3 text-text-secondary whitespace-nowrap">
                            {fmtDate(doc.date)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-c2 text-text-secondary">
                              <Package className="w-3 h-3" />
                              {doc.items.length} รายการ
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                              ฿{fmt(docTotal(doc.items))}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-[8px] text-c2 font-bold whitespace-nowrap"
                              style={{ backgroundColor: STATUS_BG[doc.status], color: STATUS_COLOR[doc.status] }}>
                              {STATUS_LABEL[doc.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 justify-end">
                              <button type="button" title="พิมพ์ใบส่งสินค้า" onClick={() => handlePrint(doc)}
                                className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-text-primary transition">
                                <Printer className="w-4 h-4" />
                              </button>
                              {doc.status === 'pending' && (
                                <button type="button" title="แก้ไขรายการ" onClick={() => openEdit(doc)}
                                  className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-500 transition">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-bg-page shrink-0">
              <button type="button" onClick={onClose}
                className="w-full h-11 rounded-[12px] border border-gray-300 bg-white text-s2 text-text-secondary hover:bg-gray-50 transition">
                ปิด (Esc)
              </button>
            </div>
          </>
        )}

        {/* ══════════════ DETAIL VIEW ══════════════ */}
        {view === 'detail' && selected && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Doc info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Hash, label: 'เลขที่ใบส่งสินค้า', value: selected.docNumber },
                  { icon: User, label: 'ลูกค้า', value: `${selected.customer} (${selected.customerId})` },
                  { icon: Calendar, label: 'วันที่', value: fmtDate(selected.date) },
                  { icon: Clock, label: 'สถานะ', value: STATUS_LABEL[selected.status], color: STATUS_COLOR[selected.status] },
                ].map(row => (
                  <div key={row.label} className="rounded-[12px] bg-gray-50 border border-gray-200 px-4 py-3 flex items-start gap-3">
                    <row.icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-c2 text-text-muted">{row.label}</div>
                      <div className="text-b2 font-bold" style={{ color: row.color ?? '#111827' }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="rounded-[12px] bg-sky-50 border border-sky-200 px-4 py-3 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-c2 text-sky-600 mb-0.5">ที่อยู่จัดส่ง</div>
                  <div className="text-b2 text-text-primary">{selected.address}</div>
                </div>
              </div>

              {/* Items table */}
              <div>
                <div className="text-s2 font-bold mb-3" style={{ color: NAVY }}>รายการสินค้า</div>
                <div className="rounded-[12px] border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-c1 text-text-secondary">#</th>
                        <th className="text-left px-4 py-3 text-c1 text-text-secondary">รหัส / ชื่อสินค้า</th>
                        <th className="text-right px-4 py-3 text-c1 text-text-secondary">จำนวน</th>
                        <th className="text-right px-4 py-3 text-c1 text-text-secondary">ราคา/หน่วย</th>
                        <th className="text-right px-4 py-3 text-c1 text-text-secondary">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr key={item.sku} className="border-b border-gray-100 last:border-b-0">
                          <td className="px-4 py-3 text-c2 text-text-muted">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="text-b2 text-text-primary">{item.name}</div>
                            <div className="text-c2 text-text-muted font-mono">{item.sku}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-b2 tabular-nums">
                            {item.qty.toLocaleString()} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-b2 tabular-nums text-text-secondary">
                            ฿{fmt(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                            ฿{fmt(item.qty * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td colSpan={4} className="px-4 py-3 text-right text-s2 font-bold text-text-primary">
                          ยอดสุทธิ
                        </td>
                        <td className="px-4 py-3 text-right text-h5 font-bold tabular-nums" style={{ color: NAVY }}>
                          ฿{fmt(docTotal(selected.items))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Note */}
              {selected.note && (
                <div className="rounded-[12px] bg-amber-50 border border-amber-200 px-4 py-3 text-b2 text-amber-800">
                  <span className="font-bold">หมายเหตุ:</span> {selected.note}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setView('search')}
                className="h-12 px-5 rounded-[12px] border border-gray-300 text-c1 text-text-secondary hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                กลับ
              </button>
              <div className="flex-1" />
              {selected.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="h-12 px-6 rounded-[12px] border-2 border-sky-300 bg-sky-50 text-s2 text-sky-700 hover:bg-sky-100 transition flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  แก้ไขรายการ
                </button>
              )}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Add SKU */}
              <div className="rounded-[14px] bg-sky-50 border border-sky-200 p-4">
                <div className="text-s2 font-bold text-sky-700 mb-3">เพิ่มสินค้า</div>
                <form onSubmit={handleAddSku} className="flex gap-3">
                  <div className="flex-1 flex items-center gap-2 h-11 px-4 bg-white border-2 border-sky-300 rounded-[10px] focus-within:border-sky-500 transition">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      ref={addSkuRef}
                      type="text"
                      value={addSku}
                      onChange={e => setAddSku(e.target.value)}
                      placeholder="สแกน / พิมพ์ รหัสสินค้า"
                      className="flex-1 text-b2 outline-none bg-transparent placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-[10px] text-s2 font-bold transition hover:brightness-95 flex items-center gap-1.5"
                    style={{ backgroundColor: NAVY, color: 'white' }}
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่ม
                  </button>
                </form>
              </div>

              {/* Edit items table */}
              <div className="rounded-[12px] border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-c1 text-text-secondary">รหัส / ชื่อสินค้า</th>
                      <th className="text-center px-4 py-3 text-c1 text-text-secondary">จำนวน</th>
                      <th className="text-right px-4 py-3 text-c1 text-text-secondary">ราคา/หน่วย</th>
                      <th className="text-right px-4 py-3 text-c1 text-text-secondary">รวม</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {editItems.map(item => (
                      <tr key={item.sku} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="text-b2 text-text-primary">{item.name}</div>
                          <div className="text-c2 text-text-muted font-mono">{item.sku}</div>
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
                        <td className="px-4 py-3 text-right text-b2 tabular-nums text-text-secondary">
                          ฿{fmt(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-s2 font-bold tabular-nums" style={{ color: NAVY }}>
                          ฿{fmt(item.qty * item.unitPrice)}
                        </td>
                        <td className="px-3 py-3">
                          <button type="button" onClick={() => removeEditItem(item.sku)}
                            className="w-8 h-8 rounded-[8px] border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {editItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-b2 text-text-muted">
                          ยังไม่มีรายการสินค้า
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {editItems.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td colSpan={3} className="px-4 py-3 text-right text-s2 font-bold text-text-primary">ยอดสุทธิ</td>
                        <td className="px-4 py-3 text-right text-h5 font-bold tabular-nums" style={{ color: NAVY }}>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-[12px] text-b2 outline-none focus:border-sky-400 transition resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button type="button" onClick={() => setView('detail')}
                className="h-12 px-5 rounded-[12px] border border-gray-300 text-c1 text-text-secondary hover:bg-gray-50 transition flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
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
    </div>
  );
}
