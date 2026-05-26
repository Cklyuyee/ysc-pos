import { Ban, Pause, RefreshCw, ShoppingCart } from 'lucide-react';

const NAVY = '#0B1E8A';

export type CartPendingAction = 'change-customer' | 'hold-bill' | 'cancel-bill';

interface Props {
  open: boolean;
  onClose: () => void;
  onAction: (action: CartPendingAction) => void;
}

export function CartPendingDialog({ open, onClose, onAction }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[560px] mx-4 flex flex-col overflow-hidden">

        <div className="flex flex-col items-center text-center px-6 pt-8 pb-4">
          {/* Icon */}
          <div className="w-20 h-20 flex items-center justify-center mb-5">
            <ShoppingCart className="w-14 h-14" style={{ color: NAVY }} strokeWidth={1.5} />
          </div>

          <div className="text-h3 text-text-primary">มีรายการสินค้าค้างอยู่</div>
          <div className="text-b3 text-text-secondary mt-2">ต้องการดำเนินการอย่างไร?</div>

          {/* 3 action buttons */}
          <div className="grid grid-cols-3 gap-3 w-full mt-6">
            <button
              type="button"
              onClick={() => { onAction('change-customer'); onClose(); }}
              className="flex flex-col items-center justify-center min-h-[88px] py-3 rounded-[12px] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
            >
              <span className="text-h5 leading-none mb-1" style={{ color: NAVY }}>F2</span>
              <span className="flex items-center gap-1.5 text-b4 text-black leading-none">
                <RefreshCw className="w-4 h-4" /> เปลี่ยนลูกค้า
              </span>
            </button>

            <button
              type="button"
              onClick={() => { onAction('hold-bill'); onClose(); }}
              className="flex flex-col items-center justify-center min-h-[88px] py-3 rounded-[12px] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
            >
              <span className="text-h5 leading-none mb-1" style={{ color: NAVY }}>F3</span>
              <span className="flex items-center gap-1.5 text-b4 text-black leading-none">
                <Pause className="w-4 h-4" /> พักบิล
              </span>
            </button>

            <button
              type="button"
              onClick={() => { onAction('cancel-bill'); onClose(); }}
              className="flex flex-col items-center justify-center min-h-[88px] py-3 rounded-[12px] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
            >
              <span className="text-h5 leading-none mb-1" style={{ color: NAVY }}>F5</span>
              <span className="flex items-center gap-1.5 text-b4 text-black leading-none">
                <Ban className="w-4 h-4" /> ยกเลิกบิล
              </span>
            </button>
          </div>
        </div>

        {/* Cancel */}
        <div className="px-6 py-4 bg-bg-page">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
          >
            ยกเลิก
          </button>
        </div>

      </div>
    </div>
  );
}
