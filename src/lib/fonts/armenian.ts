import { Noto_Sans_Armenian, Noto_Serif_Armenian } from "next/font/google";

/** Display face for Armenian poster titles (auth / brand moments). */
export const notoSerifArmenian = Noto_Serif_Armenian({
  variable: "--font-noto-serif-armenian",
  subsets: ["armenian"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

/** Clean Armenian UI face for auth supporting copy. */
export const notoSansArmenian = Noto_Sans_Armenian({
  variable: "--font-noto-sans-armenian",
  subsets: ["armenian"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
