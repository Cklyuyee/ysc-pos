import { useEffect, useState } from 'react';
import { X, Box, Plus, Minus, Trash2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
export type PackagingGroup = 'packaging';
export type PackagingCategory = 'ลัง' | 'ถุง' | 'ซอง' | 'พาเลท';

export interface PackagingOption {
  id: string;
  name: string;
  group: PackagingGroup;
  category: PackagingCategory;
  /** Optional dimension/size hint (e.g. "20×20×15 cm") */
  dim?: string;
}

export interface SelectedPackaging extends PackagingOption {
  qty: number;
}

// ─── Catalog (mock — replace with API later) ────────────────────────────────
const PACKAGING_OPTIONS: PackagingOption[] = [
  // ลัง — boxes
  { id: 'ling-s',  name: 'ลัง S',  group: 'packaging', category: 'ลัง', dim: '20×20×15 cm' },
  { id: 'ling-m',  name: 'ลัง M',  group: 'packaging', category: 'ลัง', dim: '35×25×20 cm' },
  { id: 'ling-l',  name: 'ลัง L',  group: 'packaging', category: 'ลัง', dim: '50×35×30 cm' },
  { id: 'ling-xl', name: 'ลัง XL', group: 'packaging', category: 'ลัง', dim: '60×50×40 cm' },
  // ถุง — bags
  { id: 'thung-plastic', name: 'ถุงพลาสติกใส', group: 'packaging', category: 'ถุง' },
  { id: 'thung-paper',   name: 'ถุงกระดาษ',    group: 'packaging', category: 'ถุง' },
  // ซอง — envelopes
  { id: 'song-bubble', name: 'ซองกันกระแทก', group: 'packaging', category: 'ซอง' },
  { id: 'song-doc',    name: 'ซองเอกสาร',    group: 'packaging', category: 'ซอง' },
  // พาเลท — pallet
  { id: 'palate-film', name: 'พาเลท + ฟิล์ม', group: 'packaging', category: 'พาเลท' },
];

const PACKAGING_CATS: PackagingCategory[] = ['ลัง', 'ถุง', 'ซอง', 'พาเลท'];

const TAG: Record<PackagingCategory, { bg: string; text: string }> = {
  ลัง:      { bg: 'bg-amber-100',  text: 'text-amber-700' },
  ถุง:      { bg: 'bg-green-100',  text: 'text-green-700' },
  ซอง:      { bg: 'bg-teal-100',   text: 'text-teal-700' },
  พาเลท:    { bg: 'bg-purple-100', text: 'text-purple-700' },
};

// ─── Props ──────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  selected: SelectedPackaging[];
  onConfirm: (items: SelectedPackaging[]) => void;
}

// ─── Dialog ─────────────────────────────────────────────────────────────────
export function PackagingPickerDialog({ open, onClose, selected, onConfirm }: Props) {
  const [pending, setPending] = useState<SelectedPackaging[]>(selected);
  const [subTab, setSubTab] = useState<PackagingCategory>('ลัง');

  useEffect(() => {
    if (open) {
      setPending(selected);
      setSubTab('ลัง');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const filteredOptions = PACKAGING_OPTIONS.filter(o => o.category === subTab);

  const groupItems = pending;
  const groupTotal = pending.reduce((s, p) => s + p.qty, 0);

  const findItem = (id: string) => pending.find(p => p.id === id);

  const addOrIncrement = (opt: PackagingOption) => {
    setPending(prev => {
      const existing = prev.find(p => p.id === opt.id);
      if (existing) return prev.map(p => p.id === opt.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...opt, qty: 1 }];
    });
  };

  const setQty = (id: string, delta: number) => {
    setPending(prev =>
      prev
        .map(p => p.id === id ? { ...p, qty: p.qty + delta } : p)
        .filter(p => p.qty > 0)
    );
  };

  const remove = (id: string) => setPending(prev => prev.filter(p => p.id !== id));

  const handleConfirm = () => {
    onConfirm(pending);
    onClose();
  };

  const NAVY = '#0B1E8A';
  const YELLOW = '#FFC518';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[720px] mx-4 flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header (navy) */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ backgroundColor: NAVY }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
              <Box className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-h5 font-bold text-white">วัสดุที่ใช้แพ็ค</div>
              <div className="text-c2 text-white/60">เลือกบรรจุภัณฑ์</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[12px] hover:bg-white/10 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-3">

          {/* Selected list */}
          <div className="bg-gray-50 rounded-[12px] p-3 mb-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-c2 text-text-muted">บรรจุภัณฑ์ที่ใช้</span>
              <span className="text-c1 font-bold text-text-primary">
                {groupTotal} <span className="text-c2 font-normal text-text-muted">ชิ้น</span>
              </span>
            </div>
            {groupItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-5 text-text-muted">
                <Box className="w-8 h-8 text-gray-300 mb-1.5" strokeWidth={1.5} />
                <span className="text-c2">ยังไม่ได้เลือกบรรจุภัณฑ์</span>
              </div>
            ) : (
              <div className="space-y-2">
                {groupItems.map(p => {
                  const tag = TAG[p.category];
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className={`text-c3 font-medium px-2 py-0.5 rounded-full ${tag.bg} ${tag.text} shrink-0`}>
                        {p.category}
                      </span>
                      <span className="flex-1 text-c1 text-text-primary truncate">{p.name}</span>
                      <button
                        onClick={() => setQty(p.id, -1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 shrink-0"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <span className="text-c1 font-bold text-text-primary w-5 text-center tabular-nums">{p.qty}</span>
                      <button
                        onClick={() => setQty(p.id, +1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:brightness-95 transition shrink-0"
                        style={{ backgroundColor: YELLOW }}
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={3} style={{ color: NAVY }} />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="w-7 h-7 flex items-center justify-center text-rose-400 hover:text-rose-500 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sub-tabs */}
          <div className="grid grid-cols-4 gap-1 mb-3 border-b border-gray-200">
            {PACKAGING_CATS.map(cat => {
              const active = subTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSubTab(cat)}
                  className={`h-9 text-c1 font-semibold transition relative ${
                    active ? 'text-amber-700' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {cat}
                  {active && <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-amber-400 rounded-full" />}
                </button>
              );
            })}
          </div>

          {/* Available options */}
          <div className="grid grid-cols-2 gap-2.5 pb-3">
            {filteredOptions.map(opt => {
              const sel = findItem(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => addOrIncrement(opt)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 rounded-[12px] border transition text-left ${
                    sel
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-gray-200 bg-white hover:bg-bg-page-2'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-c1 font-semibold text-text-primary truncate">{opt.name}</div>
                    {opt.dim && <div className="text-c3 text-text-muted truncate">{opt.dim}</div>}
                  </div>
                  {sel ? (
                    <span className="text-c1 font-bold text-sky-600 shrink-0">×{sel.qty}</span>
                  ) : (
                    <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-bg-page flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-[12px] border border-gray-300 bg-white text-h5 text-text-primary hover:bg-bg-page-2 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] h-12 rounded-[12px] text-h5 font-bold transition hover:brightness-95"
            style={{ backgroundColor: YELLOW, color: NAVY }}
          >
            Enter - ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}
