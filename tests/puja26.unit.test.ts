import { describe, expect, it } from "vitest";
import { normalizePhoneNumber } from "../lib/auth";
import {
  calculateDistanceKm,
  estimateRouteMetrics,
  generateGoogleMapsDirectionsUrl,
} from "../lib/routes";
import { formatTimeAgo, isLocationStale } from "../lib/liveLocation";
import { getAIRecommendation } from "../lib/ai";
import { fetchKolkataWeather } from "../lib/weather";
import { SEED_LOCATIONS } from "../lib/seedData";

describe("Phone Number Normalization", () => {
  it("normalizes a standard 10-digit Indian mobile number with +91", () => {
    expect(normalizePhoneNumber("9830123456")).toBe("+919830123456");
  });

  it("preserves an existing international prefix", () => {
    expect(normalizePhoneNumber("+919830123456")).toBe("+919830123456");
    expect(normalizePhoneNumber("+14155552671")).toBe("+14155552671");
  });

  it("handles leading 0 by stripping it and adding +91", () => {
    expect(normalizePhoneNumber("09830123456")).toBe("+919830123456");
  });

  it("strips whitespace, dashes, and parentheses", () => {
    expect(normalizePhoneNumber("(9830) 123-456")).toBe("+919830123456");
  });
});

describe("Routing & Haversine Distance Calculation", () => {
  it("calculates accurate distance between Sreebhumi and Bagbazar", () => {
    // Sreebhumi (22.6012, 88.4035) to Bagbazar (22.6044, 88.3667) is roughly 3.8 km
    const dist = calculateDistanceKm(22.6012, 88.4035, 22.6044, 88.3667);
    expect(dist).toBeGreaterThan(3.0);
    expect(dist).toBeLessThan(4.5);
  });

  it("calculates 0 distance when identical coordinates are passed", () => {
    expect(calculateDistanceKm(22.5726, 88.3639, 22.5726, 88.3639)).toBe(0);
  });

  it("estimates walking metrics and duration for multi-stop routes", () => {
    const stops = [SEED_LOCATIONS[0], SEED_LOCATIONS[1], SEED_LOCATIONS[2]];
    const metrics = estimateRouteMetrics(stops, "walking");
    expect(metrics.totalDistanceKm).toBeGreaterThan(0);
    expect(metrics.durationMinutes).toBeGreaterThan(30);
    expect(metrics.summaryText).toContain("3 stops");
  });

  it("generates correct Google Maps directions URL with origin, destination, and waypoints", () => {
    const stops = [SEED_LOCATIONS[0], SEED_LOCATIONS[1], SEED_LOCATIONS[2]];
    const url = generateGoogleMapsDirectionsUrl(stops, "walking");
    expect(url).toContain("https://www.google.com/maps/dir/");
    expect(url).toContain("travelmode=walking");
    expect(url).toContain(`origin=${stops[0].latitude},${stops[0].longitude}`);
    expect(url).toContain("waypoints=");
  });
});

describe("Live GPS Stale Detection & Time Formatting", () => {
  it("marks timestamp from 1 minute ago as not stale", () => {
    const oneMinAgo = Date.now() - 60 * 1000;
    expect(isLocationStale(oneMinAgo)).toBe(false);
  });

  it("marks timestamp older than 3 minutes as stale", () => {
    const fourMinAgo = Date.now() - 4 * 60 * 1000;
    expect(isLocationStale(fourMinAgo)).toBe(true);
  });

  it("formats recent timestamps human-readably", () => {
    const tenSecAgo = Date.now() - 10 * 1000;
    expect(formatTimeAgo(tenSecAgo)).toBe("Just now");

    const twoMinAgo = Date.now() - 120 * 1000;
    expect(formatTimeAgo(twoMinAgo)).toBe("2m ago");
  });
});

describe("AI Pandal Recommendation Service", () => {
  it("curates metro-connected pandals when query mentions metro", async () => {
    const rec = await getAIRecommendation("find pandals near metro stations", SEED_LOCATIONS);
    expect(rec.title).toContain("Metro");
    expect(rec.stops.length).toBeGreaterThan(0);
    expect(rec.stops.some((s) => s.name.includes("Sovabazar") || s.name.includes("Bagbazar") || s.name.includes("Mohammad Ali"))).toBe(true);
  });

  it("curates low walking circuits when query requests minimal walking", async () => {
    const rec = await getAIRecommendation("make a route with less walking", SEED_LOCATIONS);
    expect(rec.title).toContain("Walking");
    expect(rec.stops.some((s) => s.name.includes("Ekdalia") || s.name.includes("Singhi"))).toBe(true);
  });

  it("returns accessible pandals with wheelchair facilities", async () => {
    const rec = await getAIRecommendation("accessible pandals for seniors with wheelchair", SEED_LOCATIONS);
    expect(rec.title).toContain("Accessible");
    expect(rec.stops.every((s) => s.wheelchairAccessible || s.facilities.some((f) => f.toLowerCase().includes("ramp") || f.toLowerCase().includes("accessible")))).toBe(true);
  });
});

