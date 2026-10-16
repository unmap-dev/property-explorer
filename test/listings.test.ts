import { describe, expect, it } from "vitest";
import { ListingsError, NO_FILTERS, SAMPLE_LISTINGS, filterListings, parseListings, sectorsOf } from "@/lib/listings";

describe("the sample listings", () => {
  it("are 25 valid, uniquely named fictional homes across every sector", () => {
    expect(SAMPLE_LISTINGS).toHaveLength(25);
    expect(new Set(SAMPLE_LISTINGS.map((l) => l.id)).size).toBe(25);
    expect(sectorsOf(SAMPLE_LISTINGS)).toEqual(["CENTRE", "EAST", "NORTH", "NORTHEAST", "NORTHWEST", "SOUTH", "SOUTHEAST", "WEST"]);
    for (const l of SAMPLE_LISTINGS) {
      // Inside Calgary.
      expect(l.coordinates[0]).toBeGreaterThan(-114.4);
      expect(l.coordinates[0]).toBeLessThan(-113.8);
      expect(l.coordinates[1]).toBeGreaterThan(50.8);
      expect(l.coordinates[1]).toBeLessThan(51.25);
    }
  });

  it("lists every problem in a bad file", () => {
    try {
      parseListings({ listings: [{ id: "a", type: "castle", community: "X", sector: "N", price: -1, beds: 1, baths: 1, area: 1, built: 2000, coordinates: [500, 1] }, { id: "a" }] });
      throw new Error("accepted");
    } catch (error) {
      expect(error).toBeInstanceOf(ListingsError);
      const problems = (error as ListingsError).problems;
      expect(problems).toContain("listing 1: unknown type castle");
      expect(problems).toContain("listing 1: bad price");
      expect(problems).toContain("listing 1: bad coordinates");
      expect(problems).toContain("listing 2: duplicate id a");
    }
  });
});

describe("filters", () => {
  it("narrow by price, bedrooms, type and sector, and keep everything with none set", () => {
    expect(filterListings(SAMPLE_LISTINGS, NO_FILTERS)).toHaveLength(25);
    const cheap = filterListings(SAMPLE_LISTINGS, { ...NO_FILTERS, maxPrice: 400000 });
    expect(cheap.length).toBeGreaterThan(0);
    expect(cheap.every((l) => l.price <= 400000)).toBe(true);
    expect(filterListings(SAMPLE_LISTINGS, { ...NO_FILTERS, minBeds: 4 }).every((l) => l.beds >= 4)).toBe(true);
    expect(filterListings(SAMPLE_LISTINGS, { ...NO_FILTERS, types: ["condo"] }).every((l) => l.type === "condo")).toBe(true);
    expect(filterListings(SAMPLE_LISTINGS, { ...NO_FILTERS, sector: "CENTRE" }).every((l) => l.sector === "CENTRE")).toBe(true);
  });
});
