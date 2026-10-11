import { describe, it, expect } from "vitest";
import { matchesSearchQuery, normalizeSearchString } from "../lib/search";

describe("Search matching utility", () => {
  const pandalNewTown = {
    id: "ZJS5eEWRfhVJRuaTm54S",
    name: "New Town Durga Puja Committee, BG Block",
    locality: "Action Area 1B",
    address: "Green Varge, 7, Street Number 131, Sub-Central Business District(Action Area 1), Action Area 1B, New Town, West Bengal 700163",
    category: "Pandal",
  };

  const pandalKashiBose = {
    id: "kashi-1",
    name: "Kashi Bose Lane Durga Puja Committee",
    locality: "Manicktala",
    address: "Kashi Bose Lane, Manicktala, Kolkata",
    category: "Pandal",
  };

  const metroBelgachia = {
    id: "metro-1",
    name: "Belgachia Metro Station",
    locality: "Belgachia",
    category: "Metro",
    facilities: ["Metro", "Transit"],
  };

  it("normalizes search strings by stripping spaces and non-alphanumerics", () => {
    expect(normalizeSearchString("New Town")).toBe("newtown");
    expect(normalizeSearchString("Lake Town, South Dumdum")).toBe("laketownsouthdumdum");
  });

  it("matches 'newtown' without spaces to 'New Town Durga Puja Committee'", () => {
    expect(matchesSearchQuery(pandalNewTown, "newtown")).toBe(true);
    expect(matchesSearchQuery(pandalNewTown, "new town")).toBe(true);
    expect(matchesSearchQuery(pandalNewTown, "NEWTOWN")).toBe(true);
    expect(matchesSearchQuery(pandalNewTown, "bg block")).toBe(true);
    expect(matchesSearchQuery(pandalNewTown, "action area")).toBe(true);
  });

  it("does not falsely match unrelated pandals", () => {
    expect(matchesSearchQuery(pandalKashiBose, "newtown")).toBe(false);
    expect(matchesSearchQuery(pandalKashiBose, "saltlake")).toBe(false);
  });

  it("matches Kashi Bose Lane with spaces or without spaces", () => {
    expect(matchesSearchQuery(pandalKashiBose, "kashibose")).toBe(true);
    expect(matchesSearchQuery(pandalKashiBose, "kashi bose")).toBe(true);
    expect(matchesSearchQuery(pandalKashiBose, "manicktala")).toBe(true);
  });

  it("matches civic utilities like metro", () => {
    expect(matchesSearchQuery(metroBelgachia, "metro")).toBe(true);
    expect(matchesSearchQuery(metroBelgachia, "belgachia")).toBe(true);
    expect(matchesSearchQuery(metroBelgachia, "toilet")).toBe(false);
  });

  it("returns true for empty search query", () => {
    expect(matchesSearchQuery(pandalNewTown, "")).toBe(true);
    expect(matchesSearchQuery(pandalNewTown, "   ")).toBe(true);
  });
});
