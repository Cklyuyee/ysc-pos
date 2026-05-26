import { useEffect, useState } from 'react';
import { X, Trash2, CreditCard } from 'lucide-react';

export type SupervisorAuthMode = 'cancel-bill' | 'cancel-item' | 'credit-override';

interface Props {
  open: boolean;
  mode: SupervisorAuthMode;
  onClose: () => void;
  /**
   * Called when supervisor confirms with credentials.
   * Throw or reject to surface an error message in the dialog.
   * The dialog closes itself on a successful (resolved) call.
   */
  onConfirm: (credentials: { username: string; password: string }) => void | Promise<void>;
}

const COPY: Record<SupervisorAuthMode, {
  title: string; subtitle: string; confirmLabel: string;
}> = {
  'cancel-bill': {
    title: 'ยืนยันการยกเลิกบิล',
    subtitle: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อยืนยันการยกเลิกบิล',
    confirmLabel: 'ยืนยันยกเลิกบิล',
  },
  'cancel-item': {
    title: 'ยกเลิกรายการสินค้า',
    subtitle: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อยืนยันการยกเลิกรายการ',
    confirmLabel: 'ลบรายการ',
  },
  'credit-override': {
    title: 'อนุมัติเกินวงเงินเครดิต',
    subtitle: 'ยอดสั่งซื้อเกินวงเงินคงเหลือ — กรุณากรอกรหัสผ่านหัวหน้าเพื่ออนุมัติ',
    confirmLabel: 'อนุมัติ',
  },
};

export function SupervisorAuthDialog({ open, mode, onClose, onConfirm }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUsername('');
      setPassword('');
      setError('');
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const { title, subtitle, confirmLabel } = COPY[mode];
  const Icon = mode === 'cancel-item' ? Trash2 : mode === 'credit-override' ? CreditCard : X;
  const isItemMode = mode === 'cancel-item';

  const handleConfirm = async () => {
    if (!username.trim() || !password.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await onConfirm({ username: username.trim(), password });
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? 'ไม่สามารถยืนยันได้');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[560px] mx-4 flex flex-col overflow-hidden">

        {/* Red hero header */}
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-7" style={{ backgroundColor: '#FF0000' }}>
          {isItemMode ? (
            // Trash bin — no frame
            <div className="mb-4">
              <Icon className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
          ) : (
            // X — no frame
            <div className="mb-4">
              <Icon className="w-14 h-14 text-white" strokeWidth={3} />
            </div>
          )}
          <div className="text-h3 text-white">{title}</div>
          <div className="text-b3 text-white/95 mt-1.5">{subtitle}</div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">ชื่อผู้ใช้งาน</label>
            <input
              autoFocus
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="กรุณากรอกผู้ใช้งาน"
              className="w-full h-12 px-4 border border-gray-300 rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition"
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="กรุณากรอกรหัสผ่าน"
              className="w-full h-12 px-4 border border-gray-300 rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition"
              autoComplete="current-password"
              onKeyDown={e => { if (e.key === 'Enter') void handleConfirm(); }}
            />
          </div>
          {error && (
            <div className="text-c2 text-status-danger">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-bg-page flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy || !username.trim() || !password.trim()}
            className="flex-[2] h-12 rounded-[12px] text-h5 text-white transition hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FF0000' }}
          >
            {busy
              ? <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
