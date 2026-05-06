import React from 'react';
import { Plus, Minus, Package } from 'lucide-react';
import { Product } from '../../api/mock/products';
import { TaxBadge } from '../badges/ProductBadges';
import { ProductInfo } from './ProductInfo';
import { Button } from '../ui/button';
import { QuantityInput } from '../cart/QuantityInput';

interface ProductListItemProps {
  product: Product;
  onClick?: () => void;
  // Optional: For add to cart functionality
  showQuantityControls?: boolean;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
  onAddClick?: (product: Product, qty: number) => void;
  // Optional: Display additional info
  showLastOrder?: boolean;
  showPurchaseCount?: boolean;
  // Optional: Custom styling
  className?: string;
}

export function ProductListItem({
  product,
  onClick,
  showQuantityControls = false,
  quantity = 1,
  onQuantityChange,
  onAddClick,
  showLastOrder = false,
  showPurchaseCount = false,
  className = ''
}: ProductListItemProps) {
  const [localQty, setLocalQty] = React.useState(quantity);

  const updateQuantity = (delta: number) => {
    const newQty = Math.max(1, localQty + delta);
    setLocalQty(newQty);
    onQuantityChange?.(newQty);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddClick?.(product, localQty);
    // Reset to 1 after adding
    setLocalQty(1);
  };

  return (
    <div
      className={`flex gap-3 p-3 border border-slate-200 rounded-lg hover:border-brand-primary hover:bg-blue-50/30 transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Product Image */}
      <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50 mt-0.5">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <Package className="w-8 h-8 text-[#9CA3AF]" />
        )}
      </div>

      {/* Middle: Name + SKU + Badges + History */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
        <div>
          <ProductInfo
            name={product.name}
            sku={product.sku}
            barcode={product.barcode}
            variant={product.variant}
            taxType={product.tax}
            promo={product.promo}
            attr={product.attr}
          />
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {product.preorderType === 'out_of_stock'  && <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">สินค้าหมด</span>}
            {product.preorderType === 'made_to_order' && <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">สั่งผลิตพิเศษ</span>}
            {product.preorderType === 'import'        && <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">นำเข้า</span>}
          </div>
          {showLastOrder && product.lastOrderDate && product.lastOrderId && (
            <div className="text-[10px] text-emerald-500 mt-1">
              ซื้อล่าสุด: {new Date(product.lastOrderDate).toLocaleDateString('th-TH', {
                day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit'
              })} • #{product.lastOrderId}
            </div>
          )}
          {showPurchaseCount && product.purchaseCount && (
            <div className="text-[10px] text-violet-500 mt-1">
              ซื้อแล้ว {product.purchaseCount} ครั้ง
            </div>
          )}
        </div>
      </div>

      {/* Right: Price + Stock + Controls */}
      <div className="shrink-0 flex flex-col items-end justify-between gap-1.5">
        <div className="text-right">
          <p className="font-bold text-brand-primary text-sm">
            ฿{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {product.promo?.sameSku && product.promo.minQty && product.promo.freeQty ? (
            <p className="text-[10px] text-amber-600">
              สั่งได้ {Math.floor(product.stock / (product.promo.minQty + product.promo.freeQty)) * product.promo.minQty} {product.unit}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400">สต็อก: {product.stock}</p>
          )}
        </div>
        {showQuantityControls && (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <QuantityInput
              value={localQty}
              onChange={(newQty) => { setLocalQty(newQty); onQuantityChange?.(newQty); }}
              min={1}
            />
            <Button
              onClick={handleAddClick}
              className="h-8 px-3 bg-brand-primary hover:bg-blue-600 text-white text-xs font-semibold rounded-lg"
            >
              เพิ่ม
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
