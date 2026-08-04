import type { ReactNode } from "react";

type DesktopFluidFrameProps = {
  children: ReactNode;
  className?: string;
  /** When true, desktop stage does not clip overflowing decorative content. */
  allowOverflow?: boolean;
};

/**
 * Scales the fixed 1440px desktop canvas to 100vw (MaMarie-style),
 * so resizing/zooming keeps the same composition.
 * Below `lg`, children render at natural width with no zoom.
 */
export function DesktopFluidFrame({
  children,
  className,
  allowOverflow = false,
}: DesktopFluidFrameProps) {
  const frameClassName = [
    "desktop-fluid-frame w-full",
    allowOverflow ? "desktop-fluid-frame--allow-overflow" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClassName}>
      <div className="desktop-fluid-stage flex w-full min-h-dvh flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
