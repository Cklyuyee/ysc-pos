/**
 * Skeleton loader primitive — shimmer placeholder while async content loads.
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />           // single bar
 *   <Skeleton className="h-12 w-12 rounded-full" />  // avatar
 *
 * For lists/tables, render N <Skeleton /> rows with the layout of the real
 * item so the user perceives the page as "ready, just loading data" rather
 * than "blank, broken."
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-md bg-gray-200 ${className}`}
    />
  );
}

/** Convenience: stacked text lines — e.g. a customer name + sub-line. */
export function SkeletonText({
  lines = 2,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/** Convenience: one mock product/cart row — image + 2 text lines + amount. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="w-12 h-12 rounded-[8px] shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
}
