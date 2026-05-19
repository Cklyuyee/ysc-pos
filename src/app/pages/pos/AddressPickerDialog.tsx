import { useRef, useState } from 'react';
import { X, ArrowLeft, MapPin, Phone, User, Pencil, Trash2, ChevronDown, Plus, Check } from 'lucide-react';
import type { Address } from '../../../data/customers';
import { lookupByZipcode, type ThaiAddressEntry } from '../../../utils/thaiAddress';

const NAVY = '#0B1E8A';
const YELLOW = '#FFC518';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'ที่อยู่หลัก' | 'บ้าน' | 'สาขา' | 'อื่นๆ';
const TABS: TabType[] = ['ที่อยู่หลัก', 'บ้าน', 'สาขา', 'อื่นๆ'];
const CARRIER_CUSTOM = 'ระบุเอง';
const CARRIERS = [
  'รถบริษัท (สายใน กทม.)',
  'Flash Express',
  'Kerry Express',
  'J&T Express',
  'ไปรษณีย์ไทย (EMS)',
  CARRIER_CUSTOM,
];

interface FormState {
  tab: TabType;
  branchName: string;
  contactName: string;
  phone: string;
  postalCode: string;
  province: string;
  district: string;
  subDistrict: string;
  address: string;
  carrier: string;
  /** Filled only when carrier === "ระบุเอง" */
  customCarrierName: string;
  customCarrierPhone: string;
  isDefault: boolean;
}

