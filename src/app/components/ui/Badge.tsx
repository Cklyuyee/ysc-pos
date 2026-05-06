import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline' | 'secondary' | (string & {});
  bg?: string;
  text?: string;
  border?: string;
  children?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ icon: Icon, label, variant = 'default', bg, text, border, className = '', children, ...props }, ref) => {
    // Default variants if custom colors not provided
    const variants: Record<string, { bg: string; text: string; border: string }> = {
      default: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      },
      success: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      },
      warning: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      },
      danger: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      },
      info: {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
      },
      neutral: {
        bg: 'bg-neutral-50',
        text: 'text-neutral-700',
        border: 'border-neutral-200',
      },
      outline: {
        bg: 'bg-transparent',
        text: 'text-neutral-700',
        border: 'border-neutral-300',
      },
      secondary: {
        bg: 'bg-neutral-100',
        text: 'text-neutral-600',
        border: 'border-neutral-200',
      },
    };

    const variantConfig = variants[variant] ?? variants['default'];
    const bgClass = bg || variantConfig.bg;
    const textClass = text || variantConfig.text;
    const borderClass = border || variantConfig.border;

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${bgClass} ${textClass} ${borderClass} ${className}`}
        {...props}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {(label || children) && (
          <span className="text-xs font-semibold leading-none">{label ?? children}</span>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
