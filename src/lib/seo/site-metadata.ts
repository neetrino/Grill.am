import type { Metadata } from "next";

const SITE_NAME = "Grill.am";
const OG_IMAGE_PATH = "/og-image.png";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

const OPEN_GRAPH_LOCALE: Record<string, string> = {
  hy: "hy_AM",
  en: "en_US",
  ru: "ru_RU",
};

/** Builds metadataBase from the public app URL (required for absolute OG/Twitter image URLs). */
export function getMetadataBase(appUrl: string): URL {
  const normalized = appUrl.endsWith("/") ? appUrl : `${appUrl}/`;
  return new URL(normalized);
}

function getShareImageUrl(appUrl: string): string {
  return new URL(OG_IMAGE_PATH, getMetadataBase(appUrl)).toString();
}

function createShareImageMetadata(appUrl: string): Pick<
  Metadata,
  "openGraph" | "twitter"
> {
  const shareImageUrl = getShareImageUrl(appUrl);
  const alt = `${SITE_NAME} — fresh grilled food delivery`;

  return {
    openGraph: {
      images: [
        {
          url: shareImageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [shareImageUrl],
    },
  };
}

/** Site-wide defaults for link previews (Telegram, Instagram, Facebook, etc.). */
export function createRootMetadata(appUrl: string): Metadata {
  const metadataBase = getMetadataBase(appUrl);
  const description = "Fresh grilled food delivery in Armenia";
  const share = createShareImageMetadata(appUrl);

  return {
    metadataBase,
    title: {
      default: SITE_NAME,
      template: `%s · ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      locale: "hy_AM",
      alternateLocale: ["en_US", "ru_RU"],
      ...share.openGraph,
    },
    twitter: {
      title: SITE_NAME,
      description,
      ...share.twitter,
    },
  };
}

/** Locale-aware description and Open Graph locale for storefront pages. */
export function createLocaleMetadata(
  locale: string,
  description: string,
  appUrl: string,
): Metadata {
  const ogLocale = OPEN_GRAPH_LOCALE[locale] ?? "hy_AM";
  const share = createShareImageMetadata(appUrl);

  return {
    description,
    openGraph: {
      description,
      locale: ogLocale,
      title: SITE_NAME,
      ...share.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      description,
      title: SITE_NAME,
      ...share.twitter,
    },
  };
}
