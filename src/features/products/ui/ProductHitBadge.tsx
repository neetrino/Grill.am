type ProductHitBadgeProps = {
  label: string;
  className?: string;
};

/** Featured (“HIT”) pill — gallery and product cards share the same mark. */
export function ProductHitBadge({ label, className = "" }: ProductHitBadgeProps) {
  return (
    <span
      className={`pointer-events-none rounded-full bg-brand-red font-bold text-white ${className}`}
    >
      {label}
    </span>
  );
}
