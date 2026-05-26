import { FileSearch, FilePlus, ChevronRight, X } from 'lucide-react';

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
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
      title: 'ค้นหา/พิมพ์/แก้ไข ใบส่งสินค้า',
      desc: 'ค้นหาใบส่งสินค้าตามเลขที่หรือชื่อลูกค้า พิมพ์ใบแจ้งหนี้ หรือแก้ไขรายการสินค้า',
      onClick: onSelectDeliveryDoc,
    },
    {
      icon: FilePlus,
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
      title: 'สร้างใบแจ้งหนี้ จากรับคำสั่งซื้อ',
      desc: 'ดึงใบรับคำสั่งซื้อมาตรวจสอบ เพิ่มหรือลดสินค้า แล้วสร้างใบแจ้งหนี้พร้อมราคาปัจจุบัน',
      onClick: onSelectCreateInvoice,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-[680px] mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ backgroundColor: NAVY }}>
          <span className="text-h5 font-bold text-white">เมนูอื่นๆ</span>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Menu cards */}
        <div className="p-6 space-y-4">
          {menus.map((m) => (
            <button
              key={m.title}
              type="button"
              onClick={m.onClick}
              className="w-full text-left rounded-[16px] border border-gray-200 bg-white p-5 flex items-center gap-5 transition hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99]"
            >
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-[14px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: m.iconBg }}
              >
                <m.icon className="w-8 h-8" style={{ color: m.iconColor }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="text-h5 font-bold text-text-primary mb-1">{m.title}</div>
                <div className="text-b4 text-text-muted leading-relaxed">{m.desc}</div>
              </div>

              <ChevronRight className="w-6 h-6 text-gray-400 shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-bg-page">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-[12px] border border-gray-300 bg-white text-s2 text-text-primary hover:bg-gray-50 transition"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