const emptyForm = (): FormState => ({
  tab: 'ที่อยู่หลัก',
  branchName: '',
  contactName: '',
  phone: '',
  postalCode: '',
  province: '',
  district: '',
  subDistrict: '',
  address: '',
  carrier: CARRIERS[0],
  customCarrierName: '',
  customCarrierPhone: '',
  isDefault: false,
});

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label, placeholder, value, onChange, required, className,
}: {
  label: string; placeholder?: string; value: string;
  onChange: (v: string) => void; required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      <label className="text-c1 text-text-secondary">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? ''}
        className="h-12 px-4 rounded-[12px] border border-gray-300 text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition bg-white"
      />
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="text-c1 font-semibold text-text-secondary mb-3">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedId: string | null;
  onConfirm: (addressId: string) => void;
  /** Called when the user submits the "เพิ่มที่อยู่ใหม่" form. */
  onAddAddress?: (addr: Address) => void;
  /** Called when the user clicks the pin icon to mark an address as default. */
  onSetDefault?: (addressId: string) => void;
  customerName: string;
  customerPhone?: string;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AddressPickerDialog({
  open, onClose, addresses, selectedId, onConfirm, onAddAddress, onSetDefault,
  customerName, customerPhone,
}: Props) {
  const [pendingId, setPendingId] = useState<string | null>(selectedId);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [zipSuggestions, setZipSuggestions] = useState<ThaiAddressEntry[]>([]);
  const [showZipDropdown, setShowZipDropdown] = useState(false);
  const zipBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!open) return null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleZipChange = (val: string) => {
    set('postalCode', val);
    const trimmed = val.replace(/\D/g, '').slice(0, 5);
    if (trimmed.length === 5) {
      const results = lookupByZipcode(trimmed);
      setZipSuggestions(results);
      setShowZipDropdown(results.length > 0);
    } else {
      setZipSuggestions([]);
      setShowZipDropdown(false);
    }
  };

  const selectZip = (entry: ThaiAddressEntry) => {
    setForm(prev => ({
      ...prev,
      postalCode: entry.zipcode,
      province: entry.province,
      district: entry.amphoe,
      subDistrict: entry.tambon,
    }));
    setShowZipDropdown(false);
    setZipSuggestions([]);
  };

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  const listView = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: NAVY }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-h5 font-bold text-white">ที่อยู่สำหรับจัดส่ง</div>
            <div className="text-c2 text-white/60">{addresses.length} ที่อยู่</div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {addresses.map(addr => {
          const isSelected = pendingId === addr.id;
          return (
            <div
              key={addr.id}
              onClick={() => setPendingId(addr.id)}
              className={`rounded-[14px] border p-4 cursor-pointer transition flex items-start gap-3 ${
                isSelected ? 'border-sky-400 bg-sky-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Checkbox (filled when selected) */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition mt-0.5 ${
                isSelected ? 'bg-sky-500' : 'border-2 border-gray-300 bg-white'
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Label + default badge */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-h5 font-bold" style={{ color: NAVY }}>
                    {addr.label}{addr.branchName ? ` (${addr.branchName})` : ''}
                  </span>
                  {addr.isDefault && (
                    <span className="text-c2 font-bold px-2.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: YELLOW, color: NAVY }}>
                      ที่อยู่หลัก
                    </span>
                  )}
                </div>
                {/* Recipient name (per-address override, fallback to customer) */}
                <div className="flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4 shrink-0" style={{ color: NAVY }} />
                  <span className="text-b3 font-bold text-text-primary">{addr.contactName ?? customerName}</span>
                </div>
                {/* Address */}
                <div className="flex items-start gap-2 mb-1.5">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: NAVY }} />
                  <span className="text-b4 text-text-primary leading-snug">
                    {[addr.address, addr.district, addr.province, addr.postalCode].filter(Boolean).join(' ')}
                  </span>
                </div>
                {/* Phone (per-address override, fallback to customer) */}
                {(addr.phone ?? customerPhone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" style={{ color: NAVY }} />
                    <span className="text-b4 text-text-primary">{addr.phone ?? customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Action column */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={e => { e.stopPropagation(); onSetDefault?.(addr.id); }}
                    title="ตั้งเป็นที่อยู่หลัก"
                    className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-gray-200 bg-white hover:bg-sky-50 hover:border-sky-300 transition"
                  >
                    <MapPin className="w-4 h-4" style={{ color: NAVY }} />
                  </button>
                )}
                <button
                  onClick={e => e.stopPropagation()}
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-gray-200 bg-white hover:bg-sky-50 hover:border-sky-300 transition"
                >
                  <Pencil className="w-4 h-4" style={{ color: NAVY }} />
                </button>
                <button
                  onClick={e => e.stopPropagation()}
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-gray-200 bg-white hover:bg-rose-50 hover:border-rose-300 transition"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => { setForm(emptyForm()); setMode('form'); }}
          className="w-full h-12 rounded-[14px] border border-sky-300 bg-white text-b3 font-semibold text-sky-500 hover:bg-sky-50 hover:border-sky-400 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          เพิ่มที่อยู่ใหม่
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition">
          ยกเลิก
        </button>
        <button
          onClick={() => { if (pendingId) { onConfirm(pendingId); onClose(); } }}
          disabled={!pendingId}
          className="flex-[2] h-12 rounded-[12px] text-h5 font-bold transition hover:brightness-95 disabled:opacity-50"
          style={{ backgroundColor: YELLOW, color: NAVY }}
        >
          Enter - ตกลง
        </button>
      </div>
    </>
  );

  // ── FORM VIEW ─────────────────────────────────────────────────────────────────
  const formView = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: NAVY }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setMode('list')} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-h5 font-bold text-white">เพิ่มที่อยู่ใหม่</div>
            <div className="text-c2 text-white/60">กรอกข้อมูลที่อยู่จัดส่ง</div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Address type selector */}
      <div className="px-6 pt-5 pb-1 bg-white shrink-0">
        <div className="text-c1 text-text-secondary mb-3">ประเภทที่อยู่</div>
        <div className="flex items-center gap-8">
          {TABS.map(tab => {
            const active = form.tab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => set('tab', tab)}
                className="flex items-center gap-2 transition"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                  active ? 'bg-sky-500' : 'border-2 border-gray-300 bg-white'
                }`}>
                  {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-s2 text-text-primary">{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form body */}
      <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
        <div className="px-6 py-5 space-y-5">

          {form.tab === 'สาขา' && (
            <Field label="ชื่อสาขา" placeholder="กรุณากรอกชื่อสาขา"
              value={form.branchName} onChange={v => set('branchName', v)} />
          )}

          <div>
            <SectionHeader label="ผู้ติดต่อ" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อผู้รับ" placeholder="กรุณากรอกชื่อผู้รับ"
                value={form.contactName} onChange={v => set('contactName', v)} required />
              <Field label="เบอร์โทร" placeholder="กรุณากรอกเบอร์โทร"
                value={form.phone} onChange={v => set('phone', v)} required />
            </div>
          </div>

          <div>
            <SectionHeader label="ที่อยู่จัดส่ง" required />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* ── Postal code with autocomplete ── */}
                <div className="flex flex-col gap-2">
                  <label className="text-c1 text-text-secondary">
                    รหัสไปรษณีย์<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      value={form.postalCode}
                      onChange={e => handleZipChange(e.target.value)}
                      onFocus={() => {
                        if (zipSuggestions.length > 0) setShowZipDropdown(true);
                      }}
                      onBlur={() => {
                        zipBlurTimer.current = setTimeout(() => setShowZipDropdown(false), 150);
                      }}
                      placeholder="เช่น 10200"
                      maxLength={5}
                      inputMode="numeric"
                      className="w-full h-12 px-4 rounded-[12px] border border-gray-300 text-b3 text-text-primary placeholder:text-gray-400 outline-none focus:border-brand-navy transition bg-white"
                    />
                    {showZipDropdown && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-20 bg-white rounded-[12px] border border-gray-200 shadow-lg overflow-hidden max-h-[220px] overflow-y-auto">
                        {zipSuggestions.map((entry, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={() => {
                              if (zipBlurTimer.current) clearTimeout(zipBlurTimer.current);
                              selectZip(entry);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition border-b border-gray-100 last:border-0"
                          >
                            <div className="text-b4 font-semibold text-text-primary">{entry.tambon}</div>
                            <div className="text-c2 text-text-muted">{entry.amphoe} · {entry.province} · {entry.zipcode}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Field label="จังหวัด" placeholder="กรอกจังหวัด"
                  value={form.province} onChange={v => set('province', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="อำเภอ / เขต" placeholder="กรอกอำเภอ / เขต"
                  value={form.district} onChange={v => set('district', v)} />
                <Field label="ตำบล / แขวง" placeholder="กรอกตำบล / แขวง"
                  value={form.subDistrict} onChange={v => set('subDistrict', v)} />
              </div>
              <Field label="ที่อยู่ (บ้านเลขที่ ถนน ซอย)" placeholder="บ้านเลขที่ ถนน ซอย"
                value={form.address} onChange={v => set('address', v)} />
            </div>
          </div>

          {/* บริษัทขนส่งที่ให้บริการ — appears after postal code is filled */}
          {form.postalCode.trim().length >= 5 && (
            <div className="flex flex-col gap-2">
              <label className="text-c1 text-text-secondary">บริษัทขนส่งที่ให้บริการ</label>
              <div className="relative">
                <select
                  value={form.carrier}
                  onChange={e => set('carrier', e.target.value)}
                  className="w-full h-12 px-4 pr-9 rounded-[12px] border border-gray-300 text-b3 text-text-primary outline-none focus:border-brand-navy transition bg-white appearance-none"
                >
                  {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
              {form.carrier === CARRIER_CUSTOM && (
                <div className="mt-2 rounded-[12px] bg-sky-50 border border-sky-200 px-4 py-4 grid grid-cols-2 gap-3">
                  <Field
                    label="ชื่อขนส่ง"
                    placeholder="พิมพ์ชื่อขนส่งที่ต้องการเพิ่ม..."
                    value={form.customCarrierName}
                    onChange={v => set('customCarrierName', v)}
                    required
                  />
                  <Field
                    label="เบอร์โทรติดต่อ"
                    placeholder="เช่น 089-123-4567"
                    value={form.customCarrierPhone}
                    onChange={v => set('customCarrierPhone', v)}
                    required
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => set('isDefault', !form.isDefault)}
            className={`w-full h-12 px-4 rounded-[12px] border flex items-center gap-3 transition ${
              form.isDefault
                ? 'bg-sky-50 border-sky-400'
                : 'bg-white border-sky-300 hover:border-sky-400'
            }`}
          >
            <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition ${
              form.isDefault ? 'bg-sky-500 border-sky-500' : 'bg-white border-gray-300'
            }`}>
              {form.isDefault && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <span className={`text-s2 ${form.isDefault ? 'text-sky-700' : 'text-text-primary'}`}>
              ตั้งเป็นที่อยู่หลัก
            </span>
          </button>

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
        <button onClick={() => setMode('list')} className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition">
          ยกเลิก
        </button>
        <button
          onClick={() => {
            const isCustomCarrier = form.carrier === CARRIER_CUSTOM;
            // Validation: contact name, phone, postal code (always);
            // for custom carrier — also require name + phone.
            if (!form.contactName.trim() || !form.phone.trim() || !form.postalCode.trim()) return;
            if (isCustomCarrier && (!form.customCarrierName.trim() || !form.customCarrierPhone.trim())) return;
            // Build address from form state
            const addressText = [form.address, form.subDistrict && `ต.${form.subDistrict}`]
              .filter(Boolean).join(' ').trim();
            const newAddr: Address = {
              id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              type: 'shipping',
              label: form.tab,
              branchName: form.tab === 'สาขา' && form.branchName.trim() ? form.branchName.trim() : undefined,
              contactName: form.contactName.trim() || undefined,
              phone: form.phone.trim() || undefined,
              address: addressText,
              district: form.district.trim(),
              province: form.province.trim(),
              postalCode: form.postalCode.trim(),
              isDefault: form.isDefault,
              shippingMethod: isCustomCarrier ? form.customCarrierName.trim() : form.carrier,
              transportContact: isCustomCarrier ? form.customCarrierPhone.trim() : undefined,
            };
            onAddAddress?.(newAddr);
            setPendingId(newAddr.id);   // auto-select the newly added address
            setForm(emptyForm());        // reset form for next time
            setMode('list');             // back to list view
          }}
          disabled={
            !form.contactName.trim() ||
            !form.phone.trim() ||
            !form.postalCode.trim() ||
            (form.carrier === CARRIER_CUSTOM &&
              (!form.customCarrierName.trim() || !form.customCarrierPhone.trim()))
          }
          className="flex-[2] h-12 rounded-[12px] text-h5 font-bold transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: YELLOW, color: NAVY }}
        >
          Enter - ตกลง
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[900px] mx-4 flex flex-col max-h-[90vh] overflow-hidden">
        {mode === 'list' ? listView : formView}
      </div>
    </div>
  );
}