describe("Weather Integration Fallback", () => {
  it("returns Kolkata festival weather with forecast timestamps and rain alerts", async () => {
    const w = await fetchKolkataWeather();
    expect(w.locality).toContain("Kolkata");
    expect(typeof w.tempC).toBe("number");
    expect(typeof w.rainProbability).toBe("number");
    expect(typeof w.rainWarning).toBe("boolean");
    expect(w.advice.length).toBeGreaterThan(10);
  });
});

describe("Multi-Area Planning & Route Optimization", () => {
  it("classifies Kolkata pandals into traditional geographical zones", async () => {
    const { classifyArea } = await import("../lib/routeOptimizer");
    const bagbazar = SEED_LOCATIONS.find((s) => s.name.includes("Bagbazar"))!;
    const ekdalia = SEED_LOCATIONS.find((s) => s.name.includes("Ekdalia"))!;
    const collegeSq = SEED_LOCATIONS.find((s) => s.name.includes("College Square"))!;
    const sreebhumi = SEED_LOCATIONS.find((s) => s.name.includes("Sreebhumi"))!;

    expect(classifyArea(bagbazar)).toBe("North Kolkata");
    expect(classifyArea(ekdalia)).toBe("South Kolkata");
    expect(classifyArea(collegeSq)).toBe("Central Kolkata");
    expect(classifyArea(sreebhumi)).toBe("Salt Lake & East");
  });

  it("finds the nearest pandal based on GPS coordinates", async () => {
    const { findNearestPandal } = await import("../lib/routeOptimizer");
    // Coordinates near Lake Town / VIP Road (22.6000, 88.4020)
    const result = findNearestPandal(22.6000, 88.4020, SEED_LOCATIONS);
    expect(result).not.toBeNull();
    expect(result?.pandal.name).toContain("Sreebhumi");
    expect(result?.distanceKm).toBeLessThan(1.0);
  });

  it("auto-suggests best pandals from an area when no pandals are chosen", async () => {
    const { autoSuggestPandalsForArea } = await import("../lib/routeOptimizer");
    const northBest = autoSuggestPandalsForArea("North Kolkata", SEED_LOCATIONS, 2);
    expect(northBest.length).toBe(2);
    expect(northBest.every((p) => p.category === "Pandal")).toBe(true);
  });

  it("creates a recommended route across multiple areas with auto-suggestions", async () => {
    const { optimizeMultiAreaRoute } = await import("../lib/routeOptimizer");
    const result = optimizeMultiAreaRoute({
      selectedAreas: ["North Kolkata", "South Kolkata"],
      selectedPandalIds: [], // User didn't pick specific pandals
      allLocations: SEED_LOCATIONS,
      travelMode: "walking",
    });

    expect(result.routeStops.length).toBeGreaterThanOrEqual(4);
    expect(result.autoSuggestedIds.length).toBeGreaterThan(0);
    expect(result.totalDistanceKm).toBeGreaterThan(0);
    expect(result.areaSummary.length).toBe(2);
  });

  it("respects variable pandalsPerArea (3, 4, and 'all') options", async () => {
    const { optimizeMultiAreaRoute } = await import("../lib/routeOptimizer");

    // 3 pandals per area
    const res3 = optimizeMultiAreaRoute({
      selectedAreas: ["North Kolkata"],
      selectedPandalIds: [],
      allLocations: SEED_LOCATIONS,
      pandalsPerArea: 3,
    });
    expect(res3.routeStops.length).toBe(3);

    // 4 pandals per area
    const res4 = optimizeMultiAreaRoute({
      selectedAreas: ["North Kolkata"],
      selectedPandalIds: [],
      allLocations: SEED_LOCATIONS,
      pandalsPerArea: 4,
    });
    expect(res4.routeStops.length).toBe(4);

    // 'all' pandals in area
    const resAll = optimizeMultiAreaRoute({
      selectedAreas: ["North Kolkata"],
      selectedPandalIds: [],
      allLocations: SEED_LOCATIONS,
      pandalsPerArea: "all",
    });
    expect(resAll.routeStops.length).toBeGreaterThanOrEqual(5);
  });

  it("optimizes route stops using twoOpt local search to eliminate crossing paths", async () => {
    const { twoOptOptimize } = await import("../lib/routeOptimizer");
    const pandals = SEED_LOCATIONS.filter((p) => p.category === "Pandal");

    // Take 4 pandals and invert order intentionally to create sub-optimal sequence
    const unoptimized = [pandals[0], pandals[3], pandals[1], pandals[2]];
    const optimized = twoOptOptimize(unoptimized);

    expect(optimized.length).toBe(unoptimized.length);
    // All original pandals must still be present
    unoptimized.forEach((p) => {
      expect(optimized.some((o) => o.id === p.id)).toBe(true);
    });
  });
});


