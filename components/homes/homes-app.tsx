"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Geocoder } from "@/components/ui/geocoder";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useArea } from "@/hooks/use-area";
import { useCommutes } from "@/hooks/use-commutes";
import { COMMUTE_MINUTES, byCommute, reachOf, type CommuteMinutes, type CommuteMode } from "@/lib/commute";
import { ApiProblemAlert } from "@/lib/kit/api-problem";
import { AppHeader } from "@/lib/kit/app-header";
import { API_KEY, GATEWAY } from "@/lib/kit/config";
import { format, formatNumber, type Lang } from "@/lib/kit/i18n";
import { MissingKey } from "@/lib/kit/missing-key";
import { useLang } from "@/lib/kit/use-lang";
import { NO_FILTERS, SAMPLE_LISTINGS, filterListings, sectorsOf, type ListingFilters } from "@/lib/listings";
import { MANIFEST } from "@/lib/manifest";
import { TEXT } from "@/lib/text";
import { CommuteControls, type Destination } from "./commute";
import { CompareTable } from "./compare-table";
import { Filters } from "./filters";
import { ListingDetails } from "./listing-details";
import { ListingList } from "./listing-list";
import { HomesMap } from "./homes-map";

/** Downtown Calgary, the sample destination the app opens with, so commutes show at once. */
const SAMPLE_DESTINATION: Destination = { coordinates: [-114.0631, 51.0447], label: "Downtown Calgary", sample: true };
const CALGARY: [number, number] = [-114.07, 51.05];

/** The always-visible notice: no listing is real. */
function Notice({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Alert data-notice="">
      <TriangleAlertIcon />
      <AlertTitle>{t.noticeTitle}</AlertTitle>
      <AlertDescription>{t.notice}</AlertDescription>
    </Alert>
  );
}

/**
 * Property Explorer: fictional listings in real Calgary communities. The listings are sample
 * data, filtered here; the map, the destination search, the commute times, the travel-time areas
 * and the nearby places are live Unmap.
 */
