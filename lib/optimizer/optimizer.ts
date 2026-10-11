import { solveTSP } from "./algorithms";
import { buildRouteDetails } from "./directions";
import { buildCostMatrix } from "./matrix";
import type {
  LocationNode,
  OptimizationObjective,
  OptimizationResult,
  RouteConstraints,
  TravelMode,
} from "./types";

/**
 * High-level Puja26 Shortest-Path Route Optimizer.
 *
 * Coordinates:
 * 1. Stop deduplication and validation.
 * 2. Routing cost matrix generation (Google Distance Matrix or urban geodesic fallback).
 * 3. Exact Held-Karp DP (N <= 11) or 2-Opt local search heuristic (N > 11).
 * 4. Constraint satisfaction (fixed start, fixed end, return to start).
 * 5. Sequence timetable and savings comparison computation.
 */
export async function optimizePandalRoute(
  stops: LocationNode[],
  travelMode: TravelMode = "WALKING",
  objective: OptimizationObjective = "FASTEST",
  constraints?: RouteConstraints
): Promise<OptimizationResult> {
  const t0 = performance.now();

  // 1. Sanitize & deduplicate stops
  const uniqueStops = deduplicateStops(stops);
  const N = uniqueStops.length;

  if (N === 0) {
    return {
      orderedIndices: [],
      orderedStops: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalWalkingDistanceMeters: 0,
      legs: [],
      isExactOptimal: true,
      algorithmUsed: "trivial",
      timeComplexity: "O(1)",
      executionTimeMs: performance.now() - t0,
    };
  }

  if (N === 1) {
    return {
      orderedIndices: [0],
      orderedStops: [uniqueStops[0]],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalWalkingDistanceMeters: 0,
      legs: [],
      isExactOptimal: true,
      algorithmUsed: "trivial",
      timeComplexity: "O(1)",
      executionTimeMs: performance.now() - t0,
    };
  }

  // 2. Build cost matrix
  const { matrix, costMatrix, warningNotice } = await buildCostMatrix(
    uniqueStops,
    travelMode,
    objective
  );

  // 3. Resolve constraints relative to uniqueStops
  const fixedStartIndex = resolveIndex(constraints?.fixedStartIndex, N);
  let fixedEndIndex = resolveIndex(constraints?.fixedEndIndex, N);
  if (fixedStartIndex !== undefined && fixedEndIndex === fixedStartIndex) {
    fixedEndIndex = undefined; // Avoid conflicting identical start & end indices on open Hamiltonian path
  }

  // 4. Run TSP solver
  const tspResult = solveTSP({
    costMatrix,
    fixedStartIndex,
    fixedEndIndex,
    returnToStart: constraints?.returnToStart,
    maxHeldKarpNodes: 11,
  });

  // 5. Map ordered indices to ordered stops
  const orderedStops: LocationNode[] = tspResult.orderedIndices.map((idx) => {
    return uniqueStops[idx];
  });

  // 6. Build route details & comparisons
  const details = await buildRouteDetails(
    orderedStops,
    matrix,
    uniqueStops,
    travelMode,
    constraints
  );

  return {
    orderedIndices: tspResult.orderedIndices,
    orderedStops,
    totalDistanceMeters: details.totalDistanceMeters,
    totalDurationSeconds: details.totalDurationSeconds,
    totalWalkingDistanceMeters: details.totalWalkingDistanceMeters,
    legs: details.legs,
    isExactOptimal: tspResult.isExactOptimal,
    algorithmUsed: tspResult.algorithmUsed,
    timeComplexity: tspResult.timeComplexity,
    executionTimeMs: performance.now() - t0,
    comparison: details.comparison,
    overviewPolyline: details.overviewPolyline,
    warningNotice,
  };
}

/**
 * Deduplicates stops with identical IDs or coordinates within 5 meters.
 */
function deduplicateStops(stops: LocationNode[]): LocationNode[] {
  const seenIds = new Set<string>();
  const result: LocationNode[] = [];

  for (const stop of stops) {
    if (!Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude)) {
      continue;
    }
    if (seenIds.has(stop.id)) {
      continue;
    }
    // Check coordinate collision within 5 meters (~0.00005 deg)
    const isCoordDuplicate = result.some(
      (existing) =>
        Math.abs(existing.latitude - stop.latitude) < 0.00005 &&
        Math.abs(existing.longitude - stop.longitude) < 0.00005
    );
    if (isCoordDuplicate) {
      continue;
    }

    seenIds.add(stop.id);
    result.push(stop);
  }

  return result;
}

function resolveIndex(idx: number | undefined, count: number): number | undefined {
  if (idx === undefined || idx < 0 || idx >= count) return undefined;
  return idx;
}
