"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Commute } from "@/lib/commute";
import { formatPrice } from "@/lib/format";
import { format, formatNumber, type Lang } from "@/lib/kit/i18n";
import type { Listing } from "@/lib/listings";
import { TEXT } from "@/lib/text";
import { CommuteLabel, listingTitle } from "./listing-list";

/** The two ticked listings side by side, row by row. */
export function CompareTable({ listings, commutes, loading, lang, onClear }: { listings: readonly Listing[]; commutes: Map<string, Commute> | null; loading: boolean; lang: Lang; onClear: () => void }) {
  const t = TEXT[lang];
  const rows: { label: string; cell: (l: Listing) => React.ReactNode }[] = [
    { label: t.rowPrice, cell: (l) => formatPrice(l.price, lang) },
    { label: t.rowType, cell: (l) => t.types[l.type] },
    { label: t.rowBeds, cell: (l) => l.beds },
    { label: t.rowBaths, cell: (l) => formatNumber(l.baths, lang, l.baths % 1 ? 1 : 0) },
    { label: t.rowArea, cell: (l) => format(t.areaShort, { n: formatNumber(l.area, lang) }) },
    { label: t.rowBuilt, cell: (l) => l.built },
    { label: t.rowCommunity, cell: (l) => l.community },
    { label: t.rowCommute, cell: (l) => <CommuteLabel commute={commutes?.get(l.id)} loading={loading} lang={lang} /> },
  ];
  return (
    <section aria-labelledby="compare-title" className="flex flex-col gap-2" data-compare="">
      <div className="flex items-center justify-between gap-2">
        <h2 id="compare-title" className="text-sm font-medium">
          {t.compareTitle}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t.clearCompare}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28" />
              {listings.map((l) => (
                <TableHead key={l.id} className="whitespace-normal">
                  {listingTitle(l, lang)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="text-muted-foreground">{row.label}</TableCell>
                {listings.map((l) => (
                  <TableCell key={l.id} className="tabular-nums">
                    {row.cell(l)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
