import { useState } from 'react';
import { X, AlertTriangle, Ban } from 'lucide-react';

const NAVY = '#0B1E8A';

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[420px] mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
              <Ban className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-h5 font-bold text-white">ยกเลิกบิล</div>
              <div className="text-c2 text-white/60">{billId}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-c3 text-rose-700">
              การยกเลิกบิลจะ<span className="font-bold">ลบรายการสินค้าทั้งหมด</span>ออกจากระบบ
              และไม่สามารถกู้คืนได้ หากต้องการกลับมาใช้ภายหลัง กรุณาใช้ <span className="font-bold">พักบิล</span> แทน
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">เหตุผลการยกเลิก</label>
            <div className="flex flex-col gap-1.5">
              {CANCEL_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`flex items-center gap-3 h-10 px-4 rounded-[12px] border text-c3 font-medium text-left transition ${
                    reason === r
                      ? 'border-rose-400 bg-rose-50 text-rose-800'
                      : 'border-gray-300 text-neutral-600 hover:border-gray-400 hover:bg-neutral-50'
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
                className="w-full h-12 px-4 border border-gray-300 rounded-[12px] text-b3 outline-none focus:border-brand-navy transition mt-1"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition">
            กลับไป
          </button>
          <button onClick={handleConfirm} disabled={!reason}
            className="flex-[2] h-12 rounded-[12px] text-h5 font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: reason ? '#FF0000' : '#E5E7EA', color: reason ? 'white' : '#9EA2AE' }}>
            <Ban className="w-4 h-4" /> ยืนยันยกเลิกบิล
          </button>
        </div>
      </div>
    </div>
  );
}
