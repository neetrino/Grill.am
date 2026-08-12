"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { ProductGalleryImage } from "@/features/products/types";
import type { Locale } from "@/lib/i18n/config";

type ProductGalleryProps = {
  images: ProductGalleryImage[];
  title: string;
  hitLabel?: string | null;
  inStock: boolean;
  outOfStockLabel: string;
  zoomLabel: string;
  closeZoomLabel: string;
  locale?: Locale;
  productId?: string;
  inWishlist?: boolean;
  isSignedIn?: boolean;
  wishlistLabel?: string;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function ProductGallery({
  images,
  title,
  hitLabel = null,
  inStock,
  outOfStockLabel,
  zoomLabel,
  closeZoomLabel,
  locale,
  productId,
  inWishlist = false,
  isSignedIn = false,
  wishlistLabel,
}: ProductGalleryProps) {
  const [selectedId, setSelectedId] = useState(images[0]?.id ?? null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const selected =
    images.find((image) => image.id === selectedId) ?? images[0] ?? null;
  const showWishlist =
    locale != null && productId != null && wishlistLabel != null;

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setZoom(MIN_ZOOM);
    dialogRef.current?.close();
  }, []);

  const openLightbox = useCallback(() => {
    if (!selected) return;
    setLightboxOpen(true);
    setZoom(MIN_ZOOM);
    dialogRef.current?.showModal();
  }, [selected]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleClose(): void {
      setLightboxOpen(false);
      setZoom(MIN_ZOOM);
    }

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  return (
    <div className="flex flex-col gap-[35px]">
      <div
        data-product-fly-origin
        className="relative aspect-[744/600] w-full overflow-hidden rounded-[30px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.09)] lg:aspect-[764/580]"
      >
        {selected?.url ? (
          <button
            type="button"
            onClick={openLightbox}
            className="group relative h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            aria-label={zoomLabel}
          >
            <Image
              src={selected.url}
              alt={selected.alt || title}
              fill
              sizes="(max-width: 1024px) 100vw, 764px"
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              priority
            />
          </button>
        ) : (
          <div className="relative h-full w-full bg-white" aria-hidden />
        )}

        {hitLabel ? (
          <span className="pointer-events-none absolute top-5 left-5 z-10 rounded-full bg-brand-red px-3 py-1.5 text-sm leading-5 font-bold text-white">
            {hitLabel}
          </span>
        ) : null}

        {!inStock ? (
          <span className="pointer-events-none absolute top-5 left-5 z-10 rounded-full bg-gray-900/90 px-3 py-1.5 text-sm font-semibold text-white">
            {outOfStockLabel}
          </span>
        ) : null}

        {showWishlist ? (
          <WishlistButton
            locale={locale}
            productId={productId}
            initialInWishlist={inWishlist}
            isSignedIn={isSignedIn}
            label={wishlistLabel}
            size="md"
            tone="onImageBrand"
            className="absolute top-3 right-3 z-10 size-10 bg-white shadow-none hover:bg-white md:top-[30px] md:right-6 md:size-[52px] [&>svg]:h-[16px] [&>svg]:w-[18px] md:[&>svg]:h-[23px] md:[&>svg]:w-[26px]"
          />
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-3" role="list">
          {images.map((image) => {
            const isActive = image.id === selected?.id;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(image.id)}
                  aria-label={image.alt || title}
                  aria-pressed={isActive}
                  className={`relative size-20 overflow-hidden rounded-[14px] bg-white transition ${
                    isActive
                      ? "opacity-100 shadow-[0_0_0_2px_#fff,0_0_0_4px_#0a0a0a]"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {image.url ? (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-white/55 p-0 text-neutral-900 shadow-none backdrop-blur-2xl backdrop:bg-white/35 backdrop:backdrop-blur-md open:flex open:flex-col"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            closeLightbox();
          }
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p id={titleId} className="truncate text-sm font-medium">
            {selected?.alt || title}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={zoomLabel}
              disabled={zoom >= MAX_ZOOM}
              onClick={() =>
                setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-black/5 text-neutral-800 hover:bg-black/10 disabled:opacity-40"
            >
              <ZoomIn className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={closeZoomLabel}
              disabled={zoom <= MIN_ZOOM}
              onClick={() =>
                setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-black/5 text-neutral-800 hover:bg-black/10 disabled:opacity-40"
            >
              <ZoomOut className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={closeZoomLabel}
              onClick={closeLightbox}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-black/5 text-neutral-800 hover:bg-black/10"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        {lightboxOpen && selected?.url ? (
          <div className="relative flex flex-1 items-center justify-center overflow-auto px-4 pb-8">
            <div
              className="relative h-[70vh] w-full max-w-5xl transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoom})` }}
            >
              <Image
                src={selected.url}
                alt={selected.alt || title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
