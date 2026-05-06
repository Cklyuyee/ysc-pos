import * as React from 'react';
import { Wine, Tag, Package } from 'lucide-react';

function filterProps<T extends Record<string, any>>(props: T): T {
  const filtered = { ...props } as any;
  for (const key in filtered) {
    if (key.startsWith("_fg") || key.startsWith("data-fg")) {
      delete filtered[key];
    }
  }
  return filtered;
}

interface TaxBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type?: 'V' | 'I';
  tax?: 'V' | 'I';
  taxType?: 'V' | 'I';
}

export const TaxBadge = React.forwardRef<HTMLSpanElement, TaxBadgeProps>(
  ({ type, tax, taxType, className = '', ...props }, ref) => {
    const taxValue = type || tax || taxType || 'V';
    const isVatable = taxValue === 'V';

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold font-sans ${isVatable ? 'bg-neutral-100 text-neutral-600' : 'bg-gray-400 text-white'} ${className}`}
        {...filterProps(props)}
      >
        {taxValue}
      </span>
    );
  }
);
TaxBadge.displayName = 'TaxBadge';

interface AttributeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type?: 'Oversize' | 'Fragile';
  attribute?: 'Oversize' | 'Fragile';
}

export const AttributeBadge = React.forwardRef<HTMLSpanElement, AttributeBadgeProps>(
  ({ type, attribute, className = '', ...props }, ref) => {
    const attrValue = type || attribute || 'Oversize';
    const isFragile = attrValue === 'Fragile';
    const displayLabel = isFragile ? 'แตกหักง่าย' : 'ขนาดใหญ่';

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold font-sans ${
          isFragile ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
        } ${className}`}
        {...filterProps(props)}
      >
        {isFragile ? <Wine className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
        {displayLabel}
      </span>
    );
  }
);
AttributeBadge.displayName = 'AttributeBadge';

interface PromoBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  description: string;
  withIcon?: boolean;
}

export const PromoBadge = React.forwardRef<HTMLSpanElement, PromoBadgeProps>(
  ({ description, withIcon = true, className = '', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 font-sans ${className}`}
        {...filterProps(props)}
      >
        {withIcon && <Tag className="w-3.5 h-3.5" />}
        {description}
      </span>
    );
  }
);
PromoBadge.displayName = 'PromoBadge';
