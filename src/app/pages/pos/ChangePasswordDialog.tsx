import { useState } from 'react';
import { Eye, EyeOff, KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { changePassword as apiChangePassword } from '../../../services/authApi';

const NAVY = '#0B1E8A';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ChangePasswordDialog({ open, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const reset = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setShowCurrent(false); setShowNew(false); setShowConfirm(false);
    setStatus('idle'); setErrorMsg('');
  };

  const handleClose = () => { reset(); onClose(); };

  const validate = (): string | null => {
    if (!currentPassword) return 'กรุณากรอกรหัสผ่านปัจจุบัน';
    if (!newPassword) return 'กรุณากรอกรหัสผ่านใหม่';
    if (newPassword.length < 8) return 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร';
    if (newPassword === currentPassword) return 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน';
    if (newPassword !== confirmPassword) return 'รหัสผ่านใหม่ไม่ตรงกัน';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); setStatus('error'); return; }

    setStatus('loading');
    setErrorMsg('');
    try {
      await apiChangePassword(currentPassword, newPassword);
      setStatus('success');
      // auto-close after 2s
      setTimeout(() => { handleClose(); }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      // better-auth returns "Invalid password" when current password wrong
      const friendly =
        msg.toLowerCase().includes('invalid') ? 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
        : msg.toLowerCase().includes('same') ? 'รหัสผ่านใหม่ต้องไม่ซ้ำกับเดิม'
        : msg;
      setErrorMsg(friendly);
      setStatus('error');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[440px] mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center gap-2 text-white text-h5">
            <KeyRound className="w-5 h-5" /> เปลี่ยนรหัสผ่าน
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <div className="text-h4 text-text-primary">เปลี่ยนรหัสผ่านสำเร็จ</div>
            <div className="text-b3 text-text-secondary text-center">
              รหัสผ่านของคุณได้รับการอัปเดตแล้ว
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Current password */}
            <div className="space-y-1.5">
              <label className="text-c1 text-text-secondary">รหัสผ่านปัจจุบัน</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => { setCurrentPassword(e.target.value); setStatus('idle'); setErrorMsg(''); }}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  autoComplete="current-password"
                  className="w-full h-12 pl-4 pr-11 border border-gray-300 rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-c1 text-text-secondary">รหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setStatus('idle'); setErrorMsg(''); }}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  autoComplete="new-password"
                  className="w-full h-12 pl-4 pr-11 border border-gray-300 rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Strength hint */}
              {newPassword.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {[4, 6, 8, 12].map((threshold, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        newPassword.length >= threshold
                          ? i < 2 ? 'bg-red-400' : i < 3 ? 'bg-yellow-400' : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-c3 text-text-muted ml-1">
                    {newPassword.length < 6 ? 'อ่อน' : newPassword.length < 8 ? 'พอใช้' : newPassword.length < 12 ? 'ดี' : 'แข็งแกร่ง'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-c1 text-text-secondary">ยืนยันรหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setStatus('idle'); setErrorMsg(''); }}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  autoComplete="new-password"
                  className={`w-full h-12 pl-4 pr-11 border rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-400 bg-red-50'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-green-400'
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {status === 'error' && errorMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-b4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-[2] h-12 rounded-[12px] text-h5 text-white transition hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: NAVY }}
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </span>
                ) : 'บันทึก'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
