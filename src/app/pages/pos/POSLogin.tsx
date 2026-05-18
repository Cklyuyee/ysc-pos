import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signIn } from '../../../services/authApi';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

export default function POSLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 400) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-[#EAF2F8]">
      {/* LEFT — hero panel with BG image */}
      <div
        className="relative w-[48%] shrink-0 overflow-hidden rounded-[28px] m-5"
        style={{
          backgroundColor: NAVY,
          backgroundImage: "url('/bg-login.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >

        <div className="relative h-full flex flex-col p-10">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="w-[68px] h-[68px] rounded-[12px] bg-white flex items-center justify-center p-2 shadow-[var(--shadow-elev)] shrink-0">
              <img
                src="/logo-ysc.png"
                alt="YSC"
                className="w-full h-full object-contain"
                onError={e => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  img.parentElement!.innerHTML = `
                    <div class="flex flex-col items-center justify-center leading-none gap-0.5">
                      <span class="text-[11px] font-bold tracking-[0.05em]" style="color:${NAVY}">YONG</span>
                      <div class="w-7 h-7 rounded-full flex items-center justify-center" style="background:${YELLOW}">
                        <span class="text-c3 font-black" style="color:${NAVY}">Y</span>
                      </div>
                      <span class="text-[10px] font-bold tracking-[0.05em]" style="color:${NAVY}">CHAROEN</span>
                    </div>`;
                }}
              />
            </div>
            <span
              className="text-h1 tracking-tight"
              style={{ color: YELLOW }}
            >
              YSC POS
            </span>
          </div>

          {/* Headline at bottom */}
          <div className="mt-auto">
            <h1 className="text-[62px] font-extrabold text-white leading-[1.1] tracking-tight">
              เข้าสู่ระบบ<br />จัดการหน้าร้าน
            </h1>
            <p className="text-white text-h4 mt-5 leading-relaxed max-w-[640px]">
              เข้าใช้งานระบบ Smart Terminal เพื่อเริ่มการขาย<br />
              ตรวจสอบสต็อก และจัดการสมาชิก
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-[500px]">
          <div className="mb-10">
            <h2
              className="text-h1 tracking-tight whitespace-nowrap"
              style={{ color: NAVY }}
            >
              ยินดีต้อนรับกลับมา
            </h2>
            <p className="text-text-secondary text-b2 mt-2">
              กรุณากรอกข้อมูลเพื่อลงชื่อเข้าใช้
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email field */}
            <div className="flex flex-col gap-2">
              <label className="text-h5 text-text-secondary">
                ชื่อผู้ใช้หรืออีเมล
              </label>
              <div
                className={`flex items-center gap-3 h-[56px] px-5 bg-white border-2 rounded-[12px] transition-colors duration-200 ${
                  error && !email
                    ? 'border-status-danger/60'
                    : 'border-gray-200 focus-within:border-brand-yellow'
                }`}
              >
                <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
                  className="flex-1 text-b2 text-text-primary placeholder:text-gray-400 outline-none bg-transparent"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-2">
              <label className="text-h5 text-text-secondary">
                รหัสผ่าน
              </label>
              <div
                className={`flex items-center gap-3 h-[56px] px-5 bg-white border-2 rounded-[12px] transition-colors duration-200 ${
                  error && !password
                    ? 'border-status-danger/60'
                    : 'border-gray-200 focus-within:border-brand-yellow'
                }`}
              >
                <Lock className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="กรอกรหัสผ่าน"
                  className="flex-1 text-b2 text-text-primary placeholder:text-gray-400 outline-none bg-transparent"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="text-gray-400 hover:text-text-primary transition-colors duration-200 shrink-0"
                  aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-status-danger text-c3 -mt-1">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 h-[56px] w-full rounded-[12px] text-h5 transition-[background-color,box-shadow,transform] duration-200 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 shadow-[var(--shadow-card)]"
              style={{ backgroundColor: YELLOW, color: NAVY }}
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>เข้าสู่ระบบ <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-6">
            <span className="text-b3 text-text-muted">
              เฉพาะบุคลากรที่ได้รับอนุญาตเท่านั้น
            </span>
            <button
              type="button"
              className="text-b3 text-brand-blue hover:underline"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
