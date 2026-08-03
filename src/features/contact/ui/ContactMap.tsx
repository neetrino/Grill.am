"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, DivIcon, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  buildContactMapPins,
  type ContactMapPin,
} from "@/features/contact/domain/store-locations";

type ContactMapProps = {
  title: string;
  addresses: readonly string[];
  openRouteLabel: string;
};

const MAP_FIT_PADDING: [number, number] = [40, 40];

type SafariGestureEvent = Event & { scale: number };

/** Safari trackpad pinch uses gesture events; Chrome/Firefox use ctrl+wheel. */
function enableTrackpadPinchZoom(map: LeafletMap): () => void {
  const el = map.getContainer();
  let zoomAtGestureStart = map.getZoom();

  const onGestureStart = (event: Event) => {
    event.preventDefault();
    zoomAtGestureStart = map.getZoom();
  };

  const onGestureChange = (event: Event) => {
    event.preventDefault();
    const { scale } = event as SafariGestureEvent;
    if (!Number.isFinite(scale) || scale <= 0) {
      return;
    }
    map.setZoom(zoomAtGestureStart + Math.log2(scale), { animate: false });
  };

  el.addEventListener("gesturestart", onGestureStart, { passive: false });
  el.addEventListener("gesturechange", onGestureChange, { passive: false });

  return () => {
    el.removeEventListener("gesturestart", onGestureStart);
    el.removeEventListener("gesturechange", onGestureChange);
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildRouteUrl(pin: ContactMapPin): string {
  // Opens Yandex Maps with a route to the pin (mobile often hands off to Navigator).
  return `https://yandex.ru/maps/?rtext=~${pin.lat},${pin.lng}&rtt=auto`;
}

const MARKER_HTML = `
  <span class="contact-map-marker__pin" aria-hidden="true">
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8.059 0 0 8.059 0 18c0 12.75 18 26 18 26s18-13.25 18-26C36 8.059 27.941 0 18 0z" fill="#DB0B20"/>
      <circle cx="18" cy="17" r="9.5" fill="white"/>
      <g fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13.2 12.2v3.8c0 .7.5 1.2 1.2 1.2h2.2c.7 0 1.2-.5 1.2-1.2v-3.8"/>
        <path d="M15.5 12.2V23"/>
        <path d="M22.8 19.5V12.2a2.8 2.8 0 0 0-2.8 2.8v3.3c0 .7.5 1.2 1.2 1.2h1.6z"/>
        <path d="M22.8 19.5V23"/>
      </g>
    </svg>
  </span>
`;

/** Interactive contact map with all store pins visible and clickable. */
export function ContactMap({
  title,
  addresses,
  openRouteLabel,
}: ContactMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const addressesKey = addresses.join("\0");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let disposeTrackpadPinch: (() => void) | null = null;

    async function setupMap(): Promise<void> {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) {
        return;
      }

      const mapRoot = containerRef.current;
      const pins = buildContactMapPins(addressesKey.split("\0").filter(Boolean));
      const map = L.map(mapRoot, {
        scrollWheelZoom: true,
        touchZoom: true,
        // Trackpads send small continuous deltas — keep zoom responsive.
        wheelPxPerZoomLevel: 80,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon: DivIcon = L.divIcon({
        className: "contact-map-marker",
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -40],
        html: MARKER_HTML,
      });

      const bounds: LatLngBounds = L.latLngBounds([]);

      for (const pin of pins) {
        const marker = L.marker([pin.lat, pin.lng], {
          icon,
          title: pin.label,
          alt: pin.label,
        }).addTo(map);

        marker.bindPopup(
          `<div class="contact-map-popup">
            <p class="contact-map-popup__label">${escapeHtml(pin.label)}</p>
            <a class="contact-map-popup__link" href="${buildRouteUrl(pin)}" target="_blank" rel="noopener noreferrer">
              <span>${escapeHtml(openRouteLabel)}</span>
              <svg class="contact-map-popup__arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>`,
          { maxWidth: 260, className: "contact-map-popup-root" },
        );

        bounds.extend([pin.lat, pin.lng]);
      }

      const onlyPin = pins.length === 1 ? pins[0] : undefined;
      if (onlyPin) {
        map.setView([onlyPin.lat, onlyPin.lng], 15);
      } else if (pins.length > 1) {
        map.fitBounds(bounds, { padding: MAP_FIT_PADDING, maxZoom: 13 });
      } else {
        map.setView([40.1812, 44.5145], 12);
      }

      if (cancelled) {
        map.remove();
        return;
      }

      mapRef.current = map;
      disposeTrackpadPinch = enableTrackpadPinchZoom(map);
      if (cancelled) {
        disposeTrackpadPinch();
        disposeTrackpadPinch = null;
        map.remove();
        mapRef.current = null;
        return;
      }
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapRoot);
    }

    void setupMap();

    return () => {
      cancelled = true;
      disposeTrackpadPinch?.();
      disposeTrackpadPinch = null;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [addressesKey, openRouteLabel]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="overflow-hidden rounded-[15px] border border-gray-100 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <div
          ref={containerRef}
          role="region"
          aria-label={title}
          className="contact-map relative z-0 h-[280px] bg-gray-100 sm:h-[340px] lg:h-[400px]"
        />
      </div>
    </section>
  );
}
