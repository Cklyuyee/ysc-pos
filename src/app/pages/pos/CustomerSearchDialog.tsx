import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, User, UserPlus, RefreshCw } from 'lucide-react';
import { searchCustomers, apiCustomerToCustomer } from '../../../services/customersApi';
import type { Customer } from '../../../data/customers';
import { Skeleton } from '../../components/ui/Skeleton';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

const TIER_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  'Gold 1':    { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Gold' },
  'Gold 2':    { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Gold' },
  'Platinum 1':{ bg: 'bg-purple-100', text: 'text-purple-800', label: 'Platinum' },
  'Platinum 2':{ bg: 'bg-purple-100', text: 'text-purple-800', label: 'Platinum' },
  'Diamond':   { bg: 'bg-sky-100',    text: 'text-sky-800',    label: 'Diamond' },
  'Silver':    { bg: 'bg-neutral-100',text: 'text-neutral-600',label: 'Silver' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  onRegister?: () => void;
  /** "search" → "ค้นหาสมาชิก" (default). "change" → "เปลี่ยนลูกค้า" + subtitle */
  mode?: 'search' | 'change';
}

export function CustomerSearchDialog({ open, onClose, onSelect, onRegister, mode = 'search' }: Props) {
  const [codeQuery, setCodeQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searched, setSearched] = useState(false);   // true after first non-empty search
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      setErrorMsg('');
      try {
        const res = await searchCustomers(query.trim());
        setResults(res.map(apiCustomerToCustomer));
      } catch (err: unknown) {
        console.error('[CustomerSearch] failed', err);
        const status = (err as { status?: number }).status;
        const msg = (err as Error).message ?? '';
        setErrorMsg(status ? `ค้นหาไม่สำเร็จ (HTTP ${status}) — ${msg}` : `ค้นหาไม่สำเร็จ — ${msg || 'network error'}`);
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
    setSearched(false);
    setErrorMsg('');
    focusTimerRef.current = setTimeout(() => codeRef.current?.focus(), 50);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [open]);

  // แต่ละช่องค้นหาอิสระ — เมื่อพิมพ์ช่องหนึ่ง ล้างอีกช่องแล้วค้นหาเฉพาะค่านั้น
  const handleCodeChange = (val: string) => {
    setCodeQuery(val);
    if (val.trim()) {
      setNameQuery(''); // ล้างช่องชื่อ
    } else if (!nameQuery.trim()) {
      setResults([]); setSearched(false); return;
    }
    doSearch(val);
  };

  const handleNameChange = (val: string) => {
    setNameQuery(val);
    if (val.trim()) {
      setCodeQuery(''); // ล้างช่องรหัส
    } else if (!codeQuery.trim()) {
      setResults([]); setSearched(false); return;
    }
    doSearch(val);
  };

  const handleClear = () => {
    setCodeQuery('');
    setNameQuery('');
    setResults([]);
    setSearched(false);
    setErrorMsg('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(false);
    codeRef.current?.focus();
  };

  if (!open) return null;

  const activeQuery = codeQuery.trim() || nameQuery.trim();
  const hasQuery = activeQuery.length > 0;
  const showEmpty = !hasQuery && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[900px] mx-4 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Navy header bar */}
        <div
          className={`flex items-center justify-between px-6 shrink-0 ${mode === 'change' ? 'py-3' : 'h-14'}`}
          style={{ backgroundColor: NAVY }}
        >
          <div className="flex items-center gap-3">
            {mode === 'change' && <RefreshCw className="w-6 h-6 text-white" />}
            <div className="leading-tight">
              <div className="text-h5 text-white">
                {mode === 'change' ? 'เปลี่ยนลูกค้า' : 'ค้นหาสมาชิก'}
              </div>
              {mode === 'change' && (
                <div className="text-c2 text-white/70 mt-0.5">เลือกข้อมูลลูกค้าสำหรับบิลนี้</div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition" aria-label="ปิด">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search inputs (2 columns) */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4 shrink-0 border-b border-gray-200">
          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">รหัสลูกค้า</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={codeRef}
                value={codeQuery}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="ค้นหาด้วยรหัสลูกค้า"
                className="w-full h-12 pl-12 pr-10 border border-gray-300 rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition"
              />
              {codeQuery && (
                <button onClick={() => handleCodeChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">{hasQuery ? 'ชื่อสมาชิก' : 'ชื่อสมาชิก/เบอร์โทร'}</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={nameQuery}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="ค้นหาด้วยชื่อสมาชิก/เบอร์โทร"
                className="w-full h-12 pl-12 pr-10 border border-gray-300 rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition"
              />
              {nameQuery && (
                <button onClick={() => handleNameChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results section */}
        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-c1 text-text-secondary">
              ผลการค้นหา{searched ? ` (${results.length})` : ''}
            </div>
            {searched && (codeQuery || nameQuery) && (
              <button onClick={handleClear} className="text-c1 text-status-danger hover:underline">
                ล้างค่าค้นหา
              </button>
            )}
          </div>

          {loading ? (
            <div className="rounded-[12px] bg-bg-page-2 border border-gray-200 divide-y divide-gray-200">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="w-12 h-12 rounded-[12px] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ) : errorMsg ? (
            <div className="rounded-[12px] border border-status-danger/30 bg-status-danger-bg px-5 py-4 text-c2 text-status-danger">
              {errorMsg}
            </div>
          ) : showEmpty ? (
            <div className="rounded-[12px] bg-bg-page-2 border border-gray-200 flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search className="w-14 h-14 text-gray-300 mb-3" strokeWidth={1.5} />
              <div className="text-b3 text-text-muted">กรุณาพิมพ์รหัสหรือชื่อลูกค้าเพื่อเริ่มการค้นหา</div>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-[12px] bg-bg-page-2 border border-gray-200 flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search className="w-14 h-14 text-gray-300 mb-3" strokeWidth={1.5} />
              <div className="text-b3 text-text-muted">ไม่พบสมาชิกที่ตรงกัน</div>
            </div>
          ) : (
            <div className="rounded-[12px] bg-bg-page-2 border border-gray-200 divide-y divide-gray-200">
              {results.map(c => {
                const tier = TIER_STYLE[c.tier] ?? { bg: 'bg-neutral-100', text: 'text-neutral-600', label: c.tier };
                return (
                  <button
                    key={c.id}
                    onClick={() => { onSelect(c); onClose(); }}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white transition text-left"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0" style={{ backgroundColor: '#0197FF' }}>
                      <User className="w-6 h-6 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-b2 text-text-primary truncate">{c.name}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-c2 text-text-muted">
                          <User className="w-3.5 h-3.5" />{c.id}
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1 text-c2 text-text-muted">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            {c.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right column: tier + points */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className={`text-c2 font-medium px-3 py-1 rounded-full ${tier.bg} ${tier.text}`}>
                        {tier.label}
                      </span>
                      <span className="text-c2 text-text-secondary tabular-nums">
                        {(c.rewardPoints ?? 0).toLocaleString()} Point
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
          >
            ยกเลิก
          </button>
          {onRegister && (
            <button
              onClick={onRegister}
              className="flex-[2] h-12 rounded-[12px] flex items-center justify-center gap-2 text-h5 transition hover:brightness-95"
              style={{ backgroundColor: YELLOW, color: NAVY }}
            >
              <UserPlus className="w-5 h-5" /> สมัครสมาชิกใหม่
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
