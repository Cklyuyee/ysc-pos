import { useState } from 'react';
import { X, AlertTriangle, Ban } from 'lucide-react';

const CANCEL_REASONS = [
  'ลูกค้าเปลี่ยนใจ',
  'สินค้าไม่ตรงความต้องการ',
  'ราคาไม่ตรงกับที่แจ้ง',
  'ทดสอบระบบ',
  'อื่น ๆ',
];

interface Props {
  open: boolean;
  billId: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function CancelBillDialog({ open, billId, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');

  const handleConfirm = () => {
    const finalReason = reason === 'อื่น ๆ' ? custom.trim() || 'อื่น ๆ' : reason;
    onConfirm(finalReason);
    setReason('');
    setCustom('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Ban className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="text-base font-bold text-neutral-900">ยกเลิกบิล</div>
              <div className="text-xs text-neutral-400">{billId}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-700">
              การยกเลิกบิลจะ<span className="font-bold">ลบรายการสินค้าทั้งหมด</span>ออกจากระบบ
              และไม่สามารถกู้คืนได้ หากต้องการกลับมาใช้ภายหลัง กรุณาใช้ <span className="font-bold">พักบิล</span> แทน
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-neutral-600">เหตุผลการยกเลิก</label>
            <div className="flex flex-col gap-1.5">
              {CANCEL_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`flex items-center gap-3 h-10 px-4 rounded-xl border-2 text-sm font-medium text-left transition ${
                    reason === r
                      ? 'border-rose-400 bg-rose-50 text-rose-800'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${reason === r ? 'border-rose-500 bg-rose-500' : 'border-neutral-300'}`}>
                    {reason === r && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  {r}
                </button>
              ))}
            </div>
            {reason === 'อื่น ๆ' && (
              <input
                autoFocus
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="ระบุเหตุผล..."
                className="w-full h-10 px-3 border-2 border-neutral-200 rounded-xl text-sm outline-none focus:border-rose-400 transition mt-1"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center gap-3">
          <button onClick={onClose}
            className="flex-none h-11 px-5 rounded-xl border-2 border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition">
            กลับไป
          </button>
          <button onClick={handleConfirm} disabled={!reason}
            className="flex-1 h-11 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: reason ? '#EF4444' : '#E5E7EB', color: reason ? 'white' : '#9CA3AF' }}>
            <Ban className="w-4 h-4" /> ยืนยันยกเลิกบิล
          </button>
        </div>
      </div>
    </div>
  );
}
