import { useEffect, useRef, useState } from 'react';
import { X, User, Building2, Phone, Check, AlertTriangle, AlertCircle } from 'lucide-react';
import { searchCustomers, createCustomer, apiCustomerToCustomer } from '../../../services/customersApi';
import type { Customer } from '../../../data/customers';

const NAVY = '#081E6A';
const YELLOW = '#FFC518';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegistered: (customer: Customer) => void;
}

type CustomerType = 'personal' | 'business';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-neutral-600">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = (state: 'error' | 'warn' | 'ok' = 'ok') =>
  `w-full h-11 px-3 border-2 rounded-xl text-sm outline-none transition ${
    state === 'error' ? 'border-rose-400 focus:border-rose-400 bg-rose-50' :
    state === 'warn'  ? 'border-amber-400 focus:border-amber-400 bg-amber-50/40' :
    'border-neutral-200 focus:border-amber-400'
  }`;

export function RegisterMemberDialog({ open, onClose, onRegistered }: Props) {
  const [type, setType] = useState<CustomerType>('personal');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [companyName, setCompanyName] = useState('');

  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [phoneDuplicate, setPhoneDuplicate]   = useState<Customer | undefined>();
  const [similarCompanies, setSimilarCompanies] = useState<Customer[]>([]);
  const [done, setDone]                       = useState(false);
  const [submitting, setSubmitting]           = useState(false);

  const companyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneDebounce   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstInputRef   = useRef<HTMLInputElement>(null);

  const reset = () => {
    setType('personal'); setFirstName(''); setLastName('');
    setPhone(''); setCompanyName(''); setErrors({});
    setPhoneDuplicate(undefined); setSimilarCompanies([]); setDone(false); setSubmitting(false);
  };

  useEffect(() => {
    if (open) {
      focusTimerRef.current = setTimeout(() => firstInputRef.current?.focus(), 60);
    } else {
      if (phoneDebounce.current)   clearTimeout(phoneDebounce.current);
      if (companyDebounce.current) clearTimeout(companyDebounce.current);
      if (focusTimerRef.current)   clearTimeout(focusTimerRef.current);
      reset();
    }
  }, [open]);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setErrors(p => ({ ...p, phone: '' }));
    setPhoneDuplicate(undefined);
    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    const normalized = val.replace(/[-\s]/g, '');
    if (normalized.length >= 9) {
      phoneDebounce.current = setTimeout(async () => {
        try {
          const res = await searchCustomers(normalized);
          const dup = res.find(c => (c.phone ?? '').replace(/[-\s]/g, '') === normalized);
          if (dup) setPhoneDuplicate(apiCustomerToCustomer(dup));
        } catch {
          // ignore — don't block registration on lookup failure
        }
      }, 400);
    }
  };

  const handleCompanyChange = (val: string) => {
    setCompanyName(val);
    setErrors(p => ({ ...p, companyName: '' }));
    if (companyDebounce.current) clearTimeout(companyDebounce.current);
    if (val.trim().length >= 2) {
      companyDebounce.current = setTimeout(async () => {
        try {
          const res = await searchCustomers(val.trim());
          const similar = res
            .filter(c => c.type === 'company' || c.type === 'business')
            .slice(0, 4)
            .map(apiCustomerToCustomer);
          setSimilarCompanies(similar);
        } catch {
          setSimilarCompanies([]);
        }
      }, 300);
    } else {
      setSimilarCompanies([]);
    }
  };

  const handleClose = () => { reset(); onClose(); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (type === 'business' && !companyName.trim()) e.companyName = 'กรุณากรอกชื่อบริษัท';
    if (!firstName.trim()) e.firstName = 'กรุณากรอกชื่อ';
    if (!lastName.trim())  e.lastName  = 'กรุณากรอกนามสกุล';
    if (!phone.trim())     e.phone     = 'กรุณากรอกเบอร์โทร';
    else if (!/^[0-9]{9,10}$/.test(phone.replace(/[-\s]/g, '')))
      e.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
    else if (phoneDuplicate)
      e.phone = `เบอร์นี้ถูกใช้แล้วโดย ${phoneDuplicate.name}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    const fullName = type === 'business'
      ? companyName.trim()
      : `${firstName.trim()} ${lastName.trim()}`;
    const contactPerson = type === 'business'
      ? `${firstName.trim()} ${lastName.trim()}`
      : undefined;
    try {
      const newCustomer = await createCustomer({
        name: fullName,
        phone: phone.trim(),
        type: type === 'business' ? 'company' : 'person',
        ...(contactPerson ? { contactPerson } : {}),
      });
      setDone(true);
      setTimeout(() => { onRegistered(apiCustomerToCustomer(newCustomer)); handleClose(); }, 1100);
    } catch (err: unknown) {
      const msg = (err as Error).message ?? 'เกิดข้อผิดพลาด';
      setErrors(p => ({ ...p, phone: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const phoneState = errors.phone ? 'error' : phoneDuplicate ? 'error' : 'ok';
  const companyState = errors.companyName ? 'error' : similarCompanies.length > 0 ? 'warn' : 'ok';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[500px] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <div className="text-lg font-bold" style={{ color: NAVY }}>สมัครสมาชิกใหม่</div>
            <div className="text-xs text-neutral-400 mt-0.5">กรอกข้อมูลเบื้องต้นเพื่อเริ่มต้นสะสมคะแนน</div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
            {([
              { value: 'personal', label: 'ลูกค้าทั่วไป',  icon: User },
              { value: 'business', label: 'ลูกค้าธุรกิจ', icon: Building2 },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => { setType(value); setErrors({}); setSimilarCompanies([]); }}
                className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition ${
                  type === value ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {type === 'business' && (
            <Field label="ชื่อบริษัท / ร้านค้า" required>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  ref={firstInputRef}
                  value={companyName}
                  onChange={e => handleCompanyChange(e.target.value)}
                  placeholder="เช่น บริษัท ABC จำกัด"
                  className={`${inputCls(companyState)} pl-9`}
                />
                {companyState === 'warn' && (
                  <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
                )}
              </div>
              {errors.companyName && (
                <p className="flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="w-3.5 h-3.5" />{errors.companyName}</p>
              )}
              {similarCompanies.length > 0 && !errors.companyName && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    พบชื่อที่คล้ายกันในระบบ — ตรวจสอบก่อนสมัครใหม่
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {similarCompanies.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                        <div>
                          <div className="text-xs font-bold text-neutral-800">{c.name}</div>
                          <div className="text-[11px] text-neutral-500">{c.phone} • {c.code}</div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          {c.type === 'company' ? 'ธุรกิจ' : 'บุคคล'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={type === 'business' ? 'ชื่อผู้ติดต่อ' : 'ชื่อ'} required>
              <input
                ref={type === 'personal' ? firstInputRef : undefined}
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: '' })); }}
                placeholder="ชื่อ"
                className={inputCls(errors.firstName ? 'error' : 'ok')}
              />
              {errors.firstName && <p className="text-xs text-rose-500">{errors.firstName}</p>}
            </Field>
            <Field label="นามสกุล" required>
              <input
                value={lastName}
                onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: '' })); }}
                placeholder="นามสกุล"
                className={inputCls(errors.lastName ? 'error' : 'ok')}
              />
              {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName}</p>}
            </Field>
          </div>

          <Field label="เบอร์โทรศัพท์" required>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="089-123-4567"
                className={`${inputCls(phoneState)} pl-9`}
              />
              {phoneDuplicate && !errors.phone && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 pointer-events-none" />
              )}
            </div>
            {phoneDuplicate && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-rose-700">เบอร์นี้มีในระบบแล้ว</div>
                  <div className="text-[11px] text-rose-600 mt-0.5">
                    {phoneDuplicate.name} ({phoneDuplicate.code}) •{' '}
                    <span className="font-semibold">{phoneDuplicate.tier}</span>
                  </div>
                </div>
              </div>
            )}
            {errors.phone && !phoneDuplicate && (
              <p className="flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="w-3.5 h-3.5" />{errors.phone}</p>
            )}
          </Field>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center gap-3">
          <button onClick={handleClose}
            className="flex-1 h-11 rounded-xl border-2 border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition">
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={done || !!phoneDuplicate || submitting}
            className="flex-1 h-11 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: done ? '#22c55e' : YELLOW, color: done ? 'white' : NAVY }}>
            {done
              ? <><Check className="w-4 h-4" /> สมัครสำเร็จ!</>
              : submitting
                ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : 'สมัครสมาชิก'}
          </button>
        </div>
      </div>
    </div>
  );
}
