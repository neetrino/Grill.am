"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

import type { ProductGalleryImage } from "@/features/products/types";

type ProductGalleryProps = {
  images: ProductGalleryImage[];
  title: string;
  discountPercent?: number | null;
  inStock: boolean;
  outOfStockLabel: string;
  zoomLabel: string;
  closeZoomLabel: string;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function ProductGallery({
  images,
  title,
  discountPercent = null,
  inStock,
  outOfStockLabel,
  zoomLabel,
  closeZoomLabel,
}: ProductGalleryProps) {
  const [selectedId, setSelectedId] = useState(images[0]?.id ?? null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const selected =
    images.find((image) => image.id === selectedId) ?? images[0] ?? null;

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
    <div className="flex flex-col gap-3">
      <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 sm:h-[28rem] lg:h-[32rem]">
        {selected ? (
          <button
            type="button"
            onClick={openLightbox}
            className="group relative h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            aria-label={zoomLabel}
          >
            <Image
              src={selected.url}
              alt={selected.alt || title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
              priority
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-gray-900/80 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <ZoomIn className="h-3.5 w-3.5" aria-hidden />
              {zoomLabel}
            </span>
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
        {discountPercent != null ? (
          <span className="pointer-events-none absolute top-3 right-3 z-10 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        ) : null}
        {!inStock ? (
          <span className="pointer-events-none absolute top-3 left-3 z-10 rounded bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
            {outOfStockLabel}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2" role="list">
          {images.map((image) => {
            const isActive = image.id === selected?.id;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(image.id)}
                  aria-label={image.alt || title}
                  aria-pressed={isActive}
                  className={`relative h-16 w-16 overflow-hidden rounded-md border bg-gray-100 transition ${
                    isActive
                      ? "border-gray-900 ring-2 ring-gray-900/20"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-black/90 p-0 text-white backdrop:bg-black/80 open:flex open:flex-col"
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
              onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40"
            >
              <ZoomIn className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={closeZoomLabel}
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40"
            >
              <ZoomOut className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={closeZoomLabel}
              onClick={closeLightbox}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/10 hover:bg-white/20"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        {lightboxOpen && selected ? (
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
                priority
              />
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
