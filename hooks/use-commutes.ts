"use client";

import { getUnmap } from "@/lib/kit/client";
import { chunks, commutesById, type Commute, type CommuteMode } from "@/lib/commute";
import type { Listing } from "@/lib/listings";
import { useAsync } from "@/lib/use-async";

/** Answers already fetched, by destination and mode: switching back asks the API nothing. */
const cache = new Map<string, Map<string, Commute>>();

/**
 * Commute time and distance from every listing to the destination, from the Unmap Matrix API:
 * at most 10 listings per call, the calls sent together. Nothing is requested until there is a
 * destination. Null cells stay null.
 */
export function useCommutes(destination: [number, number] | null, listings: readonly Listing[], mode: CommuteMode) {
  const key = destination ? `${destination.join(",")}|${mode}|${listings.map((l) => l.id).join(",")}` : null;
  return useAsync(key, async (signal) => {
    const hit = key ? cache.get(key) : undefined;
    if (hit) return hit;
    const unmap = getUnmap();
    if (!unmap || !destination) throw new Error("No API key");
    const groups = chunks(listings);
    const results = await Promise.all(groups.map((group) => unmap.router.matrix(group.map((l) => l.coordinates), [destination], { mode, signal })));
    const out = commutesById(groups, results);
    cache.set(key!, out);
    return out;
  });
}
