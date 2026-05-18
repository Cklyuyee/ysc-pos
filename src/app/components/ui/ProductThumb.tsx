import { useState } from 'react';

/**
 * ProductThumb — product image with coloured-initial placeholder fallback.
 *
 * When no `image` URL is provided, or the URL fails to load, renders a
 * coloured avatar tile with the first printable character of `name`.
 * The colour is stable — same name always gets the same palette entry.
 */

const PALETTE = [
  { bg: '#E5F2FF', text: '#0197FF' }, // sky-blue
  { bg: '#EEF2FF', text: '#4F46E5' }, // indigo
  { bg: '#F0FDF4', text: '#16A34A' }, // green
  { bg: '#FFF7ED', text: '#EA580C' }, // orange
  { bg: '#FDF2F8', text: '#9D174D' }, // pink / rose
  { bg: '#F0FDFA', text: '#0D9488' }, // teal
  { bg: '#FFFBEB', text: '#B45309' }, // amber
  { bg: '#F5F3FF', text: '#7C3AED' }, // violet
  { bg: '#FFF1F2', text: '#BE123C' }, // crimson
  { bg: '#ECFEFF', text: '#0E7490' }, // cyan
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i);
  }
  // convert to unsigned 32-bit
  return h >>> 0;
}

interface ProductThumbProps {
  /** Image URL (adeptioImages[0] or imageUrl from backend) */
  image?: string;
  /** Product name — used for placeholder letter & colour hashing */
  name: string;
  /** Pixel size of the square thumbnail. Defaults to 48. */
  size?: number;
  /** Extra className forwarded to the outer div */
  className?: string;
}

/**
 * Usage:
 * ```tsx
 * <ProductThumb image={product.image} name={product.name} size={48} />
 * ```
 */
export function ProductThumb({ image, name, size = 48, className = '' }: ProductThumbProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(image) && !imgFailed;

  const color = PALETTE[hashStr(name || '?') % PALETTE.length];
  // first printable character (handles Thai, Latin, numbers)
  const initial = ([...name]).find(c => c.trim() !== '') ?? '?';
  const fontSize = Math.round(size * 0.4);

  return (
    <div
      className={`rounded-[8px] overflow-hidden shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: showImg ? '#F3F4F6' : color.bg,
      }}
    >
      {showImg ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          className="font-bold select-none leading-none"
          style={{ color: color.text, fontSize }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
