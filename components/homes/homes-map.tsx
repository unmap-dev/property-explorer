"use client";

import { useEffect, type ReactNode } from "react";
import type { FeatureCollection } from "@unmap/sdk";
import { GeoJSONLayer } from "@/components/ui/geojson-layer";
import { Map } from "@/components/ui/map";
import { MapControls } from "@/components/ui/map-controls";
import { Marker } from "@/components/ui/marker-popup";
import type { CommuteMinutes } from "@/lib/commute";
import { formatPriceShort } from "@/lib/format";
import { API_KEY, GATEWAY } from "@/lib/kit/config";
import type { Lang } from "@/lib/kit/i18n";
import type { Listing } from "@/lib/listings";
import { useMap, useMapReady } from "@/lib/map-context";
import { TEXT } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { Destination } from "./commute";
import { listingTitle } from "./listing-list";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
type Bounds = [number, number, number, number];

const boundsOf = (points: readonly (readonly [number, number])[]): Bounds | null =>
  points.length
    ? points.reduce<Bounds>((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity])
    : null;

/** Fits every listing (and the destination) when either changes, and eases to a chosen listing. */
function Camera({ listings, destination, selected }: { listings: readonly Listing[]; destination: Destination | null; selected: Listing | null }) {
  const map = useMap();
  const ready = useMapReady();
  const key = `${listings.map((l) => l.id).sort().join(",")}|${destination?.coordinates.join(",") ?? ""}`;
  useEffect(() => {
    const b = boundsOf([...listings.map((l) => l.coordinates), ...(destination ? [destination.coordinates] : [])]);
    if (!map || !ready || !b) return;
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 56, maxZoom: 14, duration: reduceMotion() ? 0 : 600 });
    // Only a new set of listings or a new destination moves the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ready, key]);
  useEffect(() => {
    if (!map || !ready || !selected) return;
    map.easeTo({ center: selected.coordinates, zoom: Math.max(map.getZoom(), 13), duration: reduceMotion() ? 0 : 500 });
  }, [map, ready, selected]);
  return null;
}

export interface HomesMapProps {
  listings: readonly Listing[];
  selected: string | null;
  compared: string[];
  destination: Destination | null;
  area: FeatureCollection | null;
  minutes: CommuteMinutes;
  onSelect: (id: string) => void;
  lang: Lang;
  /** The panel's map-aware registry part (the destination geocoder), as a portal into the panel. */
  children?: ReactNode;
}

/**
 * The live map: every listing as a price tag (registry `marker-popup`), the destination, and the
 * 15 and 30-minute areas around it (registry `geojson-layer`), the chosen one stronger.
 */
export function HomesMap({ listings, selected, compared, destination, area, minutes, onSelect, lang, children }: HomesMapProps) {
  const t = TEXT[lang];
  const current = listings.find((l) => l.id === selected) ?? null;
  return (
    <div role="region" aria-label={t.mapLabel} className="relative h-full min-h-0">
      <Map apiKey={API_KEY} gateway={GATEWAY} style="base" lang={lang} center={[-114.07, 51.04]} zoom={10} controls={false} className="rounded-none" containerStyle={{ position: "absolute", inset: 0, minHeight: 0 }}>
        <Camera listings={listings} destination={destination} selected={current} />
        <MapControls position="bottom-right" />
        {area ? (
          <GeoJSONLayer
            id="homes-area"
            data={area as never}
            fillPaint={{ "fill-opacity": ["case", ["==", ["get", "contour"], minutes], 0.22, 0.07] }}
            linePaint={{ "line-width": ["case", ["==", ["get", "contour"], minutes], 2, 1], "line-opacity": 0.6 }}
            circlePaint={false}
          />
        ) : null}
        {listings.map((l) => {
          const active = l.id === selected;
          return (
            <Marker
              key={l.id}
              lngLat={l.coordinates}
              markerContent={
              <button
                type="button"
                aria-label={listingTitle(l, lang)}
                aria-pressed={active}
                data-listing-pin={l.id}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums shadow-md transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : compared.includes(l.id) ? "border-primary bg-background text-foreground" : "border-border bg-background text-foreground hover:bg-muted",
                )}
                onClick={() => onSelect(l.id)}
              >
                {formatPriceShort(l.price, lang)}
              </button>
              }
            />
          );
        })}
        {destination ? (
          <Marker
            lngLat={destination.coordinates}
            markerContent={<span aria-label={t.destinationPin} data-destination-pin="" className="block size-5 rotate-45 rounded-sm border-[3px] border-background bg-foreground shadow-lg" />}
          />
        ) : null}
        {children}
      </Map>
    </div>
  );
}
