import { Minus, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QuantityInputProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * QuantityInput Component
 * ปุ่มควบคุมจำนวนสินค้าแบบ +/- พร้อม input field
 * ใช้ใน Cart, Order Creation, Quote Creation และหน้าจัดการสินค้าอื่นๆ
 *
 * @example
 * <QuantityInput
 *   value={item.qty}
 *   onChange={(newQty) => updateCartQty(item.id, newQty)}
 *   min={1}
 * />
 */
export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  className = '',
  disabled = false
}: QuantityInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = max ? Math.min(max, value + 1) : value + 1;
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    // Only update parent if it's a valid number
    const numValue = parseInt(inputVal, 10);
    if (!isNaN(numValue)) {
      let validValue = Math.max(min, numValue);
      if (max) {
        validValue = Math.min(max, validValue);
      }
      onChange(validValue);
    }
  };

  const handleInputBlur = () => {
    // Reset to current value if input is invalid or exceeds max
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < min || (max && numValue > max)) {
      setInputValue(value.toString());
      onChange(value);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className={`bg-white h-8 border border-[#e5e7eb] rounded-lg flex items-center px-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <button
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="w-6 h-full flex items-center justify-center text-[#9ca3af] hover:text-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        type="button"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleFocus}
        disabled={disabled}
        className="w-12 text-center font-['Google_Sans'] font-bold text-[#2563eb] text-[14px] leading-none tabular-nums bg-transparent border-0 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:cursor-not-allowed"
        min={min}
        max={max}
      />
      <button
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && value >= max)}
        className="w-6 h-full flex items-center justify-center text-[#9ca3af] hover:text-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        type="button"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
