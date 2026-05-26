import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from './utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** sm = h-[26px] (product rows / inline), md = h-8 (forms) */
  size?: 'sm' | 'md';
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pill-shaped quantity stepper — − value +
 *
 * @example
 * <QuantityStepper value={qty} onChange={setQty} />
 * <QuantityStepper value={qty} onChange={setQty} size="sm" min={1} max={1000} />
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  disabled = false,
  size = 'sm',
  className,
}: QuantityStepperProps) {
  const isMin = value <= min;
  const isMax = value >= max;

  const decrement = () => {
    if (!disabled && !isMin) onChange(Math.max(min, value - step));
  };

  const increment = () => {
    if (!disabled && !isMax) onChange(Math.min(max, value + step));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
  };

  const sm = size === 'sm';

  return (
    <div
      className={cn(
        'inline-flex items-center border border-neutral-200 rounded-2xl bg-white px-1',
        sm ? 'h-[26px]' : 'h-8',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {/* Decrement */}
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || isMin}
        className={cn(
          'flex items-center justify-center transition-colors',
          sm ? 'w-5 h-full' : 'w-6 h-full',
          isMin || disabled
            ? 'text-neutral-300 cursor-not-allowed'
            : 'text-neutral-400 hover:text-neutral-700',
        )}
        aria-label="ลดจำนวน"
      >
        <Minus className="w-3 h-3" />
      </button>

      {/* Value input */}
      <input
        type="number"
        value={value}
        onChange={handleInput}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(
          'text-center font-bold tabular-nums leading-none',
          'bg-transparent border-0 outline-none',
          'text-brand-primary',
          '[appearance:textfield]',
          '[&::-webkit-inner-spin-button]:appearance-none',
          '[&::-webkit-outer-spin-button]:appearance-none',
          'disabled:cursor-not-allowed',
          sm ? 'w-10 text-c3' : 'w-12 text-c3',
        )}
      />

      {/* Increment */}
      <button
        type="button"
        onClick={increment}
        disabled={disabled || isMax}
        className={cn(
          'flex items-center justify-center transition-colors',
          sm ? 'w-5 h-full' : 'w-6 h-full',
          isMax || disabled
            ? 'text-neutral-300 cursor-not-allowed'
            : 'text-neutral-400 hover:text-neutral-700',
        )}
        aria-label="เพิ่มจำนวน"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
