import { FileSearch, FilePlus, ChevronRight, X, LayoutGrid } from 'lucide-react';

const NAVY = '#0B1E8A';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectDeliveryDoc: () => void;
  onSelectCreateInvoice: () => void;
}

export default function OtherMenusDialog({ open, onClose, onSelectDeliveryDoc, onSelectCreateInvoice }: Props) {
  if (!open) return null;

  const menus = [
    {
      icon: FileSearch,
      iconBg: '#EFF6FF',
      iconColor: '#0EA5E9',
      borderColor: '#BAE6FD',
      hotkey: 'F9-1',
      title: 'ค้นหา / พิมพ์ / แก้ไข',
      subtitle: 'ใบส่งสินค้า',
      desc: 'ค้นหาใบส่งสินค้าตามเลขที่หรือชื่อลูกค้า พิมพ์ใบแจ้งหนี้ หรือแก้ไขรายการสินค้า',
      onClick: onSelectDeliveryDoc,
    },
    {
      icon: FilePlus,
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      borderColor: '#FDE68A',
      hotkey: 'F9-2',
      title: 'สร้างใบแจ้งหนี้',
      subtitle: 'จากรับคำสั่งซื้อ',
      desc: 'ดึงใบรับคำสั่งซื้อมาตรวจสอบ เพิ่มหรือลดสินค้า แล้วสร้างใบแจ้งหนี้พร้อมราคาปัจจุบัน',
      onClick: onSelectCreateInvoice,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-[620px] mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-white/70" />
            <span className="text-s1 font-bold text-white">เมนูอื่นๆ</span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Menu cards */}
        <div className="p-5 space-y-3">
          {menus.map((m) => (
            <button
              key={m.hotkey}
              type="button"
              onClick={m.onClick}
              className="w-full text-left rounded-[16px] border-2 p-4 flex items-center gap-4 transition hover:brightness-97 active:scale-[0.99]"
              style={{ borderColor: m.borderColor, backgroundColor: m.iconBg }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0 bg-white shadow-sm">
                <m.icon className="w-7 h-7" style={{ color: m.iconColor }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-h5 font-bold text-text-primary">{m.title}</span>
                </div>
                <div className="text-s2 font-bold" style={{ color: m.iconColor }}>{m.subtitle}</div>
                <div className="text-c1 text-text-muted mt-1 leading-relaxed">{m.desc}</div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-[12px] border border-gray-300 bg-white text-c1 text-text-secondary hover:bg-gray-50 transition"
          >
            ปิดหน้าต่าง (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
