import Image from "next/image";
import Link from "next/link";

type AdminBrandLogoProps = {
  locale: string;
  brandName: string;
  storeHomeLabel: string;
  /** Compact square mark for collapsed sidebar. */
  compact?: boolean;
  onNavigate?: () => void;
  className?: string;
};

/** Grill logo mark used in admin chrome (replaces text brand label). */
export function AdminBrandLogo({
  locale,
  brandName,
  storeHomeLabel,
  compact = false,
  onNavigate,
  className = "",
}: AdminBrandLogoProps) {
  const sizeClass = compact
    ? "relative block h-9 w-9 shrink-0"
    : "relative block h-9 w-[92px] shrink-0";

  return (
    <Link
      href={`/${locale}`}
      title={storeHomeLabel}
      aria-label={storeHomeLabel}
      onClick={onNavigate}
      className={`${sizeClass} ${className}`.trim()}
    >
      <Image
        src="/assets/brand/logo.webp"
        alt={brandName}
        fill
        sizes={compact ? "36px" : "92px"}
        className="object-contain object-left"
        priority
      />
    </Link>
  );
}
