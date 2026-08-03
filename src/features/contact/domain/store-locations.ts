/** Stable store pin coordinates for the contact map (Yerevan). */
export type ContactStoreLocation = {
  /** Matches index in localized `storeAddresses`. */
  id: string;
  lat: number;
  lng: number;
};

/**
 * Coordinates aligned with `contact.storeAddresses` order (hy/en/ru).
 * Sourced from OpenStreetMap Grill.am POIs where present, otherwise
 * the matching building footprint on that street.
 */
export const CONTACT_STORE_LOCATIONS: readonly ContactStoreLocation[] = [
  { id: "khorenatsi-95-2", lat: 40.165005, lng: 44.515743 },
  { id: "khorenatsi-88", lat: 40.165027, lng: 44.515194 },
  { id: "pushkin-43-3", lat: 40.185132, lng: 44.509099 },
  { id: "totovents-2-7", lat: 40.201621, lng: 44.568087 },
  { id: "baghramyan-50-5", lat: 40.19245, lng: 44.502045 },
  { id: "isakov-27", lat: 40.15625, lng: 44.455646 },
  { id: "andranik-94-4", lat: 40.17071, lng: 44.445947 },
  { id: "sebastia-16-1", lat: 40.185145, lng: 44.461127 },
  { id: "tigran-petrosyan-13-8", lat: 40.22152, lng: 44.495009 },
] as const;

export type ContactMapPin = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

/** Pairs localized address labels with coordinates by list order. */
export function buildContactMapPins(
  addresses: readonly string[],
): ContactMapPin[] {
  return CONTACT_STORE_LOCATIONS.flatMap((location, index) => {
    const label = addresses[index];
    if (!label) {
      return [];
    }
    return [
      {
        id: location.id,
        label,
        lat: location.lat,
        lng: location.lng,
      },
    ];
  });
}
