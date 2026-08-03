/** Stable store pin coordinates for the contact map (Yerevan). */
export type ContactStoreLocation = {
  /** Matches index in localized `storeAddresses`. */
  id: string;
  lat: number;
  lng: number;
};

/**
 * Coordinates aligned with `contact.storeAddresses` order (hy/en/ru).
 * Approximate street positions for map display.
 */
export const CONTACT_STORE_LOCATIONS: readonly ContactStoreLocation[] = [
  { id: "khorenatsi-95-2", lat: 40.1668, lng: 44.5102 },
  { id: "khorenatsi-88", lat: 40.1655, lng: 44.5078 },
  { id: "pushkin-43-3", lat: 40.1832, lng: 44.5148 },
  { id: "totovents-2-7", lat: 40.1948, lng: 44.5286 },
  { id: "baghramyan-50-5", lat: 40.1916, lng: 44.5042 },
  { id: "isakov-27", lat: 40.1674, lng: 44.4768 },
  { id: "andranik-94-4", lat: 40.1612, lng: 44.4895 },
  { id: "sebastia-16-1", lat: 40.1746, lng: 44.4638 },
  { id: "tigran-petrosyan-13-8", lat: 40.2042, lng: 44.4965 },
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
