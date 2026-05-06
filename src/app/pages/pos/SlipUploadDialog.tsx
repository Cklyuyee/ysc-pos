import { useEffect, useRef, useState } from 'react';
import { X, Upload, Check, AlertCircle, Image as ImageIcon, Building2 } from 'lucide-react';
import { uploadSlip } from '../../../services/ordersApi';
import { getBankAccounts, type ApiBankAccount } from '../../../services/configApi';

const NAVY = '#14264E';
const YELLOW = '#EFB419';

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  open: boolean;
  orderId: string | null;
  totalAmount: number;
  onClose: () => void;
  onUploaded: () => void;
}

export function SlipUploadDialog({ open, orderId, totalAmount, onClose, onUploaded }: Props) {
  const [banks, setBanks] = useState<ApiBankAccount[]>([]);
  const [bankId, setBankId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null); setPreview(''); setDone(false); setError(''); setBankId('');
      return;
    }
    getBankAccounts()
      .then(b => {
        setBanks(b);
        if (b[0]) setBankId(b[0].id);
      })
      .catch(() => setBanks([]));
  }, [open]);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('กรุณาเลือกไฟล์รูปภาพ'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('ไฟล์ต้องเล็กกว่า 5 MB'); return; }
    setFile(f);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file || !orderId || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await uploadSlip(orderId, file, {
        bankAccountId: bankId || undefined,
        amount: totalAmount,
        transferredAt: new Date().toISOString(),
      });
      setDone(true);
      setTimeout(() => { onUploaded(); onClose(); }, 1100);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'อัพโหลดไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <div className="text-lg font-bold" style={{ color: NAVY }}>อัพโหลดสลิปโอนเงิน</div>
            <div className="text-xs text-neutral-400 mt-0.5">ยอด {fmt(totalAmount)}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {banks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-neutral-600">บัญชีที่โอนไป</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <select
                  value={bankId}
                  onChange={e => setBankId(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 border-2 border-neutral-200 rounded-xl text-sm outline-none focus:border-amber-400 transition appearance-none bg-white"
                >
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} • {b.accountNumber} ({b.accountName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-neutral-600">รูปสลิป</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />
            {preview ? (
              <div className="relative rounded-xl border-2 border-neutral-200 overflow-hidden">
                <img src={preview} alt="slip" className="w-full max-h-[280px] object-contain bg-neutral-50" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 h-8 rounded-lg bg-white/90 backdrop-blur border border-neutral-200 text-xs font-semibold hover:bg-white transition"
                >
                  เปลี่ยนรูป
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-neutral-300 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition text-neutral-500"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm font-semibold">คลิกเพื่อเลือกรูปสลิป</span>
                <span className="text-[11px] text-neutral-400">JPG / PNG ไม่เกิน 5 MB</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700">{error}</div>
            </div>
          )}

          {!orderId && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <ImageIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">ไม่พบ Order ID — กรุณาทำรายการชำระเงินใหม่อีกครั้ง</div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex items-center gap-3">
          <button onClick={onClose}
            className="flex-none h-11 px-5 rounded-xl border-2 border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition">
            ข้าม
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || !orderId || submitting || done}
            className="flex-1 h-11 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: done ? '#22c55e' : YELLOW, color: done ? 'white' : NAVY }}
          >
            {done
              ? <><Check className="w-4 h-4" /> อัพโหลดสำเร็จ!</>
              : submitting
                ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <><Upload className="w-4 h-4" /> อัพโหลดสลิป</>}
          </button>
        </div>
      </div>
    </div>
  );
}
