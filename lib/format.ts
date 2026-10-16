import type { Lang } from "./kit/i18n";

/** An asking price in Canadian dollars, without cents: $640,000 or 640 000 $. */
export function formatPrice(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
}

/** A price short enough for a map tag: $640K, $1.2M; 640 k $ in French. */
export function formatPriceShort(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}
