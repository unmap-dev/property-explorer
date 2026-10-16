"use client";

import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useNearby } from "@/hooks/use-nearby";
import { AMENITIES, groupNearby } from "@/lib/amenities";
import type { Commute } from "@/lib/commute";
import { formatPrice } from "@/lib/format";
import { ApiProblemAlert } from "@/lib/kit/api-problem";
import { API_KEY } from "@/lib/kit/config";
import { format, formatDistance, formatNumber, type Lang } from "@/lib/kit/i18n";
import type { Listing } from "@/lib/listings";
import { TEXT } from "@/lib/text";
import { CommuteLabel, listingTitle } from "./listing-list";

/** One listing opened: its numbers, its commute, and what is within 1.5 km of it. */
export function ListingDetails({ listing, commute, loading, lang, onClose }: { listing: Listing; commute: Commute | undefined; loading: boolean; lang: Lang; onClose: () => void }) {
  const t = TEXT[lang];
  const [nearby, retry] = useNearby(API_KEY ? listing.coordinates : null, lang);
  const groups = nearby.status === "done" ? groupNearby(nearby.data) : null;
  return (
    <Card size="sm" data-listing-details={listing.id}>
      <CardHeader className="flex flex-row items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <CardTitle className="text-base">{listingTitle(listing, lang)}</CardTitle>
          <span className="flex items-center gap-2 text-sm">
            <span className="font-medium tabular-nums">{formatPrice(listing.price, lang)}</span>
            <Badge variant="outline">{t.fictional}</Badge>
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={t.closeAria} onClick={onClose}>
          <XIcon />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">{t.rowBaths}</dt>
          <dd className="tabular-nums">{formatNumber(listing.baths, lang, listing.baths % 1 ? 1 : 0)}</dd>
          <dt className="text-muted-foreground">{t.rowArea}</dt>
          <dd className="tabular-nums">{format(t.areaShort, { n: formatNumber(listing.area, lang) })}</dd>
          <dt className="text-muted-foreground">{t.rowBuilt}</dt>
          <dd className="tabular-nums">{listing.built}</dd>
          <dt className="text-muted-foreground">{t.rowCommute}</dt>
          <dd>
            <CommuteLabel commute={commute} loading={loading} lang={lang} />
          </dd>
        </dl>
        {API_KEY ? (
          <section aria-labelledby="nearby-title" className="flex flex-col gap-2" data-nearby="">
            <h3 id="nearby-title" className="text-xs font-medium text-muted-foreground">
              {t.nearbyTitle}
            </h3>
            {nearby.status === "error" ? (
              <ApiProblemAlert error={nearby.error} lang={lang} onRetry={retry} />
            ) : !groups ? (
              <Spinner />
            ) : [...groups.values()].every((g) => !g.length) ? (
              <p className="text-xs text-muted-foreground">{t.noneNearby}</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {AMENITIES.map((a) => {
                  const found = groups.get(a.id) ?? [];
                  if (!found.length) return null;
                  return (
                    <li key={a.id} className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{a.label[lang]}</span>
                      {found.map((r) => (
                        <span key={r.id} className="flex justify-between gap-2">
                          <span className="truncate">{r.name}</span>
                          {r.distance !== undefined ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{format(t.away, { distance: formatDistance(r.distance, lang) })}</span> : null}
                        </span>
                      ))}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
