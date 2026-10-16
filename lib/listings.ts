/**
 * The sample listings and the filters over them. Plain TypeScript, unit-tested in
 * test/listings.test.ts. Every listing is fictional (data/listings.sample.json says so, and the app
 * says so wherever a listing is shown); only where it sits is real.
 */
import sample from "@/data/listings.sample.json";

export type ListingType = "house" | "townhouse" | "condo";
export const LISTING_TYPES: readonly ListingType[] = ["house", "townhouse", "condo"];

export interface Listing {
  id: string;
  type: ListingType;
  /** The real City of Calgary community district it sits in. */
  community: string;
  /** The city's sector for that district: CENTRE, NORTH, … */
  sector: string;
  /** Asking price, Canadian dollars. Fictional. */
  price: number;
  beds: number;
  baths: number;
  /** Floor area, square feet. */
  area: number;
  built: number;
  coordinates: [number, number];
}

export class ListingsError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join("; "));
    this.name = "ListingsError";
  }
}

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Check the listings file: every field present and in range, ids unique. Lists every problem. */
export function parseListings(data: unknown): Listing[] {
  const problems: string[] = [];
  const list = (data as { listings?: unknown })?.listings;
  if (!Array.isArray(list)) throw new ListingsError(["no `listings` array"]);
  const ids = new Set<string>();
  list.forEach((raw, i) => {
    const l = raw as Partial<Listing>;
    const at = `listing ${i + 1}`;
    if (typeof l.id !== "string" || !l.id) problems.push(`${at}: no id`);
    else if (ids.has(l.id)) problems.push(`${at}: duplicate id ${l.id}`);
    else ids.add(l.id);
    if (!LISTING_TYPES.includes(l.type as ListingType)) problems.push(`${at}: unknown type ${String(l.type)}`);
    if (typeof l.community !== "string" || typeof l.sector !== "string") problems.push(`${at}: no community or sector`);
    for (const key of ["price", "beds", "baths", "area", "built"] as const) if (!isNumber(l[key]) || l[key]! < 0) problems.push(`${at}: bad ${key}`);
    const c = l.coordinates;
    if (!Array.isArray(c) || c.length !== 2 || !isNumber(c[0]) || !isNumber(c[1]) || Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90)
      problems.push(`${at}: bad coordinates`);
  });
  if (problems.length) throw new ListingsError(problems);
  return list as Listing[];
}

export const SAMPLE_LISTINGS: readonly Listing[] = parseListings(sample);

export interface ListingFilters {
  /** Highest asking price, or null for any. */
  maxPrice: number | null;
  /** Fewest bedrooms, or 0 for any. */
  minBeds: number;
  /** Types to show; empty shows every type. */
  types: ListingType[];
  /** Sector to show, or null for every sector. */
  sector: string | null;
}

export const NO_FILTERS: ListingFilters = { maxPrice: null, minBeds: 0, types: [], sector: null };

/** Price ceilings offered, Canadian dollars. */
export const PRICE_STEPS = [400000, 600000, 800000, 1000000] as const;

export function filterListings(listings: readonly Listing[], f: ListingFilters): Listing[] {
  return listings.filter(
    (l) =>
      (f.maxPrice === null || l.price <= f.maxPrice) &&
      l.beds >= f.minBeds &&
      (f.types.length === 0 || f.types.includes(l.type)) &&
      (f.sector === null || l.sector === f.sector),
  );
}

/** The sectors the listings use, in a stable order. */
export const sectorsOf = (listings: readonly Listing[]) => [...new Set(listings.map((l) => l.sector))].sort();
