#!/usr/bin/env node
/**
 * Make the sample listings: 25 FICTIONAL homes for sale in Calgary, written to
 * data/listings.sample.json. No listing is real. None is scraped, and none has a street address.
 *
 * What is real is where they sit: each is placed at a point inside one of the City of Calgary's
 * residential community districts (fetched from Open Calgary, Open Government Licence – City of
 * Calgary), so the commute times and amenities the app asks Unmap for are answers about real
 * streets. Everything else (type, price, bedrooms, bathrooms, floor area, year built) is drawn
 * from a seeded random generator inside plausible ranges for the type, so the file is the same
 * every time the script runs.
 *
 *   node scripts/make-listings.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SOURCE = "https://data.calgary.ca/resource/surr-xmvs.geojson?$limit=5000";
const COUNT = 25;

/** A small deterministic generator (mulberry32), so the sample never changes by accident. */
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = seeded(20261015);
const between = (lo, hi) => lo + random() * (hi - lo);
const pick = (list) => list[Math.floor(random() * list.length)];

/** Whether a point is inside a ring (ray casting). */
function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** A point inside a polygon: the ring's centroid when it is inside, else a scan for one that is. */
function interiorPoint(polygon) {
  const ring = polygon[0];
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    area += cross;
    cx += (ring[j][0] + ring[i][0]) * cross;
    cy += (ring[j][1] + ring[i][1]) * cross;
  }
  const centroid = [cx / (3 * area), cy / (3 * area)];
  if (inRing(centroid, ring)) return centroid;
  const xs = ring.map((p) => p[0]);
  for (let step = 1; step < 40; step++)
    for (let k = 1; k < step; k++) {
      const p = [Math.min(...xs) + ((Math.max(...xs) - Math.min(...xs)) * k) / step, centroid[1]];
      if (inRing(p, ring)) return p;
    }
  return ring[0];
}

/** The largest polygon of a MultiPolygon, by vertex count, which is where most homes are. */
const largest = (geometry) =>
  geometry.type === "Polygon" ? geometry.coordinates : [...geometry.coordinates].sort((a, b) => b[0].length - a[0].length)[0];

const TYPES = [
  { type: "house", weight: 0.45, beds: [3, 5], baths: [2, 4], area: [1300, 2800], price: [560000, 1150000], built: [1955, 2022] },
  { type: "townhouse", weight: 0.25, beds: [2, 4], baths: [2, 3], area: [1050, 1700], price: [380000, 640000], built: [1975, 2023] },
  { type: "condo", weight: 0.3, beds: [1, 3], baths: [1, 2], area: [560, 1250], price: [230000, 520000], built: [1970, 2024] },
];
function chooseType() {
  let r = random();
  for (const t of TYPES) if ((r -= t.weight) <= 0) return t;
  return TYPES[0];
}

const titleCase = (name) => name.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
const round = (n, to) => Math.round(n / to) * to;

const response = await fetch(SOURCE, { headers: { accept: "application/geo+json" } });
if (!response.ok) throw new Error(`data.calgary.ca answered ${response.status}`);
const districts = (await response.json()).features
  .filter((f) => f.geometry && f.properties?.class === "Residential" && ["ESTABLISHED", "DEVELOPING", "COMPLETE"].includes(f.properties?.srg))
  .sort((a, b) => String(a.properties.name).localeCompare(String(b.properties.name)));

// Spread across the city: a few per sector, drawn without repeating a community.
const chosen = [];
const bySector = Map.groupBy(districts, (d) => d.properties.sector);
const sectors = [...bySector.keys()].sort();
while (chosen.length < COUNT) {
  for (const sector of sectors) {
    const pool = bySector.get(sector).filter((d) => !chosen.includes(d));
    if (pool.length && chosen.length < COUNT) chosen.push(pick(pool));
  }
}

const listings = chosen.map((district, i) => {
  const kind = chooseType();
  const [lng, lat] = interiorPoint(largest(district.geometry));
  const beds = Math.round(between(kind.beds[0], kind.beds[1]));
  return {
    id: `listing-${String(i + 1).padStart(2, "0")}`,
    type: kind.type,
    community: titleCase(district.properties.name),
    sector: district.properties.sector,
    price: round(between(kind.price[0], kind.price[1]), 5000),
    beds,
    baths: Math.min(beds + 1, Math.round(between(kind.baths[0], kind.baths[1]) * 2) / 2),
    area: round(between(kind.area[0], kind.area[1]), 10),
    built: Math.round(between(kind.built[0], kind.built[1])),
    coordinates: [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5],
  };
});

const file = {
  _provenance: {
    kind: "sample",
    note: "Fictional listings: no home here is for sale, real or scraped. Each is placed inside a real City of Calgary community district so commutes and amenities are real answers about real streets.",
    locations:
      "Points inside community districts from The City of Calgary, Community District Boundaries. Contains information licensed under the Open Government Licence – City of Calgary.",
    generatedBy: "scripts/make-listings.mjs (seeded; the same output every run)",
  },
  listings,
};
const out = path.join(process.cwd(), "data", "listings.sample.json");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`);
console.log(`[listings] ${listings.length} fictional listings -> data/listings.sample.json`);
