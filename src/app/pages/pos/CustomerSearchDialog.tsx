import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, UserCheck, Phone, Mail, CreditCard, UserPlus } from 'lucide-react';
import { searchCustomers, apiCustomerToCustomer } from '../../../services/customersApi';
import type { Customer } from '../../../data/customers';

const NAVY = '#14264E';
const YELLOW = '#EFB419';

const TIER_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  'Gold 1':    { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'Gold' },
  'Gold 2':    { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'Gold' },
  'Platinum 1':{ bg: 'bg-purple-100', text: 'text-purple-800', label: 'Platinum' },
  'Platinum 2':{ bg: 'bg-purple-100', text: 'text-purple-800', label: 'Platinum' },
  'Diamond':   { bg: 'bg-sky-100',    text: 'text-sky-800',    label: 'Diamond' },
  'Silver':    { bg: 'bg-neutral-100',text: 'text-neutral-600',label: 'Silver' },
};

const fmt = (n: number) =>
  '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  onRegister?: () => void;
}

export function CustomerSearchDialog({ open, onClose, onSelect, onRegister }: Props) {
  const [codeQuery, setCodeQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((code: string, name: string) => {
    const query = [code.trim(), name.trim()].filter(Boolean).join(' ');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchCustomers(query);
        setResults(res.map(apiCustomerToCustomer));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    if (!open) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      return;
    }
    setCodeQuery('');
    setNameQuery('');
    setResults([]);
    focusTimerRef.current = setTimeout(() => codeRef.current?.focus(), 50);
    doSearch('', '');
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [open]);

  const handleCodeChange = (val: string) => {
    setCodeQuery(val);
    doSearch(val, nameQuery);
  };

  const handleNameChange = (val: string) => {
    setNameQuery(val);
    doSearch(codeQuery, val);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[680px] mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <div className="text-lg font-bold" style={{ color: NAVY }}>ค้นหาสมาชิก</div>
            <div className="text-xs text-neutral-400 mt-0.5">กรอกรหัสลูกค้า หรือ ชื่อ/เบอร์โทร อย่างใดอย่างหนึ่งก็ได้</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two search inputs */}
        <div className="px-6 py-4 border-b border-neutral-100 shrink-0 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">รหัสลูกค้า</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                ref={codeRef}
                value={codeQuery}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="เช่น C101, C002..."
                className="w-full h-10 pl-9 pr-8 border-2 border-neutral-200 rounded-xl text-sm outline-none focus:border-amber-400 transition font-mono"
              />
              {codeQuery && (
                <button onClick={() => handleCodeChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">ชื่อ / เบอร์โทร / อีเมล</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={nameQuery}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="ชื่อ, 089-xxx, email..."
                className="w-full h-10 pl-9 pr-8 border-2 border-neutral-200 rounded-xl text-sm outline-none focus:border-amber-400 transition"
              />
              {nameQuery && (
                <button onClick={() => handleNameChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <Search className="w-10 h-10 mb-2 opacity-30" />
              <div className="text-sm">ไม่พบสมาชิกที่ตรงกัน</div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {results.map(c => {
                const tier = TIER_STYLE[c.tier] ?? { bg: 'bg-neutral-100', text: 'text-neutral-600', label: c.tier };
                const creditRemain = (c.creditLimit ?? 0) - (c.creditUsed ?? 0);
                return (
                  <button
                    key={c.id}
                    onClick={() => { onSelect(c); onClose(); }}
                    className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-amber-50/60 transition text-left group"
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 bg-sky-100 text-sky-700 group-hover:bg-amber-100 group-hover:text-amber-700 transition">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900 truncate">{c.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tier.bg} ${tier.text}`}>{tier.label}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{c.priceTier}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Phone className="w-3 h-3" />{c.phone}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-neutral-400 truncate">
                          <Mail className="w-3 h-3" />{c.email}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end text-xs text-neutral-500 mb-0.5">
                        <CreditCard className="w-3 h-3" />
                        <span className={creditRemain < 0 ? 'text-rose-500 font-bold' : 'text-neutral-700 font-semibold'}>
                          {fmt(creditRemain)}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400">{c.rewardPoints.toLocaleString()} pts</div>
                    </div>
                    <UserCheck className="w-4 h-4 text-neutral-300 group-hover:text-amber-500 transition shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-400">{loading ? 'กำลังค้นหา...' : `พบ ${results.length} รายการ`}</span>
          <div className="flex items-center gap-2">
            {onRegister && (
              <button
                onClick={onRegister}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border-2 transition hover:bg-amber-50"
                style={{ borderColor: YELLOW, color: NAVY }}
              >
                <UserPlus className="w-4 h-4" /> สมัครสมาชิกใหม่
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-neutral-500 rounded-lg hover:bg-neutral-100 transition">
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
