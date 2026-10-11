import type {
  LocationNode,
  OptimizationObjective,
  RouteMatrixElement,
  TravelMode,
} from "./types";
import { calculateDistanceKm } from "../visits";

/**
 * Builds the N x N cost matrix and rich route element matrix.
 * Uses Google Maps DistanceMatrixService when available in browser,
 * with graceful fallback to realistic Kolkata urban detour geodesic modeling.
 */
export async function buildCostMatrix(
  nodes: LocationNode[],
  travelMode: TravelMode,
  objective: OptimizationObjective
): Promise<{
  matrix: RouteMatrixElement[][];
  costMatrix: number[][];
  source: "google-distance-matrix" | "geodesic-fallback";
  warningNotice?: string;
}> {
  const N = nodes.length;
  if (N <= 1) {
    return {
      matrix: [[createSelfElement(0)]],
      costMatrix: [[0]],
      source: "geodesic-fallback",
    };
  }

  // Check if Google Maps JS API is available in browser
  const isGoogleAvailable =
    typeof window !== "undefined" &&
    typeof google !== "undefined" &&
    google.maps &&
    google.maps.DistanceMatrixService;

  if (isGoogleAvailable) {
    try {
      const result = await fetchGoogleDistanceMatrix(nodes, travelMode);
      const costMatrix = extractObjectiveCosts(result.matrix, objective);
      return {
        matrix: result.matrix,
        costMatrix,
        source: "google-distance-matrix",
        warningNotice: result.warningNotice,
      };
    } catch (err) {
      console.warn("Google DistanceMatrixService error, falling back to urban geodesic model:", err);
    }
  }

  // Fallback: Urban geodesic detour modeling
  const fallback = buildGeodesicMatrix(nodes, travelMode);
  const costMatrix = extractObjectiveCosts(fallback.matrix, objective);
  return {
    matrix: fallback.matrix,
    costMatrix,
    source: "geodesic-fallback",
    warningNotice: "Using estimated road distances. Connect Google Maps API for live real-time traffic.",
  };
}

/**
 * Queries Google Maps DistanceMatrixService with batching and error recovery.
 */
async function fetchGoogleDistanceMatrix(
  nodes: LocationNode[],
  travelMode: TravelMode
): Promise<{ matrix: RouteMatrixElement[][]; warningNotice?: string }> {
  const N = nodes.length;
  const matrix: RouteMatrixElement[][] = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => (i === j ? createSelfElement(i) : createEmptyElement(i, j)))
  );

  const service = new google.maps.DistanceMatrixService();
  const googleTravelMode = getGoogleTravelMode(travelMode);

  // Google limits: max 25 origins, max 25 destinations, max 100 elements per request
  const maxElementsPerBatch = 100;
  const originsPerBatch = Math.max(1, Math.min(25, Math.floor(maxElementsPerBatch / N)));

  let hasUnreachablePairs = false;

  for (let originStart = 0; originStart < N; originStart += originsPerBatch) {
    const originEnd = Math.min(N, originStart + originsPerBatch);
    const originSlice = nodes.slice(originStart, originEnd).map((n) => ({
      lat: n.latitude,
      lng: n.longitude,
    }));
    const destSlice = nodes.map((n) => ({ lat: n.latitude, lng: n.longitude }));

    const response = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: originSlice,
          destinations: destSlice,
          travelMode: googleTravelMode,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (res, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && res) {
            resolve(res);
          } else {
            reject(new Error(`DistanceMatrix failed with status: ${status}`));
          }
        }
      );
    });

    // Populate matrix from response
    for (let r = 0; r < response.rows.length; r++) {
      const globalOriginIdx = originStart + r;
      const elements = response.rows[r].elements;

      for (let c = 0; c < elements.length; c++) {
        const globalDestIdx = c;
        if (globalOriginIdx === globalDestIdx) continue;

        const elem = elements[c];
        if (elem.status === "OK" && elem.distance && elem.duration) {
          matrix[globalOriginIdx][globalDestIdx] = {
            originIndex: globalOriginIdx,
            destIndex: globalDestIdx,
            distanceMeters: elem.distance.value,
            durationSeconds: elem.duration.value,
            walkingDistanceMeters:
              travelMode === "WALKING"
                ? elem.distance.value
                : Math.round(elem.distance.value * 0.15), // estimated pedestrian walk to transit
            status: "OK",
          };
        } else {
          // Unreachable or ZERO_RESULTS (e.g. transit not available at night)
          hasUnreachablePairs = true;
          const fallbackElem = estimateGeodesicPair(
            nodes[globalOriginIdx],
            nodes[globalDestIdx],
            globalOriginIdx,
            globalDestIdx,
            travelMode
          );
          fallbackElem.status = "FALLBACK";
          matrix[globalOriginIdx][globalDestIdx] = fallbackElem;
        }
      }
    }
  }

  return {
    matrix,
    warningNotice: hasUnreachablePairs
      ? "Some transit pairs had no direct schedule; pedestrian fallback routes applied."
      : undefined,
  };
}

