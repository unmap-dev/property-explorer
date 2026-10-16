import type { Lang } from "./kit/i18n";

/**
 * What "nearby" means for a home: one Places nearby call per chosen listing, for these unmap
 * taxonomy ids (pipeline/geocoding/taxonomy.json), within NEARBY_RADIUS.
 */
export const AMENITIES: { id: string; label: Record<Lang, string> }[] = [
  { id: "shop.supermarket", label: { en: "Groceries", fr: "Épiceries" } },
  { id: "education.school", label: { en: "Schools", fr: "Écoles" } },
  { id: "recreation.park", label: { en: "Parks", fr: "Parcs" } },
  { id: "health.pharmacy", label: { en: "Pharmacies", fr: "Pharmacies" } },
  { id: "food.cafe", label: { en: "Coffee", fr: "Cafés" } },
];

/** Metres around a listing. A short walk, so "nearby" means what a buyer would mean. */
export const NEARBY_RADIUS = 1500;

/** Results asked for in the one call, across every category. */
export const NEARBY_LIMIT = 40;

/** The nearest few of each category, from one mixed list sorted by distance. */
export function groupNearby<T extends { category?: string; distance?: number }>(results: readonly T[], perCategory = 3): Map<string, T[]> {
  const out = new Map<string, T[]>(AMENITIES.map((a) => [a.id, []]));
  const sorted = [...results].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  for (const r of sorted) {
    const list = r.category ? out.get(r.category) : undefined;
    if (list && list.length < perCategory) list.push(r);
  }
  return out;
}
