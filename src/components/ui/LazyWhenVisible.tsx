"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type LazyWhenVisibleProps = {
  children: ReactNode;
  /** Reserved space before content mounts — reduces CLS. */
  minHeight?: CSSProperties["minHeight"];
  /** Start loading before the section enters the viewport. */
  rootMargin?: string;
  className?: string;
};

/**
 * Mounts children only when the placeholder nears the viewport.
 * Keeps below-fold client islands and media off the critical path.
 */
export function LazyWhenVisible({
  children,
  minHeight,
  rootMargin = "360px 0px",
  className,
}: LazyWhenVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    function reveal(): void {
      setVisible(true);
    }

    if (typeof IntersectionObserver === "undefined") {
      const frameId = window.requestAnimationFrame(reveal);
      return () => window.cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        reveal();
        observer.disconnect();
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={visible || minHeight == null ? undefined : { minHeight }}
    >
      {visible ? <div className="page-enter">{children}</div> : null}
    </div>
  );
}
