/**
 * PreparationSlipDialog
 * ─────────────────────────────────────────────────────────────────────────────
 * Digital "ใบเตรียมสินค้า" (preparation slip) — modeled after the printed paper
 * form used by warehouse pickers.
 *
 *   • Yellow button "ดูเอกสารใบเตรียมสินค้า" on the OrderSuccess dialog opens this.
 *   • The body uses an A4-paper aesthetic (white sheet on grey backdrop)
 *     so the cashier recognises it as the document equivalent.
 *   • "พิมพ์เอกสาร" triggers window.print() with print CSS that hides the chrome
 *     and renders only the sheet at the top of the page.
 */

import { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
// jsPDF + html2canvas are heavy (~300 KB). Lazy-load them only when the user
// actually saves a PDF — keeps initial bundle small and the preview snappy.

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrepSlipItem {
  sku: string;
  barcode?: string;
  name: string;
  qty: number;
  unit: string;           // e.g. "กล่อง(1/6)", "ห่อ(1/50)"
  unitPrice: number;
  /** lineTotal = qty * unitPrice (paid portion). Caller computes this so promos can be reflected. */
  total: number;
}

export interface PrepSlipCustomer {
  /** Customer code, e.g. "11380" */
  code?: string;
  name: string;
  /** Full address as a single string. Multi-line acceptable. */
  address?: string;
  /** Document-type marker shown at top-left of the items section, e.g. "(Y)" */
  docType?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Document number, e.g. "S2026003953" */
  docNumber: string;
  /** Date+time the slip was generated. */
  dateTime: Date;
  /** Cashier display name, e.g. "SORAWITTH". */
  cashierName: string;
  /** POS terminal id, e.g. "POS0". */
  posMachine: string;
  customer: PrepSlipCustomer;
  items: PrepSlipItem[];
  /** Net total before VAT (รวมเงิน at the bottom-right of the table). */
  subtotal: number;
  /** VAT amount (ภาษี). 0 if not applicable. */
  vat: number;
  /** Final amount after VAT (ยอดสุทธิ). */
  netTotal: number;
  /** Optional free-form note shown above the warning line. */
  note?: string;
  /**
   * When true, the dialog auto-triggers PDF download on mount (no print dialog).
   * Useful for the order-success "บันทึก" button, which wants a silent save.
   * The dialog stays mounted briefly while capturing the DOM; consumer should
   * close it via `onDownloaded`.
   */
  autoDownloadPdf?: boolean;
  /** Fired after the auto-download completes (success or failure). */
  onDownloaded?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "23-01-2026" — DD-MM-YYYY (Gregorian, matches the printed paper form). */
const fmtDateDashed = (d: Date) =>
  `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

/** "12:48" — HH:MM 24h. */
const fmtTime = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

/**
 * Thai bath-amount in words: 17244.00 → "หนึ่งหมื่นเจ็ดพันสองร้อยสี่สิบสี่บาทถ้วน".
 * Handles 2-decimal stang as well: 12.50 → "สิบสองบาทห้าสิบสตางค์".
 */
function bahtText(n: number): string {
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  if (n === 0) return 'ศูนย์บาทถ้วน';
  const abs = Math.abs(n);
  const baht = Math.floor(abs);
  const stang = Math.round((abs - baht) * 100);

  const groupToWords = (numStr: string): string => {
    let out = '';
    const len = numStr.length;
    for (let i = 0; i < len; i++) {
      const d = parseInt(numStr[i], 10);
      const pos = len - 1 - i;
      if (d === 0) continue;
      if (pos === 1 && d === 1)       out += 'สิบ';
      else if (pos === 1 && d === 2)  out += 'ยี่สิบ';
      else if (pos === 0 && d === 1 && len > 1) out += 'เอ็ด';
      else                            out += digits[d] + places[pos];
    }
    return out;
  };

  const bahtToWords = (b: number): string => {
    if (b === 0) return '';
    const s = b.toString();
    // Handle 7+ digit numbers in groups of 6 separated by "ล้าน".
    if (s.length > 6) {
      const head = s.slice(0, s.length - 6);
      const tail = s.slice(-6);
      return bahtToWords(parseInt(head, 10)) + 'ล้าน' + (parseInt(tail, 10) === 0 ? '' : groupToWords(tail));
    }
    return groupToWords(s);
  };

  const bahtWords = bahtToWords(baht);
  if (stang === 0) return (bahtWords || 'ศูนย์') + 'บาทถ้วน';
  return (bahtWords || 'ศูนย์') + 'บาท' + groupToWords(stang.toString()) + 'สตางค์';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PreparationSlipDialog({
  open, onClose,
  docNumber, dateTime, cashierName, posMachine,
  customer, items,
  subtotal, vat, netTotal,
  note,
  autoDownloadPdf, onDownloaded,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  /**
   * Capture the white sheet element and write it into a PDF (A4 portrait).
   * Uses html2canvas → JPEG/PNG → jsPDF.addImage. This avoids Thai-font
   * embedding entirely (text is rasterised at scale 2 for sharpness).
   */
  const downloadAsPdf = async () => {
    const node = sheetRef.current;
    if (!node || busy) return;
    setBusy(true);
    try {
      // Lazy-load — only paid for when user actually exports.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      // Higher scale = sharper vector-look text after rasterisation.
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // A4 portrait, 210x297mm, 8mm safe margin on each side.
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pageW - margin * 2;
      // Maintain aspect ratio.
      const imgW = usableW;
      const imgH = (canvas.height / canvas.width) * imgW;

      if (imgH <= pageH - margin * 2) {
        // Single page fit
        pdf.addImage(imgData, 'JPEG', margin, margin, imgW, imgH, undefined, 'FAST');
      } else {
        // Long slip: slice the canvas vertically across multiple pages.
        const pxPerMm = canvas.width / imgW;
        const pageContentHeightPx = (pageH - margin * 2) * pxPerMm;
        let y = 0;
        while (y < canvas.height) {
          const sliceHeight = Math.min(pageContentHeightPx, canvas.height - y);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext('2d');
          if (!ctx) break;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, -y);
          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
          if (y > 0) pdf.addPage();
          pdf.addImage(sliceData, 'JPEG', margin, margin, imgW, sliceHeight / pxPerMm, undefined, 'FAST');
          y += sliceHeight;
        }
      }
      pdf.save(`${docNumber}.pdf`);
    } catch (err) {
      console.error('[PreparationSlipDialog] PDF export failed', err);
      alert('ไม่สามารถบันทึกเป็น PDF ได้ กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  };

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  // Auto-download path: when invoked with autoDownloadPdf=true, capture once
  // the sheet has painted, then signal the parent. We wait two animation frames
  // (mount + paint) before starting html2canvas so the DOM is settled.
  useEffect(() => {
    if (!open || !autoDownloadPdf) return;
    let cancelled = false;
    const run = async () => {
      // Two RAFs ≈ one paint after mount.
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;
      await downloadAsPdf();
      if (cancelled) return;
      onDownloaded?.();
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoDownloadPdf]);

  if (!open) return null;

  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center prep-slip-root">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm prep-slip-backdrop" onClick={busy ? undefined : onClose} />

      {/* Busy overlay during PDF capture */}
      {busy && (
        <div className="absolute z-[70] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[12px] shadow-2xl px-6 py-5 flex items-center gap-3 prep-slip-chrome">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} />
          <div className="text-s2 font-semibold text-text-primary">กำลังบันทึก PDF...</div>
        </div>
      )}

      {/* Dialog */}
      <div className="relative w-full max-w-[1180px] mx-4 flex flex-col overflow-hidden rounded-[16px] shadow-2xl bg-white prep-slip-dialog" style={{ maxHeight: '96vh' }}>

        {/* ── Header (hidden when printing) ── */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 prep-slip-chrome" style={{ backgroundColor: NAVY }}>
          <div className="text-h5 font-bold text-white">เอกสารใบเตรียมสินค้า</div>
          <button type="button" onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── Paper sheet (this is what prints) ── */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6 prep-slip-scroll">
          <div ref={sheetRef} className="prep-slip-sheet bg-white mx-auto shadow-md" style={{
            width: '100%',
            maxWidth: 1080,
            padding: '36px 44px',
            fontSize: 14,
            color: '#000',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}>

            {/* ── Top: customer info (left) + doc metadata (right) ── */}
            <div className="grid grid-cols-2 gap-6 mb-3">
              {/* Customer block */}
              <div className="min-w-0">
                <div className="flex items-baseline gap-3">
                  <span className="text-text-muted shrink-0">ลูกค้า</span>
                  <span className="font-bold tabular-nums">{customer.code ?? '-'}</span>
                  <span className="text-text-primary truncate">{customer.name}</span>
                </div>
                {customer.address && (
                  <div className="flex items-start gap-3 mt-1">
                    <span className="text-text-muted shrink-0">ที่อยู่</span>
                    <span className="text-text-primary whitespace-pre-wrap">{customer.address}</span>
                  </div>
                )}
              </div>

              {/* Metadata block */}
              <div>
                <div className="text-right mb-2">
                  <div className="text-h4 font-bold tracking-wide" style={{ color: NAVY }}>ใบเตรียมสินค้า</div>
                </div>
                <table className="w-full text-c1">
                  <tbody>
                    <tr>
                      <td className="text-text-muted py-0.5 whitespace-nowrap">เลขที่ใบเตรียมสินค้า</td>
                      <td className="text-right py-0.5 font-bold font-mono tabular-nums">{docNumber}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted py-0.5 whitespace-nowrap">วันที่</td>
                      <td className="text-right py-0.5 tabular-nums">{fmtDateDashed(dateTime)}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted py-0.5 whitespace-nowrap">เวลา</td>
                      <td className="text-right py-0.5 tabular-nums">{fmtTime(dateTime)}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted py-0.5 whitespace-nowrap">ผู้ขาย</td>
                      <td className="text-right py-0.5 font-bold uppercase">{cashierName}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted py-0.5 whitespace-nowrap">เครื่อง</td>
                      <td className="text-right py-0.5 font-bold">{posMachine}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-right pt-1 text-text-muted">หน้าที่ 1 จาก 1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doc-type marker */}
            {customer.docType && (
              <div className="font-bold mb-1">{customer.docType}</div>
            )}

            {/* ── Items table ── */}
            <table className="w-full prep-slip-table" style={{ borderCollapse: 'collapse', fontSize: 12.5 }}>
              <colgroup>
                <col style={{ width: 38 }} />
                <col style={{ width: 130 }} />
                <col />
                <col style={{ width: 58 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                  <th className="text-center py-1.5 font-semibold">ลำดับ</th>
                  <th className="text-left  py-1.5 font-semibold">รหัสบาร์โค้ด</th>
                  <th className="text-left  py-1.5 font-semibold">ชื่อสินค้า</th>
                  <th className="text-right py-1.5 font-semibold">จำนวน</th>
                  <th className="text-left  py-1.5 font-semibold pl-2">หน่วย</th>
                  <th className="text-right py-1.5 font-semibold">ราคา/หน่วย</th>
                  <th className="text-right py-1.5 font-semibold pr-1">รวมเงิน</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={`${item.sku}-${i}`}>
                    <td className="text-center py-1 align-top">{i + 1}</td>
                    <td className="py-1 align-top font-mono tabular-nums">{item.barcode ?? item.sku}</td>
                    <td className="py-1 align-top pr-2">{item.name}</td>
                    <td className="text-right py-1 align-top tabular-nums">{item.qty.toLocaleString('th-TH')}</td>
                    <td className="py-1 align-top pl-2">{item.unit}</td>
                    <td className="text-right py-1 align-top tabular-nums">{fmt(item.unitPrice)}</td>
                    <td className="text-right py-1 align-top tabular-nums pr-1">{fmt(item.total)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-text-muted">ไม่มีรายการสินค้า</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Subtotal row */}
            <div className="flex items-center justify-between py-2"
              style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', fontSize: 12.5 }}>
              <div className="flex-1">
                <span className="text-text-muted">รวมเงิน (ตัวอักษร) : </span>
                <span className="font-bold">{bahtText(subtotal)}</span>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <span className="text-text-muted">จำนวนรวม</span>
                <span className="tabular-nums">{totalQty.toLocaleString('th-TH')}</span>
                <span className="text-text-muted">รวมเงิน</span>
                <span className="tabular-nums font-bold pr-1" style={{ minWidth: 80, textAlign: 'right' }}>
                  {fmt(subtotal)}
                </span>
              </div>
            </div>

            {/* Signature line + totals */}
            <div className="grid grid-cols-2 gap-6 mt-4" style={{ fontSize: 12.5 }}>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-text-muted shrink-0">ผู้รับสินค้า</span>
                  <span className="flex-1 border-b border-dotted border-black h-4" />
                </div>
              </div>
              <div>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="text-text-muted py-0.5">ภาษี</td>
                      <td className="text-right py-0.5 tabular-nums font-semibold">{fmt(vat)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #000' }}>
                      <td className="text-text-muted py-1 font-semibold">ยอดสุทธิ</td>
                      <td className="text-right py-1 tabular-nums font-bold" style={{ color: NAVY }}>
                        {fmt(netTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note */}
            <div className="mt-5 space-y-1 text-c2 leading-relaxed" style={{ fontSize: 11.5 }}>
              <div>
                <span className="font-semibold">หมายเหตุ</span>{'  '}
                {note ?? 'เอกสารการขายเพื่อสอบฉบับนี้ กำหนดให้ผู้รับสินค้าตรวจสอบก่อน เมื่อตกลงซื้อ ทางบริษัทจึงจะออกใบกำกับภาษีและใบเสร็จรับเงิน กรรมสิทธิ์ในสินค้านี้ยังคงถือเป็นของผู้ขาย จนกว่าผู้ซื้อจะชำระค่าสินค้าครบถ้วน'}
              </div>
              <div className="font-semibold">
                ** สินค้าซื้อเกิน 7 วัน ไม่รับเปลี่ยน (กรณีเปลี่ยน สินค้าต้องอยู่ในสภาพสมบูรณ์)
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer (hidden when printing) ── */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center gap-3 shrink-0 prep-slip-chrome">
          <button type="button" onClick={onClose}
            className="h-12 px-6 rounded-[12px] border border-gray-300 bg-white text-s2 text-text-primary hover:bg-gray-50 transition">
            ปิด
          </button>
          <div className="flex-1" />
          <button type="button"
            onClick={downloadAsPdf}
            disabled={busy}
            className="h-12 px-6 rounded-[12px] border border-gray-300 bg-white text-s2 text-text-primary hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            ดาวน์โหลด PDF
          </button>
          <button type="button" onClick={() => window.print()}
            className="h-12 px-8 rounded-[12px] text-s2 font-bold transition hover:brightness-95 flex items-center gap-2"
            style={{ backgroundColor: YELLOW, color: NAVY }}>
            <Printer className="w-4 h-4" /> พิมพ์เอกสาร
          </button>
        </div>
      </div>

      {/* Print-only CSS — hides modal chrome and renders the sheet at A4 size. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .prep-slip-root, .prep-slip-root * { visibility: visible !important; }
          .prep-slip-root { position: static !important; }
          .prep-slip-backdrop, .prep-slip-chrome { display: none !important; }
          .prep-slip-dialog {
            position: absolute !important;
            inset: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .prep-slip-scroll {
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .prep-slip-sheet {
            box-shadow: none !important;
            max-width: none !important;
            padding: 16mm 14mm !important;
          }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>
    </div>
  );
}
