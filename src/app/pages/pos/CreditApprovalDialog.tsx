import { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';

const NAVY   = '#0B1E8A';
const ORANGE = '#F59E0B';
const YELLOW = '#FFC518';

const REASONS = [
  'ลูกค้าประจำ มีประวัติชำระดี',
  'ได้รับการอนุมัติจากผู้จัดการ',
  'ลูกค้าชำระสดส่วนที่เกิน',
  'คำสั่งซื้อฉุกเฉิน / เร่งด่วน',
  'อื่นๆ',
];

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customerName: string;
  customerCode: string;
  remaining: number;
  cartTotal: number;
}

export function CreditApprovalDialog({
  open, onClose, onConfirm,
  customerName, customerCode, remaining, cartTotal,
}: Props) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const overAmount = cartTotal - remaining;

  const handleConfirm = async () => {
    if (!reason || busy) return;
    setBusy(true);
    try {
      // TODO: POST /credit-approvals when backend endpoint is ready
      await new Promise(r => setTimeout(r, 600)); // simulate network
      onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-[640px] mx-4 overflow-hidden">

        {/* Yellow header bar */}
        <div className="relative px-6 py-5" style={{ backgroundColor: YELLOW }}>
          <div className="flex items-start gap-3 pr-10">
            <AlertTriangle className="w-7 h-7 shrink-0 mt-0.5" style={{ color: '#1F2937' }} strokeWidth={2.5} />
            <div>
              <div className="text-h4 font-bold" style={{ color: '#1F2937' }}>
                ขออนุมัติวงเงินเครดิต
              </div>
              <div className="text-c1 mt-1" style={{ color: '#374151' }}>
                คำสั่งซื้อนี้เกินวงเงินเครดิตที่มีอยู่ กรุณากรอกข้อมูลเพื่อส่งคำขออนุมัติ
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/10 transition"
            style={{ color: '#1F2937' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-6 pb-6 space-y-5">

          {/* Credit detail box */}
          <div className="rounded-[14px] border-2 border-amber-200 px-5 py-4" style={{ backgroundColor: '#FEF8E1' }}>
            <div className="text-c1 font-bold mb-3" style={{ color: ORANGE }}>รายละเอียดวงเงิน</div>
            <div className="space-y-2.5 text-c1">
              <div className="flex items-start justify-between">
                <span className="text-text-secondary">ลูกค้า:</span>
                <div className="text-right">
                  <div className="text-text-primary font-medium">{customerName}</div>
                  <div className="text-text-muted text-c2">{customerCode}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">วงเงินคงเหลือ:</span>
                <span className="text-text-primary font-bold tabular-nums">{fmt(remaining)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">มูลค่าคำสั่งซื้อ:</span>
                <span className="font-bold tabular-nums" style={{ color: NAVY }}>{fmt(cartTotal)}</span>
              </div>
              <div className="border-t border-amber-200 pt-2.5 flex items-center justify-between">
                <span className="font-bold" style={{ color: ORANGE }}>เกินวงเงิน:</span>
                <span className="font-bold tabular-nums text-red-600">{fmt(overAmount)}</span>
              </div>
            </div>
          </div>

          {/* ประเภทการขออนุมัติ */}
          <div>
            <div className="flex items-center gap-1 text-c1 font-semibold text-text-primary mb-2">
              ประเภทการขออนุมัติ
              <span className="text-red-500">*</span>
            </div>
            <div className="rounded-[12px] border-2 px-4 py-3.5 flex items-start gap-3" style={{ borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#3B82F6' }}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-b4 font-bold text-text-primary">
                  ขออนุมัติวงเงินชั่วคราว (Temporary)
                </div>
                <div className="text-c2 text-text-secondary mt-0.5">
                  อนุมัติให้ใช้วงเงินเกินสำหรับคำสั่งซื้อนี้เท่านั้น ไม่กระทบวงเงินฐาน
                </div>
              </div>
            </div>
          </div>

          {/* เหตุผลที่ขออนุมัติ */}
          <div>
            <div className="flex items-center gap-1 text-c1 font-semibold text-text-primary mb-2">
              เหตุผลที่ขออนุมัติ
              <span className="text-red-500">*</span>
            </div>
            <div className="relative">
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full h-12 pl-4 pr-10 border rounded-[12px] text-b4 outline-none transition appearance-none bg-white cursor-pointer"
                style={{
                  borderColor: reason ? NAVY : '#D1D5DB',
                  color: reason ? '#111827' : '#9CA3AF',
                }}
              >
                <option value="">เลือกเหตุผล...</option>
                {REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center gap-3 shrink-0 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 font-bold text-text-primary hover:bg-bg-page-2 transition disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!reason || busy}
            className="flex-[2] h-12 rounded-[12px] text-h5 font-bold text-white transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0EA5E9' }}
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                กำลังส่ง...
              </span>
            ) : 'ส่งคำขออนุมัติ'}
          </button>
        </div>

      </div>
    </div>
  );
}
