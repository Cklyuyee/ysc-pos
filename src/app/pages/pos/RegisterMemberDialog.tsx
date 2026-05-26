import { useEffect, useRef, useState } from 'react';
import { X, User, Building2, Phone, Check, AlertCircle } from 'lucide-react';
import { searchCustomers, createCustomer, apiCustomerToCustomer } from '../../../services/customersApi';
import type { Customer } from '../../../data/customers';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegistered: (customer: Customer) => void;
}

type CustomerType = 'personal' | 'business';

export function RegisterMemberDialog({ open, onClose, onRegistered }: Props) {
  const [type, setType] = useState<CustomerType>('personal');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [companyName, setCompanyName] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneDuplicate, setPhoneDuplicate] = useState<Customer | undefined>();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phoneDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setType('personal');
    setFirstName(''); setLastName('');
    setPhone(''); setCompanyName('');
    setErrors({});
    setPhoneDuplicate(undefined);
    setDone(false);
    setSubmitting(false);
  };

  useEffect(() => {
    if (open) {
      focusTimerRef.current = setTimeout(() => firstInputRef.current?.focus(), 60);
    } else {
      if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
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
          // ignore
        }
      }, 400);
    }
  };

  const handleClose = () => { reset(); onClose(); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (type === 'business') {
      if (!companyName.trim()) e.companyName = 'กรุณากรอกชื่อนิติบุคคล/บริษัท';
    } else {
      if (!firstName.trim()) e.firstName = 'กรุณากรอกชื่อ';
      if (!lastName.trim())  e.lastName  = 'กรุณากรอกนามสกุล';
    }
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
    try {
      const newCustomer = await createCustomer({
        name: fullName,
        phone: phone.trim(),
        type: type === 'business' ? 'company' : 'person',
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

  const inputCls = (hasError: boolean) =>
    `w-full h-12 px-4 border rounded-[12px] text-b3 text-text-primary placeholder:text-gray-400 outline-none transition ${
      hasError
        ? 'border-status-danger/60 focus:border-status-danger bg-status-danger-bg/30'
        : 'border-gray-300 focus:border-brand-navy'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[900px] mx-4 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Navy header bar */}
        <div className="flex items-center justify-between px-6 h-14 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="text-h5 text-white">สมัครสมาชิกใหม่</div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition" aria-label="ปิด">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs (segmented pill — sky blue active) */}
        <div className="px-6 pt-5 shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 bg-sky-100 rounded-full">
            {([
              { value: 'personal', label: 'บุคคลธรรมดา', icon: User },
              { value: 'business', label: 'นิติบุคคล',    icon: Building2 },
            ] as const).map(({ value, label, icon: Icon }) => {
              const active = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setType(value); setErrors({}); }}
                  className={`flex items-center justify-center gap-2 h-11 rounded-full text-b4 font-semibold transition ${
                    active
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-white text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {type === 'personal' ? (
            <>
              {/* ชื่อ + นามสกุล */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-c1 text-text-secondary">ชื่อ</label>
                  <input
                    ref={firstInputRef}
                    value={firstName}
                    onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: '' })); }}
                    placeholder="กรอกชื่อ"
                    className={inputCls(!!errors.firstName)}
                  />
                  {errors.firstName && (
                    <p className="flex items-center gap-1 text-c2 text-status-danger"><AlertCircle className="w-4 h-4" />{errors.firstName}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-c1 text-text-secondary">นามสกุล</label>
                  <input
                    value={lastName}
                    onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: '' })); }}
                    placeholder="กรอกนามสกุล"
                    className={inputCls(!!errors.lastName)}
                  />
                  {errors.lastName && (
                    <p className="flex items-center gap-1 text-c2 text-status-danger"><AlertCircle className="w-4 h-4" />{errors.lastName}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ชื่อนิติบุคคล/บริษัท */}
              <div className="flex flex-col gap-2">
                <label className="text-c1 text-text-secondary">ชื่อนิติบุคคล/บริษัท</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    ref={firstInputRef}
                    value={companyName}
                    onChange={e => { setCompanyName(e.target.value); setErrors(p => ({ ...p, companyName: '' })); }}
                    placeholder="กรอกชื่อนิติบุคคล/บริษัท"
                    className={`${inputCls(!!errors.companyName)} pl-12`}
                  />
                </div>
                {errors.companyName && (
                  <p className="flex items-center gap-1 text-c2 text-status-danger"><AlertCircle className="w-4 h-4" />{errors.companyName}</p>
                )}
              </div>
            </>
          )}

          {/* เบอร์โทร — common to both */}
          <div className="flex flex-col gap-2">
            <label className="text-c1 text-text-secondary">เบอร์โทร</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="กรอกเบอร์โทร เช่น 089-123-4567"
                className={`${inputCls(!!errors.phone || !!phoneDuplicate)} pl-12`}
              />
            </div>
            {phoneDuplicate && (
              <div className="flex items-start gap-2 rounded-[12px] border border-status-danger/30 bg-status-danger-bg px-4 py-3">
                <AlertCircle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
                <div>
                  <div className="text-c1 font-bold text-status-danger">เบอร์นี้มีในระบบแล้ว</div>
                  <div className="text-c2 text-status-danger/80 mt-0.5">
                    {phoneDuplicate.name} ({phoneDuplicate.code}) — <span className="font-semibold">{phoneDuplicate.tier}</span>
                  </div>
                </div>
              </div>
            )}
            {errors.phone && !phoneDuplicate && (
              <p className="flex items-center gap-1 text-c2 text-status-danger"><AlertCircle className="w-4 h-4" />{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={done || !!phoneDuplicate || submitting}
            className="flex-[2] h-12 rounded-[12px] flex items-center justify-center gap-2 text-h5 transition hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: done ? '#27AE60' : YELLOW, color: done ? '#FFFFFF' : NAVY }}
          >
            {done ? (
              <><Check className="w-5 h-5" /> สมัครสำเร็จ!</>
            ) : submitting ? (
              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Enter - ตกลง</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
