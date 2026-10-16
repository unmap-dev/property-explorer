"use client";

import type { GeocodeResult } from "@unmap/sdk";
import { AMENITIES, NEARBY_LIMIT, NEARBY_RADIUS } from "@/lib/amenities";
import { getUnmap } from "@/lib/kit/client";
import type { Lang } from "@/lib/kit/i18n";
import { useAsync } from "@/lib/use-async";

/** Groceries, schools, parks, pharmacies and coffee around a listing: one Places nearby call. */
export function useNearby(at: [number, number] | null, lang: Lang) {
  const key = at ? `${at.join(",")}|${lang}` : null;
  return useAsync<GeocodeResult[]>(key, async (signal) => {
    const unmap = getUnmap();
    if (!unmap || !at) throw new Error("No API key");
    return unmap.geocoder.nearby(
      AMENITIES.map((a) => a.id),
      { near: at, radius: NEARBY_RADIUS, limit: NEARBY_LIMIT, lang, signal },
    );
  });
}
