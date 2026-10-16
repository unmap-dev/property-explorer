"use client";

import type { FeatureCollection } from "@unmap/sdk";
import { getUnmap } from "@/lib/kit/client";
import { COMMUTE_MINUTES, type CommuteMode } from "@/lib/commute";
import { useAsync } from "@/lib/use-async";

/** The areas within 15 and 30 minutes of the destination, from the Unmap Isochrone API, in one call. */
export function useArea(destination: [number, number] | null, mode: CommuteMode) {
  const key = destination ? `${destination.join(",")}|${mode}` : null;
  return useAsync<FeatureCollection>(key, async (signal) => {
    const unmap = getUnmap();
    if (!unmap || !destination) throw new Error("No API key");
    return unmap.router.isochrone(destination, { minutes: [...COMMUTE_MINUTES], mode, signal });
  });
}
