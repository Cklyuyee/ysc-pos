import { useEffect, useState } from 'react';
import { Play, Clock, User, IdCard } from 'lucide-react';
import type { Customer } from '../../../data/customers';
import type { Product } from '../../api/mock/products';

const NAVY = '#0B1E8A';

export interface HeldBill {
  id: string;
  heldAt: Date;
  customer: Customer | null;
  items: { product: Product; qty: number; fulfillment: 'delivery' | 'pickup' }[];
  total: number;
}

interface Props {
  open: boolean;
  bills: HeldBill[];
  onClose: () => void;
  onRestore: (bill: HeldBill) => void;
  onDelete: (billId: string) => void;
}

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });

const fmtTotal = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { maximumFractionDigits: 0 });

export function HeldBillsDialog({ open, bills, onClose, onRestore }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSelectedId(bills[0]?.id ?? null);
  }, [open, bills]);

  if (!open) return null;

  const handleConfirm = () => {
    const bill = bills.find(b => b.id === selectedId);
    if (bill) { onRestore(bill); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[680px] mx-4 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Navy hero header */}
        <div className="flex flex-col items-center text-center px-6 pt-7 pb-6" style={{ backgroundColor: NAVY }}>
          <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center mb-4">
            <Play className="w-9 h-9 text-white fill-white" strokeWidth={0} />
          </div>
          <div className="text-h3 text-white">ดึงบิลจากรายการพักบิล</div>
          <div className="text-b3 text-white/80 mt-1.5">เลือกบิลเพื่อทำรายการต่อ</div>
        </div>

        {/* Body — bill list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-bg-page-2">
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
              <Clock className="w-10 h-10 opacity-30" />
              <div className="text-b3">ไม่มีบิลที่พักไว้</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bills.map(bill => {
                const selected = selectedId === bill.id;
                const itemCount = bill.items.length;
                return (
                  <button
                    key={bill.id}
                    onClick={() => setSelectedId(bill.id)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-[12px] border-2 transition text-left ${
                      selected
                        ? 'border-brand-navy bg-white shadow-[var(--shadow-card)]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Time chip */}
                    <div className="w-14 h-14 rounded-[12px] bg-bg-page flex flex-col items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-text-secondary" strokeWidth={2.2} />
                      <span className="text-c2 text-text-secondary tabular-nums leading-none mt-1">
                        {fmtTime(bill.heldAt)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-h5 text-text-primary tabular-nums truncate">{bill.id}</div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="flex items-center gap-1.5 text-c1 text-text-secondary">
                          <User className="w-4 h-4" />
                          {bill.customer?.name ?? 'Walk-in'}
                        </span>
                        {bill.customer?.code && (
                          <span className="flex items-center gap-1.5 text-c1 text-text-secondary">
                            <IdCard className="w-4 h-4" />
                            {bill.customer.code}
                          </span>
                        )}
                      </div>
                      <div className="text-c1 text-text-secondary mt-1">
                        จำนวน : {itemCount} รายการ
                      </div>
                    </div>

                    {/* Right total */}
                    <div className="text-right shrink-0">
                      <div className="text-h4 text-brand-navy tabular-nums">{fmtTotal(bill.total)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-bg-page border-t border-gray-200 flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="flex-[2] h-12 rounded-[12px] text-h5 text-white transition hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: NAVY }}
          >
            ยืนยันการดึงบิล
          </button>
        </div>
      </div>
    </div>
  );
}
