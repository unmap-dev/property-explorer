/**
 * Commute times from the listings to a destination: from the Unmap Matrix API, never estimated
 * here. A listing the API had no answer for is "unavailable", which is not proof there is no
 * road, and the app says so rather than inventing a time. Plain TypeScript, unit-tested.
 */
import type { Listing } from "./listings";

export type CommuteMode = "auto" | "pedestrian";
export const COMMUTE_MODES: readonly CommuteMode[] = ["auto", "pedestrian"];

/** The travel-time areas drawn and the commute ceilings offered, in minutes. */
export const COMMUTE_MINUTES = [15, 30] as const;
export type CommuteMinutes = (typeof COMMUTE_MINUTES)[number];

/** The Matrix API answers at most 10 destinations per origin per call. */
export const MATRIX_MAX = 10;

export function chunks<T>(items: readonly T[], size = MATRIX_MAX): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** One listing's commute: null seconds when the API had no answer for that pair. */
export interface Commute {
  seconds: number | null;
  metres: number | null;
}

/**
 * Commutes keyed by listing id from the matrix rows, in call order. The listings are the
 * sources and the destination the one target, so each row's single cell is that listing's time.
 */
export function commutesById(
  listingsByCall: readonly (readonly Listing[])[],
  results: readonly { durations: (number | null)[][]; distances: (number | null)[][] }[],
): Map<string, Commute> {
  const out = new Map<string, Commute>();
  listingsByCall.forEach((listings, call) => {
    const result = results[call];
    listings.forEach((listing, i) => {
      out.set(listing.id, { seconds: result?.durations[i]?.[0] ?? null, metres: result?.distances[i]?.[0] ?? null });
    });
  });
  return out;
}

export type Reach = "within" | "beyond" | "unavailable";

/** Whether a listing's commute is within `minutes`, beyond it, or not known. */
export function reachOf(commute: Commute | undefined, minutes: number): Reach {
  if (!commute || commute.seconds === null) return "unavailable";
  return commute.seconds <= minutes * 60 ? "within" : "beyond";
}

/** Listings sorted by commute, quickest first, the unknown ones last in their own order. */
export function byCommute<T extends { id: string }>(listings: readonly T[], commutes: Map<string, Commute> | null): T[] {
  if (!commutes) return [...listings];
  const time = (l: T) => commutes.get(l.id)?.seconds ?? Infinity;
  return [...listings].sort((a, b) => time(a) - time(b));
}
