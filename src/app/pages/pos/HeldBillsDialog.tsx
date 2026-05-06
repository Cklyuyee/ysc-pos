import { X, Inbox, RotateCcw, Trash2, Clock, ShoppingCart } from 'lucide-react';
import type { Customer } from '../../../data/customers';
import type { Product } from '../../api/mock/products';

const NAVY = '#14264E';
const YELLOW = '#EFB419';

export interface HeldBill {
  id: string;
  heldAt: Date;
  customer: Customer | null;
  items: { product: Product; qty: number; fulfillment: 'delivery' | 'pickup' }[];
  total: number;
}

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function elapsed(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  return `${Math.floor(mins / 60)} ชั่วโมงที่แล้ว`;
}

interface Props {
  open: boolean;
  bills: HeldBill[];
  onClose: () => void;
  onRestore: (bill: HeldBill) => void;
  onDelete: (billId: string) => void;
}

export function HeldBillsDialog({ open, bills, onClose, onRestore, onDelete }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[520px] mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: NAVY }}>
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold" style={{ color: NAVY }}>บิลที่พักไว้</div>
              <div className="text-xs text-neutral-400">{bills.length} บิล รอดำเนินการ</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
              <Inbox className="w-12 h-12 opacity-20" />
              <div className="text-sm font-medium">ไม่มีบิลที่พักไว้</div>
              <div className="text-xs">กด F5 เพื่อพักบิลปัจจุบัน</div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {bills.map(bill => (
                <div key={bill.id} className="px-6 py-4 hover:bg-neutral-50 transition">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center font-bold text-sky-700 text-base shrink-0">
                      {bill.customer ? bill.customer.name.charAt(0) : <ShoppingCart className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900">
                          {bill.customer ? bill.customer.name : 'Walk-in Customer'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">{bill.id}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <ShoppingCart className="w-3 h-3" />
                          {bill.items.reduce((s, i) => s + i.qty, 0)} ชิ้น ({bill.items.length} รายการ)
                        </span>
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <Clock className="w-3 h-3" />{elapsed(bill.heldAt)}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-neutral-800 tabular-nums mt-1">{fmt(bill.total)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => onDelete(bill.id)}
                        className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-rose-100 text-neutral-400 hover:text-rose-600 flex items-center justify-center transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { onRestore(bill); onClose(); }}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition"
                        style={{ backgroundColor: YELLOW, color: NAVY }}>
                        <RotateCcw className="w-3.5 h-3.5" /> ดึงบิล
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5" style={{ marginLeft: '60px' }}>
                    {bill.items.slice(0, 4).map((item, i) => (
                      <span key={i} className="text-[11px] text-neutral-500 bg-neutral-100 rounded-md px-2 py-0.5 truncate max-w-[160px]">
                        {item.product.name} ×{item.qty}
                      </span>
                    ))}
                    {bill.items.length > 4 && (
                      <span className="text-[11px] text-neutral-400 bg-neutral-100 rounded-md px-2 py-0.5">
                        +{bill.items.length - 4} รายการ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 shrink-0 flex items-center justify-between">
          <span className="text-xs text-neutral-400">บิลที่พักไว้จะถูกลบอัตโนมัติเมื่อปิดระบบ</span>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-neutral-500 rounded-lg hover:bg-neutral-100 transition">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
