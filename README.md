# Property Explorer, built with Unmap

A property search with commute analysis, on a live Unmap map: 25 **fictional** homes for sale in
real Calgary communities, filtered by price, bedrooms, type and area; driving and walking commute
times to an office you search for; the areas within 15 and 30 minutes of it; what is within a
short walk of a home; and two homes side by side. One of the [Unmap apps](https://unmap.dev/apps);
live at [apps.unmap.dev/property-explorer](https://apps.unmap.dev/property-explorer/).

**No listing is real.** None is for sale, none is scraped, and none has a street address: the
type, price, bedrooms, bathrooms, floor area and year are drawn by a seeded script. What is real
is where they sit, one point inside each of 25 of the City of Calgary's residential community
districts, so the commute times, travel-time areas and nearby places are real Unmap answers about
real streets (see [`DATA_SOURCES.md`](DATA_SOURCES.md)). The app says so on screen at all times.

## Run it

You need Node 24 (22.18+ works), pnpm and a free Unmap browser key from
[unmap.dev/dashboard](https://unmap.dev/dashboard).

```bash
cp .env.example .env.local      # then set NEXT_PUBLIC_UNMAP_KEY
pnpm install
pnpm dev                        # http://localhost:3205
```

Without a key the app still lists and filters the listings and says how to get one; it never
calls the API with a missing key.

| Command | |
| --- | --- |
| `pnpm dev` | development server on port 3205 |
| `pnpm build` | static export in `out/` |
| `pnpm test` | unit tests (Vitest) |
| `pnpm lint` / `pnpm typecheck` | |
| `pnpm make-listings` | regenerate `data/listings.sample.json` (seeded: the same file every run) |
| `pnpm run deploy` | build, then `wrangler deploy` to your Cloudflare account (edit `wrangler.jsonc` first) |

The key ships in the browser bundle. Restrict it to your origins (`http://localhost:3205` and your
domain) in the dashboard. Any static host works: `out/` is plain files.

## What it asks Unmap, and when

| When | Call | Requests |
| --- | --- | --- |
| A destination is set (on load, the sample one) or the mode changes | `router.matrix(listings, [destination], { mode })`, 10 listings a call | 3 |
| The same | `router.isochrone(destination, { minutes: [15, 30], mode })` | 1 |
| You open a listing | `geocoder.nearby([groceries, schools, parks, pharmacies, coffee], { near, radius: 1500 })` | 1 |
| You type a destination | the registry `geocoder`'s autocomplete | as you type |

Commutes are asked for every listing once per destination and mode, whatever the filters, and
kept: narrowing the filters or switching back to a mode asks nothing. A listing the matrix has no
answer for is marked **commute unavailable** and is never given a made-up time; while you filter
by time it is left out, and the panel says how many.

The listed times come from the Matrix API, door to door. The shaded areas come from the Isochrone
API, which draws a generalised polygon, so a home near an edge can show a time just over the line
while sitting just inside the shading. The filter goes by the listed time.

## Use your own listings

Write `data/listings.sample.json` yourself (`{ "listings": [ … ] }`, each with `id`, `type`
(`house`, `townhouse` or `condo`), `community`, `sector`, `price`, `beds`, `baths`, `area`,
`built` and `coordinates` `[lng, lat]`). `parseListings()` in `lib/listings.ts` checks it and
lists every problem it finds. Then update the sample entries in `lib/manifest.ts`,
`DATA_SOURCES.md` and the sample destination in `components/homes/homes-app.tsx`. Real listings
come with their own licence and terms; check them before you publish.

## How it is built

```
app/page.tsx                 the one page; renders the app in the browser
components/homes/            the app: notice, commute, filters, list, details, comparison, map
components/ui/  lib/map-*    Unmap registry components and shadcn primitives, copied in unmodified
lib/kit/                     the Unmap app kit (header, Built with Unmap panel, errors, en/fr), copied in
hooks/                       one hook per call: commutes (matrix), area (isochrone), nearby
lib/listings.ts              the listings, their validator and filters (no React, no fetch)
lib/commute.ts               matrix batching, reading the rows, within/beyond/unavailable
lib/amenities.ts             the nearby categories and their grouping
lib/manifest.ts              what the Built with Unmap panel lists
lib/text.ts                  this app's words in English and French
scripts/make-listings.mjs    generates data/listings.sample.json (no dependencies)
```

Layers run one way: components → hooks → `lib/` (plain TypeScript, unit-tested) → `@unmap/sdk`,
the only thing that talks to the API. The map pieces are Unmap registry components; install the
same ones in your own project with
`npx @unmap/cli add map geocoder marker-popup geojson-layer map-controls`.

In the Unmap monorepo the copied files are kept in step by `pnpm sync` and `test/sync.test.ts`; in
your own copy they are ordinary source you can edit.

## Licence

Code: MIT. The listings are fictional; the community districts they are placed in are from the
City of Calgary under the Open Government Licence – City of Calgary, see
[`data/LICENSE-DATA.md`](data/LICENSE-DATA.md). Map data © OpenStreetMap contributors (ODbL),
served by Unmap.
