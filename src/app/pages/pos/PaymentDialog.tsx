import { useEffect, useRef, useState } from 'react';
import {
  X, Banknote, CreditCard, QrCode, Building2,
  Check, CheckCircle2, AlertTriangle, ChevronRight, ArrowRight,
} from 'lucide-react';
import type { Customer } from '../../../data/customers';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

type PayMethod = 'cash' | 'card' | 'credit' | 'qr';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function roundUpQuick(amount: number): number[] {
  const denoms = [20, 50, 100, 500, 1000];
  const extras: number[] = [];
  denoms.forEach(d => {
    const rounded = Math.ceil(amount / d) * d;
    if (rounded !== amount && !extras.includes(rounded) && extras.length < 4) {
      extras.push(rounded);
    }
  });
  return extras;
}

function MethodTab({ active, icon: Icon, label, onClick, disabled }: {
  active: boolean; icon: typeof Banknote; label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-[12px] border-2 text-c3 font-bold transition flex-1 ${
        active
          ? 'border-amber-400 bg-amber-50 text-amber-800'
          : disabled
          ? 'border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed'
          : 'border-neutral-200 bg-white text-neutral-600 hover:border-amber-300 hover:bg-amber-50/50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-c3">{label}</span>
    </button>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (method: PayMethod, received?: number) => void;
  totalAmount: number;
  customer: Customer | null;
  /** When true, allow credit payment even if remaining < totalAmount
   *  (temporary credit approval request has been submitted). */
  creditApprovalSubmitted?: boolean;
}

export function PaymentDialog({ open, onClose, onConfirm, totalAmount, customer, creditApprovalSubmitted = false }: Props) {
  const [method, setMethod] = useState<PayMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [done, setDone] = useState(false);
  const cashRef = useRef<HTMLInputElement>(null);

  const creditRemaining = customer
    ? Math.max(0, (customer.creditLimit ?? 0) - (customer.creditUsed ?? 0))
    : 0;
  const creditInsufficient = method === 'credit' && creditRemaining < totalAmount && !creditApprovalSubmitted;

  useEffect(() => {
    if (!open) return;
    setMethod('cash');
    setCashReceived('');
    setDone(false);
    setTimeout(() => cashRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    if (method === 'cash') setTimeout(() => cashRef.current?.focus(), 60);
  }, [method]);

  const parsedCash = parseFloat(cashReceived.replace(/,/g, '')) || 0;
  const change = parsedCash - totalAmount;

  const canConfirm = (() => {
    if (done) return false;
    if (method === 'cash') return parsedCash >= totalAmount;
    if (method === 'credit') return !creditInsufficient;
    return true;
  })();

  const handleConfirm = () => {
    if (!canConfirm) return;
    setDone(true);
    setTimeout(() => {
      onConfirm(method, method === 'cash' ? parsedCash : undefined);
      onClose();
    }, 1200);
  };

  if (!open) return null;

  const quickAmounts = roundUpQuick(totalAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[560px] mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-white/10 shrink-0" style={{ backgroundColor: NAVY }}>
          <div>
            <div className="text-h5 font-bold text-white">ชำระเงิน</div>
            <div className="text-c2 text-white/60 mt-0.5">เลือกวิธีชำระเงินและยืนยันการชำระ</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount summary */}
        <div className="px-6 py-4 border-b border-neutral-100" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-c3 text-white/60">ยอดชำระสุทธิ</div>
              {customer && <div className="text-c3 text-white/50 mt-0.5">{customer.name} • {customer.priceTier}</div>}
            </div>
            <div className="text-h3 font-extrabold tabular-nums" style={{ color: YELLOW }}>
              {fmt(totalAmount)}
            </div>
          </div>
        </div>

        {/* Method tabs */}
        <div className="px-6 pt-5 pb-3">
          <div className="text-c3 font-bold text-neutral-500 uppercase tracking-wider mb-3">วิธีชำระเงิน</div>
          <div className="flex gap-2">
            <MethodTab active={method === 'cash'}   icon={Banknote}   label="เงินสด"       onClick={() => setMethod('cash')} />
            <MethodTab active={method === 'card'}   icon={CreditCard}  label="บัตรเครดิต"  onClick={() => setMethod('card')} />
            <MethodTab active={method === 'qr'}     icon={QrCode}      label="QR / โอน"    onClick={() => setMethod('qr')} />
          </div>
        </div>

        {/* Method body */}
        <div className="px-6 pb-5 flex flex-col gap-4">
          {method === 'cash' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-c1 text-text-secondary block mb-1.5">รับเงินมา</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    ref={cashRef}
                    type="number" min={0} step="0.01"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    placeholder="0.00"
                    className="w-full h-12 pl-9 pr-4 border border-gray-300 rounded-[12px] text-b3 font-bold text-right tabular-nums outline-none focus:border-brand-navy transition"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setCashReceived(totalAmount.toFixed(2))}
                  className="flex items-center gap-1 px-3 h-8 rounded-lg border border-neutral-200 text-c3 font-semibold text-neutral-600 hover:bg-neutral-50 transition">
                  พอดี
                </button>
                {quickAmounts.map(a => (
                  <button key={a} onClick={() => setCashReceived(a.toString())}
                    className="px-3 h-8 rounded-lg border border-amber-200 bg-amber-50 text-c3 font-bold text-amber-800 hover:bg-amber-100 transition tabular-nums">
                    {fmtInt(a)}
                  </button>
                ))}
              </div>
              {parsedCash > 0 && (
                <div className={`rounded-xl p-4 flex items-center justify-between ${change < 0 ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <span className={`text-c3 font-bold ${change < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {change < 0 ? 'ขาดอีก' : 'เงินทอน'}
                  </span>
                  <span className={`text-h5 font-extrabold tabular-nums ${change < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {fmt(Math.abs(change))}
                  </span>
                </div>
              )}
            </div>
          )}

          {method === 'card' && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-neutral-500" />
                </div>
                <div>
                  <div className="text-c3 font-bold text-neutral-800">รูดบัตรเครดิต / เดบิต</div>
                  <div className="text-c3 text-neutral-500">เสียบหรือแตะบัตรที่เครื่อง EDC</div>
                </div>
              </div>
              <div className="mt-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-c3 text-amber-800 flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                รอให้เครื่องรูดบัตรยืนยันแล้วกด "ยืนยันชำระเงิน"
              </div>
              <div className="text-right text-h5 font-extrabold text-neutral-900 tabular-nums mt-1">{fmt(totalAmount)}</div>
            </div>
          )}

          {method === 'credit' && (() => {
            const wouldExceed = creditRemaining < totalAmount;
            const usingTempApproval = wouldExceed && creditApprovalSubmitted;
            return (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-c3 text-neutral-500 font-medium">วงเงินคงเหลือ</div>
                    <div className={`text-h5 font-extrabold tabular-nums mt-0.5 ${creditInsufficient ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {fmt(creditRemaining)}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">วงเงินทั้งหมด {fmt(customer?.creditLimit ?? 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-c3 text-neutral-500 font-medium">ยอดที่จะตัด</div>
                    <div className="text-b3 font-bold text-neutral-900 tabular-nums mt-0.5">{fmt(totalAmount)}</div>
                    {!wouldExceed && (
                      <div className="text-[11px] text-emerald-600 mt-0.5">คงเหลือ {fmt(creditRemaining - totalAmount)}</div>
                    )}
                  </div>
                </div>
                {creditInsufficient && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-c3 font-bold text-rose-700">วงเงินไม่เพียงพอ</div>
                      <div className="text-c3 text-rose-600 mt-0.5">
                        ขาดอีก {fmt(totalAmount - creditRemaining)} — กรุณาเลือกวิธีชำระอื่น หรือลดยอดในบิล
                      </div>
                    </div>
                  </div>
                )}
                {usingTempApproval && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-c3 font-bold text-emerald-700">ส่งคำขออนุมัติวงเงินชั่วคราวแล้ว</div>
                      <div className="text-c3 text-emerald-700 mt-0.5">
                        ยอดเกินวงเงิน {fmt(totalAmount - creditRemaining)} — รอผู้มีอำนาจพิจารณา สามารถยืนยันชำระเงินได้
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {method === 'qr' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 flex flex-col items-center gap-3">
                <div className="w-36 h-36 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-neutral-300" />
                </div>
                <div className="text-c3 font-bold text-neutral-700">แสกน QR เพื่อชำระ</div>
                <div className="text-c3 text-neutral-500">หรือโอนมาที่บัญชี YSC Co., Ltd. — ธนาคารกสิกรไทย</div>
                <div className="w-full rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-c3 text-amber-800 flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  หลังโอนแล้ว กด "ยืนยันชำระเงิน" เพื่อบันทึก
                </div>
              </div>
              <div className="text-right text-h5 font-extrabold text-neutral-900 tabular-nums">{fmt(totalAmount)}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition">
            ยกเลิก
          </button>
          <button onClick={handleConfirm} disabled={!canConfirm}
            className="flex-[2] h-12 rounded-[12px] text-h5 font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: done ? '#22c55e' : canConfirm ? YELLOW : '#E5E7EB', color: done ? 'white' : canConfirm ? NAVY : '#9CA3AF' }}>
            {done ? <><Check className="w-4 h-4" /> ชำระเงินสำเร็จ!</> : <><ChevronRight className="w-4 h-4" /> ยืนยันชำระเงิน</>}
          </button>
        </div>
      </div>
    </div>
  );
}