export function HomesApp() {
  const [lang, setLang] = useLang();
  const t = TEXT[lang];
  const [filters, setFilters] = useState<ListingFilters>(NO_FILTERS);
  const [destination, setDestination] = useState<Destination | null>(SAMPLE_DESTINATION);
  const [mode, setMode] = useState<CommuteMode>("auto");
  const [minutes, setMinutes] = useState<CommuteMinutes>(COMMUTE_MINUTES[1]);
  const [withinOnly, setWithinOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [compared, setCompared] = useState<string[]>([]);
  const [searchSlot, setSearchSlot] = useState<HTMLDivElement | null>(null);

  const sectors = useMemo(() => sectorsOf(SAMPLE_LISTINGS), []);
  const filtered = useMemo(() => filterListings(SAMPLE_LISTINGS, filters), [filters]);
  const target = API_KEY ? (destination?.coordinates ?? null) : null;
  // Every listing's commute is asked for once per destination and mode, whatever the filters, so
  // narrowing them asks the API nothing.
  const [commuteState, retryCommutes] = useCommutes(target, SAMPLE_LISTINGS, mode);
  const [areaState, retryArea] = useArea(target, mode);
  const commutes = commuteState.status === "done" ? commuteState.data : null;
  const loadingCommutes = commuteState.status === "loading";

  const unavailable = commutes ? filtered.filter((l) => reachOf(commutes.get(l.id), minutes) === "unavailable").length : 0;
  const shown = useMemo(() => {
    const kept = withinOnly && commutes ? filtered.filter((l) => reachOf(commutes.get(l.id), minutes) === "within") : filtered;
    return byCommute(kept, commutes);
  }, [filtered, withinOnly, commutes, minutes]);
  const current = SAMPLE_LISTINGS.find((l) => l.id === selected) ?? null;
  const comparedListings = compared.map((id) => SAMPLE_LISTINGS.find((l) => l.id === id)!).filter(Boolean);
  const narrowed = shown.length !== SAMPLE_LISTINGS.length;

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader manifest={MANIFEST} lang={lang} onLang={setLang} />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="order-last flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-t p-3 lg:order-first lg:w-[440px] lg:flex-none lg:border-t-0 lg:border-r">
          <Notice lang={lang} />
          <CommuteControls
            destination={destination}
            onClear={() => {
              setDestination(null);
              setWithinOnly(false);
            }}
            searchSlot={setSearchSlot}
            mode={mode}
            onMode={setMode}
            minutes={minutes}
            onMinutes={setMinutes}
            withinOnly={withinOnly}
            onWithinOnly={setWithinOnly}
            lang={lang}
          />
          {commuteState.status === "error" ? <ApiProblemAlert error={commuteState.error} lang={lang} onRetry={retryCommutes} /> : null}
          {areaState.status === "error" ? <ApiProblemAlert error={areaState.error} lang={lang} onRetry={retryArea} /> : null}
          {loadingCommutes ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
              <Spinner /> {t.loadingCommutes}
            </p>
          ) : null}
          {destination && areaState.status === "done" ? (
            <p className="text-xs text-muted-foreground">{format(t.areaNote, { short: COMMUTE_MINUTES[0], long: COMMUTE_MINUTES[1] })}</p>
          ) : null}
          {withinOnly && unavailable ? (
            <p className="text-xs text-muted-foreground" data-unavailable={unavailable}>
              {unavailable === 1 ? t.unavailableNoteOne : format(t.unavailableNote, { n: unavailable })}
            </p>
          ) : null}
          <Separator />
          <Filters value={filters} onChange={setFilters} sectors={sectors} lang={lang} />
          <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite" data-listing-count="">
            {narrowed
              ? format(t.countOf, { n: formatNumber(shown.length, lang), total: formatNumber(SAMPLE_LISTINGS.length, lang) })
              : format(t.count, { n: formatNumber(SAMPLE_LISTINGS.length, lang) })}
          </p>
          {current ? (
            <ListingDetails key={current.id} listing={current} commute={commutes?.get(current.id)} loading={loadingCommutes} lang={lang} onClose={() => setSelected(null)} />
          ) : null}
          {comparedListings.length === 2 ? (
            <CompareTable listings={comparedListings} commutes={commutes} loading={loadingCommutes} lang={lang} onClear={() => setCompared([])} />
          ) : (
            <p className="text-xs text-muted-foreground">{comparedListings.length === 1 ? t.compareOne : t.compareHint}</p>
          )}
          {shown.length ? (
            <ListingList
              listings={shown}
              commutes={commutes}
              loading={loadingCommutes}
              selected={selected}
              compared={compared}
              onSelect={setSelected}
              onCompare={(id, on) => setCompared((prev) => (on ? [...prev, id].slice(-2) : prev.filter((x) => x !== id)))}
              lang={lang}
            />
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyDescription>{t.noneMatch}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters(NO_FILTERS);
                    setWithinOnly(false);
                  }}
                >
                  {t.clearFilters}
                </Button>
              </EmptyContent>
            </Empty>
          )}
          <p className="text-xs text-muted-foreground" data-attribution="">
            {MANIFEST.provenance.find((p) => p.kind === "dataset")?.attribution}
          </p>
        </aside>
        <main className="h-[45dvh] shrink-0 lg:h-auto lg:min-w-0 lg:flex-1">
          {API_KEY ? (
            <HomesMap
              listings={shown}
              selected={selected}
              compared={compared}
              destination={destination}
              area={areaState.status === "done" ? areaState.data : null}
              minutes={minutes}
              onSelect={setSelected}
              lang={lang}
            >
              {searchSlot
                ? createPortal(
                    <Geocoder
                      apiKey={API_KEY}
                      gateway={GATEWAY}
                      lang={lang}
                      limit={6}
                      proximity={CALGARY}
                      placeholder={t.searchPlaceholder}
                      emptyText={t.searchEmpty}
                      onSelect={(r) => setDestination({ coordinates: [r.lng, r.lat], label: r.name })}
                    />,
                    searchSlot,
                  )
                : null}
            </HomesMap>
          ) : (
            <MissingKey lang={lang} />
          )}
        </main>
      </div>
    </div>
  );
}
