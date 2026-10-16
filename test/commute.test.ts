import { describe, expect, it } from "vitest";
import { groupNearby } from "@/lib/amenities";
import { byCommute, chunks, commutesById, reachOf } from "@/lib/commute";
import { SAMPLE_LISTINGS } from "@/lib/listings";

describe("commutes", () => {
  it("asks the matrix for at most 10 listings a call", () => {
    expect(chunks(SAMPLE_LISTINGS).map((c) => c.length)).toEqual([10, 10, 5]);
  });

  it("reads each listing's time from its row, and keeps a missing answer missing", () => {
    const groups = [SAMPLE_LISTINGS.slice(0, 2), SAMPLE_LISTINGS.slice(2, 3)];
    const results = [
      { durations: [[600], [null]], distances: [[5000], [null]] },
      { durations: [[2400]], distances: [[30000]] },
    ];
    const out = commutesById(groups, results);
    expect(out.get(SAMPLE_LISTINGS[0]!.id)).toEqual({ seconds: 600, metres: 5000 });
    expect(out.get(SAMPLE_LISTINGS[1]!.id)).toEqual({ seconds: null, metres: null });
    expect(out.get(SAMPLE_LISTINGS[2]!.id)).toEqual({ seconds: 2400, metres: 30000 });
  });

  it("says within, beyond or unavailable, never guessing", () => {
    expect(reachOf({ seconds: 900, metres: 1 }, 15)).toBe("within");
    expect(reachOf({ seconds: 901, metres: 1 }, 15)).toBe("beyond");
    expect(reachOf({ seconds: null, metres: null }, 15)).toBe("unavailable");
    expect(reachOf(undefined, 30)).toBe("unavailable");
  });

  it("sorts quickest first with unknown commutes last", () => {
    const [a, b, c] = SAMPLE_LISTINGS;
    const times = new Map([
      [a!.id, { seconds: 1800, metres: 1 }],
      [b!.id, { seconds: null, metres: null }],
      [c!.id, { seconds: 600, metres: 1 }],
    ]);
    expect(byCommute([a!, b!, c!], times).map((l) => l.id)).toEqual([c!.id, a!.id, b!.id]);
    expect(byCommute([a!, b!], null).map((l) => l.id)).toEqual([a!.id, b!.id]);
  });
});

describe("nearby", () => {
  it("keeps the nearest three of each amenity and drops other categories", () => {
    const results = [
      { category: "shop.supermarket", distance: 900 },
      { category: "shop.supermarket", distance: 100 },
      { category: "shop.supermarket", distance: 500 },
      { category: "shop.supermarket", distance: 1400 },
      { category: "food.restaurant", distance: 50 },
      { category: "recreation.park", distance: 300 },
    ];
    const groups = groupNearby(results);
    expect(groups.get("shop.supermarket")!.map((r) => r.distance)).toEqual([100, 500, 900]);
    expect(groups.get("recreation.park")).toHaveLength(1);
    expect(groups.has("food.restaurant")).toBe(false);
  });
});
