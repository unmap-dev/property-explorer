"use client";

import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatPrice } from "@/lib/format";
import { format, type Lang } from "@/lib/kit/i18n";
import { LISTING_TYPES, PRICE_STEPS, type ListingFilters, type ListingType } from "@/lib/listings";
import { TEXT } from "@/lib/text";

const ANY = "any";
const BEDS = [0, 1, 2, 3, 4];

/** Price, bedrooms, type and area: everything a listing carries, filtered in the browser. */
export function Filters({ value, onChange, sectors, lang }: { value: ListingFilters; onChange: (next: ListingFilters) => void; sectors: string[]; lang: Lang }) {
  const t = TEXT[lang];
  const prices = [{ value: ANY, label: t.anyPrice }, ...PRICE_STEPS.map((p) => ({ value: String(p), label: formatPrice(p, lang) }))];
  const areas = [{ value: ANY, label: t.anySector }, ...sectors.map((s) => ({ value: s, label: t.sectors[s] ?? s }))];
  return (
    <section aria-labelledby="filters-title" className="flex flex-col gap-3">
      <h2 id="filters-title" className="text-sm font-medium">
        {t.filtersTitle}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="price">{t.price}</FieldLabel>
          <Select items={prices} value={value.maxPrice === null ? ANY : String(value.maxPrice)} onValueChange={(v) => onChange({ ...value, maxPrice: v === ANY || v == null ? null : Number(v) })}>
            <SelectTrigger id="price" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {prices.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="sector">{t.sector}</FieldLabel>
          <Select items={areas} value={value.sector ?? ANY} onValueChange={(v) => onChange({ ...value, sector: v === ANY || v == null ? null : String(v) })}>
            <SelectTrigger id="sector" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {areas.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <FieldSet>
        <FieldLegend variant="label">{t.beds}</FieldLegend>
        <ToggleGroup variant="outline" size="sm" value={[String(value.minBeds)]} onValueChange={(v) => v[0] !== undefined && onChange({ ...value, minBeds: Number(v[0]) })} aria-label={t.beds}>
          {BEDS.map((n) => (
            <ToggleGroupItem key={n} value={String(n)}>
              {n === 0 ? t.anyBeds : format(t.bedsMin, { n })}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend variant="label">{t.type}</FieldLegend>
        <ToggleGroup variant="outline" size="sm" multiple value={value.types} onValueChange={(v) => onChange({ ...value, types: v as ListingType[] })} aria-label={t.type}>
          {LISTING_TYPES.map((type) => (
            <ToggleGroupItem key={type} value={type}>
              {t.types[type]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>
    </section>
  );
}
