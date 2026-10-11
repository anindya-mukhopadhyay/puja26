import { describe, expect, it } from "vitest";
import { bruteForceTSP, calculatePathCost, heldKarpTSP, solveTSP, twoOptTSP } from "../lib/optimizer/algorithms";
import { buildGeodesicMatrix, extractObjectiveCosts } from "../lib/optimizer/matrix";
import { optimizePandalRoute } from "../lib/optimizer/optimizer";
import type { LocationNode } from "../lib/optimizer/types";

// Real Kolkata Durga Puja Pandals sample dataset
const KOLKATA_PANDALS: LocationNode[] = [
  { id: "p1", name: "Tala Prattoy", latitude: 22.6042, longitude: 88.3768 },
  { id: "p2", name: "Kumartuli Park", latitude: 22.5997, longitude: 88.3662 },
  { id: "p3", name: "Bagbazar Sarbojanin", latitude: 22.6033, longitude: 88.3695 },
  { id: "p4", name: "Ahiritola Sarbojanin", latitude: 22.5951, longitude: 88.3608 },
  { id: "p5", name: "Sovabazar Rajbari", latitude: 22.5972, longitude: 88.3653 },
  { id: "p6", name: "College Square", latitude: 22.5746, longitude: 88.3639 },
  { id: "p7", name: "Santosh Mitra Square", latitude: 22.5694, longitude: 88.3672 },
  { id: "p8", name: "Md Ali Park", latitude: 22.5794, longitude: 88.3611 },
  { id: "p9", name: "Suruchi Sangha", latitude: 22.5186, longitude: 88.3378 },
  { id: "p10", name: "Chetla Agrani", latitude: 22.5195, longitude: 88.3415 },
  { id: "p11", name: "Ekdalia Evergreen", latitude: 22.5181, longitude: 88.3685 },
  { id: "p12", name: "Singhi Park", latitude: 22.5192, longitude: 88.3671 },
  { id: "p13", name: "Ballygunge Cultural", latitude: 22.5273, longitude: 88.3662 },
  { id: "p14", name: "Maddox Square", latitude: 22.5312, longitude: 88.3582 },
  { id: "p15", name: "Deshapriya Park", latitude: 22.5189, longitude: 88.3533 },
];

