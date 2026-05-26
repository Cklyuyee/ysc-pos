import { useEffect, useState } from 'react';
import { Pause, Check, Search, RefreshCw, LayoutGrid } from 'lucide-react';

const NAVY = '#0B1E8A';

type Step = 'confirm' | 'success';
export type HoldNextAction = 'search' | 'change' | 'menu';

interface Props {
  open: boolean;
  onCancel: () => void;
  /** Called when user confirms holding the bill — should perform the actual hold. */
  onConfirm: () => void | Promise<void>;
  /** Called when user picks a next action on the success step. */
  onNextAction?: (action: HoldNextAction) => void;
}

export function HoldBillDialog({ open, onCancel, onConfirm, onNextAction }: Props) {
  const [step, setStep] = useState<Step>('confirm');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep('confirm');
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      setStep('success');
    } finally {
      setBusy(false);
    }
  };

  const handleAction = (action: HoldNextAction) => {
    onNextAction?.(action);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[560px] mx-4 flex flex-col overflow-hidden">

        {step === 'confirm' ? (
          <>
            <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
              <div className="w-20 h-20 rounded-full border-2 border-status-warning flex items-center justify-center mb-5">
                <Pause className="w-10 h-10 text-status-warning" strokeWidth={2.5} />
              </div>
              <div className="text-h3 text-text-primary">พักรายการบิลนี้</div>
              <div className="text-b3 text-text-secondary mt-2">
                รายการสินค้าจะถูกเก็บไว้ชั่วคราว<br />
                คุณสามารถดึงกลับมาทำรายการต่อได้ภายหลัง
              </div>
            </div>

            <div className="px-6 py-4 bg-bg-page flex items-center gap-3">
              <button
                onClick={onCancel}
                disabled={busy}
                className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="flex-[2] h-12 rounded-[12px] text-h5 text-white transition hover:brightness-95 disabled:opacity-60"
                style={{ backgroundColor: '#F2994A' }}
              >
                {busy ? (
                  <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'ยืนยันพักบิล'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
              <div className="w-20 h-20 rounded-full border-2 border-status-success flex items-center justify-center mb-5">
                <Check className="w-10 h-10 text-status-success" strokeWidth={3} />
              </div>
              <div className="text-h3 text-text-primary">พักบิลสำเร็จแล้ว!</div>
              <div className="text-b3 text-text-secondary mt-2">
                เลือกขั้นตอนถัดไปที่คุณต้องการทำ
              </div>

              {/* 3 action buttons */}
              <div className="grid grid-cols-3 gap-3 w-full mt-6">
                <button
                  onClick={() => handleAction('search')}
                  className="flex flex-col items-center justify-center min-h-[88px] py-3 rounded-[12px] border border-gray-200 bg-white hover:bg-bg-page-2 transition"
                >
                  <span className="text-h5 leading-none mb-1" style={{ color: NAVY }}>F1</span>
                  <span className="flex items-center gap-1.5 text-b4 text-black leading-none">
                    <Search className="w-5 h-5" /> ค้นหาสมาชิก
                  </span>
                </button>
                <button
                  onClick={() => handleAction('change')}
                  className="flex flex-col items-center justify-center min-h-[88px] py-3 rounded-[12px] border border-gray-200 bg-white hover:bg-bg-page-2 transition"
                >
                  <span className="text-h5 leading-none mb-1" style={{ color: NAVY }}>F2</span>
                  <span className="flex items-center gap-1.5 text-b4 text-black leading-none">
                    <RefreshCw className="w-5 h-5" /> เปลี่ยนลูกค้า
                  </span>
                </button>
                <button
                  onClick={() => handleAction('menu')}
                  className="flex flex-col items-center justify-center min-h-[88px] py-3 rounded-[12px] border border-gray-200 bg-white hover:bg-bg-page-2 transition"
                >
                  <span className="text-h5 leading-none mb-1" style={{ color: NAVY }}>F6</span>
                  <span className="flex items-center gap-1.5 text-b4 text-black leading-none">
                    <LayoutGrid className="w-5 h-5" /> เมนูอื่นๆ
                  </span>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 bg-bg-page">
              <button
                onClick={onCancel}
                className="w-full h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
              >
                ยกเลิก
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
