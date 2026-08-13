"use client";

import Image from "next/image";
import { useState, type ComponentProps } from "react";

type HeroArtImageProps = ComponentProps<typeof Image> & {
  /** Skip the rise-in delay — used when a parent already animates the art. */
  instant?: boolean;
};

/**
 * Hero art that rises in when its bitmap is ready instead of popping in.
 * `next/image` also fires `onLoad` for cached images, so a warm load still
 * resolves to the visible state.
 */
export function HeroArtImage({
  alt,
  className,
  instant = false,
  onLoad,
  onError,
  ...imageProps
}: HeroArtImageProps) {
  const [ready, setReady] = useState(instant);

  return (
    <Image
      {...imageProps}
      alt={alt}
      className={`hero-art-enter ${ready ? "hero-art-enter--ready" : ""} ${
        className ?? ""
      }`}
      onLoad={(event) => {
        setReady(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        setReady(true);
        onError?.(event);
      }}
    />
  );
}
