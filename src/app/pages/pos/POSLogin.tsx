import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signIn } from '../../../services/authApi';

const NAVY = '#14264E';
const YELLOW = '#EFB419';

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
    <div className="h-screen w-screen flex bg-[#EBF6FF]">
      {/* LEFT — dark hero panel */}
      <div className="relative w-[48%] shrink-0 overflow-hidden rounded-[28px] m-5" style={{ backgroundColor: '#0D0E2B' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[70%] rounded-full opacity-70"
            style={{ background: 'radial-gradient(circle, #3B4FD4 0%, #1a2a8a 40%, transparent 70%)' }} />
          <div className="absolute top-[10%] right-[-30%] w-[80%] h-[80%] rounded-full opacity-50"
            style={{ background: 'radial-gradient(circle, #C8A020 0%, #8B6010 40%, transparent 70%)' }} />
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-40 mix-blend-screen"
            style={{ background: 'radial-gradient(circle, #5B7FE8 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />
        </div>
        <div className="relative h-full flex flex-col p-10">
          <div className="flex items-center gap-4">
            <div className="w-[64px] h-[64px] rounded-[16px] bg-white flex items-center justify-center p-2 shadow-lg shrink-0">
              <img src="/logo.png" alt="YSC" className="w-full h-full object-contain"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    `<span class="text-2xl font-black" style="color:${NAVY}">Y</span>`;
                }}
              />
            </div>
            <span className="text-4xl font-extrabold" style={{ color: YELLOW }}>YSC POS</span>
          </div>
          <div className="mt-auto mb-0">
            <h1 className="text-[52px] font-extrabold text-white leading-tight">
              เข้าสู่ระบบ<br />จัดการหน้าร้าน
            </h1>
            <p className="text-white/60 text-lg mt-4 leading-relaxed">
              เข้าใช้งานระบบ Smart Terminal เพื่อเริ่มการขาย<br />
              ตรวจสอบสต็อก และจัดการสมาชิก
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="flex-1 flex items-center justify-center px-16 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <h2 className="text-[38px] font-extrabold leading-tight" style={{ color: NAVY }}>
              ยินดีต้อนรับกลับมา
            </h2>
            <p className="text-neutral-500 text-lg mt-2">กรุณากรอกข้อมูลเพื่อลงชื่อเข้าใช้</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-base font-bold text-neutral-500">ชื่อผู้ใช้หรืออีเมล</label>
              <div className={`flex items-center gap-3 h-[56px] px-4 bg-white border-2 rounded-xl transition ${error && !email ? 'border-rose-400' : 'border-neutral-200 focus-within:border-amber-400'}`}>
                <Mail className="w-5 h-5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
                  className="flex-1 text-base text-neutral-800 placeholder:text-neutral-400 outline-none bg-transparent"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-base font-bold text-neutral-500">รหัสผ่าน</label>
              <div className={`flex items-center gap-3 h-[56px] px-4 bg-white border-2 rounded-xl transition ${error && !password ? 'border-rose-400' : 'border-neutral-200 focus-within:border-amber-400'}`}>
                <Lock className="w-5 h-5 text-neutral-400 shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="กรอกรหัสผ่าน"
                  className="flex-1 text-base text-neutral-800 placeholder:text-neutral-400 outline-none bg-transparent"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="text-neutral-400 hover:text-neutral-600 transition shrink-0">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-rose-500 text-sm -mt-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 h-[52px] w-full rounded-xl font-bold text-lg transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: YELLOW, color: NAVY }}
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>เข้าสู่ระบบ <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-6 text-sm">
            <span className="text-neutral-400">เฉพาะบุคลากรที่ได้รับอนุญาตเท่านั้น</span>
            <button className="text-sky-500 hover:underline font-medium">ลืมรหัสผ่าน?</button>
          </div>
        </div>
      </div>
    </div>
  );
}
