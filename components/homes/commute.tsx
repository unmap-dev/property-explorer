"use client";

import { MapPinIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { COMMUTE_MINUTES, COMMUTE_MODES, type CommuteMinutes, type CommuteMode } from "@/lib/commute";
import { format, type Lang } from "@/lib/kit/i18n";
import { TEXT } from "@/lib/text";

export interface Destination {
  coordinates: [number, number];
  label: string;
  /** The preset one the app opens with, labelled as a sample. */
  sample?: boolean;
}

/**
 * Where the commute goes and how: the destination (the registry geocoder arrives in `searchSlot`
 * as a portal from inside the map, so it reaches the map's context), driving or walking, 15 or
 * 30 minutes, and whether to keep only the listings within that time.
 */
export function CommuteControls({
  destination,
  onClear,
  searchSlot,
  mode,
  onMode,
  minutes,
  onMinutes,
  withinOnly,
  onWithinOnly,
  lang,
}: {
  destination: Destination | null;
  onClear: () => void;
  searchSlot: (el: HTMLDivElement | null) => void;
  mode: CommuteMode;
  onMode: (mode: CommuteMode) => void;
  minutes: CommuteMinutes;
  onMinutes: (minutes: CommuteMinutes) => void;
  withinOnly: boolean;
  onWithinOnly: (on: boolean) => void;
  lang: Lang;
}) {
  const t = TEXT[lang];
  return (
    <section aria-labelledby="commute-title" className="flex flex-col gap-3">
      <h2 id="commute-title" className="text-sm font-medium">
        {t.destinationTitle}
      </h2>
      <div ref={searchSlot} />
      {destination ? (
        <div className="flex items-center gap-2 text-sm" data-destination="">
          <MapPinIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{destination.sample ? t.sampleDestination : destination.label}</span>
          {destination.sample ? <Badge variant="secondary">{t.sample}</Badge> : null}
          <Button variant="ghost" size="icon-sm" aria-label={t.close} onClick={onClear}>
            <XIcon />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t.destinationIntro}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <ToggleGroup variant="outline" size="sm" value={[mode]} onValueChange={(v) => v[0] && onMode(v[0] as CommuteMode)} aria-label={t.modeAria}>
          {COMMUTE_MODES.map((m) => (
            <ToggleGroupItem key={m} value={m}>
              {t.modes[m]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup variant="outline" size="sm" value={[String(minutes)]} onValueChange={(v) => v[0] && onMinutes(Number(v[0]) as CommuteMinutes)} aria-label={t.minutesAria}>
          {COMMUTE_MINUTES.map((n) => (
            <ToggleGroupItem key={n} value={String(n)}>
              {format(t.minutes, { n })}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <Field orientation="horizontal">
        <Checkbox id="within-only" checked={withinOnly} disabled={!destination} onCheckedChange={(on: boolean) => onWithinOnly(on)} />
        <FieldLabel htmlFor="within-only">{format(t.withinOnly, { n: minutes })}</FieldLabel>
      </Field>
    </section>
  );
}