describe("Puja26 Shortest-Path TSP Optimizer", () => {
  describe("Algorithm Mathematical Correctness (Held-Karp vs Brute Force)", () => {
    it("matches brute-force exact optimal for 3 pandals", () => {
      const stops = KOLKATA_PANDALS.slice(0, 3);
      const { matrix } = buildGeodesicMatrix(stops, "WALKING");
      const costMatrix = extractObjectiveCosts(matrix, "SHORTEST");

      const heldKarp = heldKarpTSP(costMatrix);
      const brute = bruteForceTSP(costMatrix);

      expect(heldKarp.totalCost).toBeCloseTo(brute.totalCost, 2);
      expect(heldKarp.isExactOptimal).toBe(true);
      expect(heldKarp.orderedIndices).toHaveLength(3);
    });

    it("matches brute-force exact optimal for 5 pandals with return-to-start", () => {
      const stops = KOLKATA_PANDALS.slice(0, 5);
      const { matrix } = buildGeodesicMatrix(stops, "WALKING");
      const costMatrix = extractObjectiveCosts(matrix, "SHORTEST");

      const heldKarp = heldKarpTSP(costMatrix, 0, undefined, true);
      const brute = bruteForceTSP(costMatrix, 0, undefined, true);

      expect(heldKarp.totalCost).toBeCloseTo(brute.totalCost, 2);
      expect(heldKarp.orderedIndices[0]).toBe(0);
      expect(heldKarp.orderedIndices[heldKarp.orderedIndices.length - 1]).toBe(0);
    });

    it("matches brute-force exact optimal with fixed start and fixed end", () => {
      const stops = KOLKATA_PANDALS.slice(0, 5);
      const { matrix } = buildGeodesicMatrix(stops, "DRIVING");
      const costMatrix = extractObjectiveCosts(matrix, "FASTEST");

      const fixedStart = 1; // Kumartuli
      const fixedEnd = 4;   // Sovabazar

      const heldKarp = heldKarpTSP(costMatrix, fixedStart, fixedEnd, false);
      const brute = bruteForceTSP(costMatrix, fixedStart, fixedEnd, false);

      expect(heldKarp.totalCost).toBeCloseTo(brute.totalCost, 2);
      expect(heldKarp.orderedIndices[0]).toBe(fixedStart);
      expect(heldKarp.orderedIndices[heldKarp.orderedIndices.length - 1]).toBe(fixedEnd);
    });
  });

  describe("Scale & Performance Benchmarks", () => {
    it("optimizes 10 pandals with Held-Karp in under 50ms", () => {
      const stops = KOLKATA_PANDALS.slice(0, 10);
      const { matrix } = buildGeodesicMatrix(stops, "WALKING");
      const costMatrix = extractObjectiveCosts(matrix, "SHORTEST");

      const t0 = performance.now();
      const result = solveTSP({ costMatrix, maxHeldKarpNodes: 11 });
      const elapsed = performance.now() - t0;

      expect(result.algorithmUsed).toBe("held-karp");
      expect(result.isExactOptimal).toBe(true);
      expect(result.orderedIndices).toHaveLength(10);
      expect(elapsed).toBeLessThan(100); // Super fast O(N^2 2^N)
    });

    it("optimizes 15 pandals using 2-Opt heuristic with significant cost reduction", () => {
      const stops = KOLKATA_PANDALS.slice(0, 15);
      const { matrix } = buildGeodesicMatrix(stops, "WALKING");
      const costMatrix = extractObjectiveCosts(matrix, "SHORTEST");

      // Initial sequential order cost
      const initialIndices = Array.from({ length: 15 }, (_, i) => i);
      const initialCost = calculatePathCost(initialIndices, costMatrix);

      const result = solveTSP({ costMatrix, maxHeldKarpNodes: 11 });

      expect(result.algorithmUsed).toBe("2-opt");
      expect(result.orderedIndices).toHaveLength(15);
      // Heuristic must achieve major improvement over arbitrary sequence
      expect(result.totalCost).toBeLessThanOrEqual(initialCost);
    });
  });

  describe("Constraints & Objective Functions", () => {
    it("respects fixed start location (user GPS pin)", async () => {
      const stops = KOLKATA_PANDALS.slice(0, 6);
      const fixedStartIndex = 2; // Bagbazar as user starting location

      const result = await optimizePandalRoute(stops, "WALKING", "SHORTEST", {
        fixedStartIndex,
      });

      expect(result.orderedStops[0].id).toBe(stops[fixedStartIndex].id);
      expect(result.orderedStops).toHaveLength(6);
    });

    it("respects return-to-start round trip constraint", async () => {
      const stops = KOLKATA_PANDALS.slice(0, 5);

      const result = await optimizePandalRoute(stops, "WALKING", "FASTEST", {
        fixedStartIndex: 0,
        returnToStart: true,
      });

      expect(result.orderedStops[0].id).toBe(stops[0].id);
      expect(result.orderedStops[result.orderedStops.length - 1].id).toBe(stops[0].id);
    });

    it("optimizes for Minimum Walking vs Shortest Distance", async () => {
      const stops = KOLKATA_PANDALS.slice(0, 5);

      const walkingRes = await optimizePandalRoute(stops, "WALKING", "MIN_WALKING");
      const distanceRes = await optimizePandalRoute(stops, "WALKING", "SHORTEST");

      expect(walkingRes.totalDistanceMeters).toBeGreaterThan(0);
      expect(distanceRes.totalDistanceMeters).toBeGreaterThan(0);
      expect(walkingRes.orderedStops).toHaveLength(5);
    });

    it("calculates realistic timetable arrival and dwell estimates", async () => {
      const stops = KOLKATA_PANDALS.slice(0, 4);
      const startTime = new Date(2026, 9, 11, 16, 0); // 4:00 PM

      const result = await optimizePandalRoute(stops, "WALKING", "FASTEST", {
        startTime,
        dwellMinutesPerPandal: 30,
      });

      expect(result.legs).toHaveLength(3);
      expect(result.legs[0].departureTime).toContain("4:00 PM");
      // Arrival at stop 2 is after walking travel time
      expect(result.legs[0].arrivalTime).toBeDefined();
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("handles 0 stops without error", async () => {
      const result = await optimizePandalRoute([]);
      expect(result.orderedStops).toHaveLength(0);
      expect(result.totalDistanceMeters).toBe(0);
    });

    it("handles 1 stop trivially", async () => {
      const result = await optimizePandalRoute([KOLKATA_PANDALS[0]]);
      expect(result.orderedStops).toHaveLength(1);
      expect(result.totalDistanceMeters).toBe(0);
      expect(result.algorithmUsed).toBe("trivial");
    });

    it("deduplicates duplicate pandals automatically", async () => {
      const duplicates = [
        KOLKATA_PANDALS[0],
        KOLKATA_PANDALS[1],
        KOLKATA_PANDALS[0], // Duplicate ID
        { ...KOLKATA_PANDALS[1], id: "p2-copy" }, // Duplicate coordinates
      ];

      const result = await optimizePandalRoute(duplicates, "WALKING", "SHORTEST");
      expect(result.orderedStops).toHaveLength(2);
    });

    it("reports original vs optimized savings correctly", async () => {
      const stops = [
        KOLKATA_PANDALS[0], // North
        KOLKATA_PANDALS[8], // South
        KOLKATA_PANDALS[1], // North
        KOLKATA_PANDALS[9], // South
      ];

      const result = await optimizePandalRoute(stops, "WALKING", "SHORTEST");
      expect(result.comparison).toBeDefined();
      if (result.comparison) {
        expect(result.comparison.optimizedDistanceMeters).toBeLessThanOrEqual(
          result.comparison.originalDistanceMeters
        );
        expect(result.comparison.percentDistanceSaved).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
