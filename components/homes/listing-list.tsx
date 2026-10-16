"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Commute } from "@/lib/commute";
import { formatPrice } from "@/lib/format";
import { format, formatDuration, formatNumber, type Lang } from "@/lib/kit/i18n";
import type { Listing } from "@/lib/listings";
import { TEXT } from "@/lib/text";
import { cn } from "@/lib/utils";

/** A listing's one-line name: "3-bed house in Hillhurst". */
export function listingTitle(l: Listing, lang: Lang): string {
  const t = TEXT[lang];
  return format(t.title, { beds: l.beds, type: t.types[l.type].toLowerCase(), community: l.community }).replace(/^./, (c) => c.toUpperCase());
}

/** The commute as a listing shows it: a time, "unavailable", or nothing before there is a destination. */
export function CommuteLabel({ commute, loading, lang }: { commute: Commute | undefined; loading: boolean; lang: Lang }) {
  const t = TEXT[lang];
  if (loading) return <span className="text-muted-foreground">…</span>;
  if (!commute) return null;
  if (commute.seconds === null) return <span className="text-muted-foreground" data-commute="unavailable">{t.unavailable}</span>;
  return (
    <span className="font-medium tabular-nums" data-commute={commute.seconds}>
      {formatDuration(commute.seconds, lang)}
    </span>
  );
}

/**
 * The listings that pass the filters, quickest commute first once there is a destination. A card
 * is a button for the map; its checkbox adds it to the comparison (two at most).
 */
export function ListingList({
  listings,
  commutes,
  loading,
  selected,
  compared,
  onSelect,
  onCompare,
  lang,
}: {
  listings: readonly Listing[];
  commutes: Map<string, Commute> | null;
  loading: boolean;
  selected: string | null;
  compared: string[];
  onSelect: (id: string) => void;
  onCompare: (id: string, on: boolean) => void;
  lang: Lang;
}) {
  const t = TEXT[lang];
  return (
    <ul className="flex flex-col divide-y border-y" data-listings="">
      {listings.map((l) => {
        const title = listingTitle(l, lang);
        const isCompared = compared.includes(l.id);
        return (
          <li key={l.id} className={cn("flex items-start gap-3 px-3 py-2.5", selected === l.id && "bg-muted")} data-listing={l.id}>
            <Checkbox
              className="mt-1"
              checked={isCompared}
              disabled={!isCompared && compared.length >= 2}
              onCheckedChange={(on: boolean) => onCompare(l.id, on)}
              aria-label={format(t.compareAria, { title })}
            />
            <button type="button" className="flex min-w-0 flex-1 flex-col gap-0.5 text-left" aria-label={format(t.select, { title })} aria-pressed={selected === l.id} onClick={() => onSelect(l.id)}>
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium tabular-nums">{formatPrice(l.price, lang)}</span>
                <CommuteLabel commute={commutes?.get(l.id)} loading={loading} lang={lang} />
              </span>
              <span className="truncate text-sm">{title}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {format(t.bedsShort, { n: l.beds })} · {format(t.bathsShort, { n: formatNumber(l.baths, lang, l.baths % 1 ? 1 : 0) })} · {format(t.areaShort, { n: formatNumber(l.area, lang) })}
              </span>
            </button>
            <Badge variant="outline" className="shrink-0">
              {t.fictional}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