/**
 * Builds realistic Kolkata urban road/pedestrian distance matrix using Haversine
 * with urban detour and traffic impedance factors.
 */
export function buildGeodesicMatrix(
  nodes: LocationNode[],
  travelMode: TravelMode
): { matrix: RouteMatrixElement[][] } {
  const N = nodes.length;
  const matrix: RouteMatrixElement[][] = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => {
      if (i === j) return createSelfElement(i);
      return estimateGeodesicPair(nodes[i], nodes[j], i, j, travelMode);
    })
  );

  return { matrix };
}

/**
 * Estimates realistic travel cost between two locations.
 * In dense Indian cities like Kolkata during Durga Puja:
 * - Walking detour factor: 1.35x straight-line, walking speed: 4.5 km/h (1.25 m/s).
 * - Driving detour factor: 1.45x straight-line, average festival traffic speed: 18 km/h (5.0 m/s).
 * - Transit detour factor: 1.40x, speed: 24 km/h with 8 mins avg boarding/transfer overhead.
 */
function estimateGeodesicPair(
  from: LocationNode,
  to: LocationNode,
  originIndex: number,
  destIndex: number,
  travelMode: TravelMode
): RouteMatrixElement {
  const straightLineKm = calculateDistanceKm(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  );

  let detourFactor = 1.35;
  let speedKmH = 4.5;
  let overheadSeconds = 0;

  if (travelMode === "DRIVING") {
    detourFactor = 1.45;
    speedKmH = 18.0;
    overheadSeconds = 120; // parking / boarding
  } else if (travelMode === "TRANSIT") {
    detourFactor = 1.4;
    speedKmH = 22.0;
    overheadSeconds = 480; // station walk & metro wait time
  }

  const distanceMeters = Math.max(50, Math.round(straightLineKm * 1000 * detourFactor));
  const travelSeconds = Math.round((distanceMeters / (speedKmH * 1000)) * 3600);
  const durationSeconds = travelSeconds + overheadSeconds;

  const walkingDistanceMeters =
    travelMode === "WALKING"
      ? distanceMeters
      : Math.min(distanceMeters, 650); // first/last-mile walk for transit

  return {
    originIndex,
    destIndex,
    distanceMeters,
    durationSeconds,
    walkingDistanceMeters,
    status: "OK",
  };
}

/**
 * Extracts scalar edge weights for the TSP solver based on the user's objective.
 */
export function extractObjectiveCosts(
  matrix: RouteMatrixElement[][],
  objective: OptimizationObjective
): number[][] {
  const N = matrix.length;
  const costMatrix: number[][] = Array.from({ length: N }, () => new Array<number>(N).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === j) {
        costMatrix[i][j] = 0;
        continue;
      }

      const elem = matrix[i][j];
      switch (objective) {
        case "SHORTEST":
          // Pure distance minimization
          costMatrix[i][j] = elem.distanceMeters;
          break;

        case "FASTEST":
          // Pure duration minimization
          costMatrix[i][j] = elem.durationSeconds;
          break;

        case "MIN_WALKING":
          // Heavily prioritize minimal walking, breaking ties with total duration
          costMatrix[i][j] = elem.walkingDistanceMeters * 10 + elem.durationSeconds * 0.1;
          break;

        default:
          costMatrix[i][j] = elem.durationSeconds;
      }
    }
  }

  return costMatrix;
}

function getGoogleTravelMode(mode: TravelMode): google.maps.TravelMode {
  if (typeof google === "undefined" || !google.maps) {
    return "WALKING" as unknown as google.maps.TravelMode;
  }
  switch (mode) {
    case "WALKING":
      return google.maps.TravelMode.WALKING;
    case "TRANSIT":
      return google.maps.TravelMode.TRANSIT;
    case "DRIVING":
      return google.maps.TravelMode.DRIVING;
  }
}

function createSelfElement(index: number): RouteMatrixElement {
  return {
    originIndex: index,
    destIndex: index,
    distanceMeters: 0,
    durationSeconds: 0,
    walkingDistanceMeters: 0,
    status: "OK",
  };
}

function createEmptyElement(originIndex: number, destIndex: number): RouteMatrixElement {
  return {
    originIndex,
    destIndex,
    distanceMeters: Infinity,
    durationSeconds: Infinity,
    walkingDistanceMeters: Infinity,
    status: "UNREACHABLE",
  };
}
