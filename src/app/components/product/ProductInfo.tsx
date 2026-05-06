import React from 'react';
import { PromoBadge, AttributeBadge } from '../badges/ProductBadges';
import type { DerivedPromoEntry } from '../../utils/promotionAdapters';

/** Derive a short human-readable promo label from a DerivedPromoEntry */
export function getPromoShortLabel(p: DerivedPromoEntry): string {
  if (p.type === 'B2G1')     return `ซื้อ ${p.minQty ?? 2} แถม ${p.freeQty ?? 1}`;
  if (p.type === 'DISCOUNT') return `ลด ${p.discountPercent ?? ''}%`;
  if (p.type === 'BUNDLE')   return p.minQty ? `ซื้อครบ ${p.minQty} ชิ้น ราคาพิเศษ` : p.desc;
  if (p.type === 'FREE_ITEM') return p.threshold ? `ครบ ฿${p.threshold.toLocaleString()} รับฟรี` : p.desc;
  return p.desc;
}

interface ProductInfoProps {
  name: string;
  sku: string;
  barcode?: string;
  variant?: string;
  taxType?: string;
  promo?: DerivedPromoEntry;
  attr?: string[];
}

/** Shared product name + SKU/barcode + badges block — use in cart table AND search results */
export function ProductInfo({ name, sku, barcode, variant, taxType, promo, attr }: ProductInfoProps) {
  return (
    <>
      {/* Name + Tax badge */}
      <div className="flex items-center gap-2">
        <p className="font-semibold text-slate-800 text-[14px] leading-snug">{name}</p>
        {taxType === 'V' && (
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-lg leading-tight shrink-0">V</span>
        )}
      </div>

      {/* SKU / Barcode */}
      <div className="flex flex-col gap-0.5 mt-0.5">
        <span className="text-[11px] text-slate-400">
          รหัสสินค้า <span className="text-slate-500">{sku}</span>
        </span>
        {barcode && (
          <span className="text-[11px] text-slate-400">
            บาร์โค้ด <span className="text-slate-500">{barcode}</span>
          </span>
        )}
        {!barcode && variant && (
          <span className="text-[11px] text-slate-400">{variant}</span>
        )}
      </div>

      {/* Badges */}
      {(!!promo || !!attr?.length) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {promo && <PromoBadge description={getPromoShortLabel(promo)} />}
          {attr?.includes('Fragile')  && <AttributeBadge type="Fragile" />}
          {attr?.includes('Oversize') && <AttributeBadge type="Oversize" />}
        </div>
      )}
    </>
  );
}
