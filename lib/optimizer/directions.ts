import type {
  LegSummary,
  LocationNode,
  RouteComparison,
  RouteConstraints,
  RouteMatrixElement,
  TravelMode,
} from "./types";

/**
 * Builds timetable and detailed leg metrics for the ordered stops.
 */
export async function buildRouteDetails(
  orderedStops: LocationNode[],
  matrix: RouteMatrixElement[][],
  originalStops: LocationNode[],
  travelMode: TravelMode,
  constraints?: RouteConstraints
): Promise<{
  legs: LegSummary[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalWalkingDistanceMeters: number;
  comparison?: RouteComparison;
  overviewPolyline?: string;
}> {
  const N = orderedStops.length;
  if (N <= 1) {
    return {
      legs: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalWalkingDistanceMeters: 0,
    };
  }

  const dwellMs = (constraints?.dwellMinutesPerPandal ?? 25) * 60 * 1000;
  const startEpoch = constraints?.startTime ? constraints.startTime.getTime() : Date.now();
  let currentEpoch = startEpoch;

  const legs: LegSummary[] = [];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  let totalWalkingDistanceMeters = 0;

  for (let i = 0; i < N - 1; i++) {
    const fromNode = orderedStops[i];
    const toNode = orderedStops[i + 1];

    // Find in matrix if possible
    const legElem = findMatrixElement(fromNode, toNode, matrix, originalStops);

    const dist = legElem ? legElem.distanceMeters : 500;
    const durSec = legElem ? legElem.durationSeconds : 300;
    const walkDist = legElem ? legElem.walkingDistanceMeters : dist;

    totalDistanceMeters += dist;
    totalDurationSeconds += durSec;
    totalWalkingDistanceMeters += walkDist;

    const departureTime = formatClockTime(new Date(currentEpoch));
    currentEpoch += durSec * 1000;
    const arrivalTime = formatClockTime(new Date(currentEpoch));

    legs.push({
      fromNode,
      toNode,
      distanceMeters: dist,
      durationSeconds: durSec,
      walkingDistanceMeters: walkDist,
      departureTime,
      arrivalTime,
    });

    // Add dwell time at the arrived pandal (except if it's the final return stop)
    if (i + 1 < N - 1) {
      currentEpoch += dwellMs;
    }
  }

  // Calculate comparison against original sequence
  const comparison = calculateSequenceComparison(
    originalStops,
    orderedStops,
    matrix,
    totalDistanceMeters,
    totalDurationSeconds,
    totalWalkingDistanceMeters,
    constraints?.returnToStart
  );

  // Try fetching live Google Maps overview polyline if in browser
  let overviewPolyline: string | undefined;
  if (typeof window !== "undefined" && typeof google !== "undefined" && google.maps?.DirectionsService) {
    try {
      overviewPolyline = await fetchGoogleDirectionsPolyline(orderedStops, travelMode);
    } catch (e) {
      console.warn("DirectionsService polyline fetch failed:", e);
    }
  }

  return {
    legs,
    totalDistanceMeters,
    totalDurationSeconds,
    totalWalkingDistanceMeters,
    comparison,
    overviewPolyline,
  };
}

/**
 * Compares original stop order vs optimized stop order.
 */
function calculateSequenceComparison(
  originalStops: LocationNode[],
  optimizedStops: LocationNode[],
  matrix: RouteMatrixElement[][],
  optDistance: number,
  optDuration: number,
  optWalking: number,
  returnToStart?: boolean
): RouteComparison {
  const origList = returnToStart && originalStops.length > 0 && originalStops[0].id !== originalStops[originalStops.length - 1].id
    ? [...originalStops, originalStops[0]]
    : originalStops;

  let origDist = 0;
  let origDur = 0;
  let origWalk = 0;

  for (let i = 0; i < origList.length - 1; i++) {
    const elem = findMatrixElement(origList[i], origList[i + 1], matrix, originalStops);
    if (elem) {
      origDist += elem.distanceMeters;
      origDur += elem.durationSeconds;
      origWalk += elem.walkingDistanceMeters;
    }
  }

  const distSaved = Math.max(0, origDist - optDistance);
  const durSaved = Math.max(0, origDur - optDuration);
  const walkSaved = Math.max(0, origWalk - optWalking);

  const pctDist = origDist > 0 ? Math.round((distSaved / origDist) * 100) : 0;
  const pctDur = origDur > 0 ? Math.round((durSaved / origDur) * 100) : 0;

  return {
    originalDistanceMeters: origDist,
    originalDurationSeconds: origDur,
    originalWalkingMeters: origWalk,
    optimizedDistanceMeters: optDistance,
    optimizedDurationSeconds: optDuration,
    optimizedWalkingMeters: optWalking,
    distanceSavedMeters: distSaved,
    durationSavedSeconds: durSaved,
    walkingSavedMeters: walkSaved,
    percentDistanceSaved: pctDist,
    percentDurationSaved: pctDur,
  };
}

function findMatrixElement(
  fromNode: LocationNode,
  toNode: LocationNode,
  matrix: RouteMatrixElement[][],
  allNodes: LocationNode[]
): RouteMatrixElement | undefined {
  const fromIdx = allNodes.findIndex((n) => n.id === fromNode.id);
  const toIdx = allNodes.findIndex((n) => n.id === toNode.id);

  if (fromIdx !== -1 && toIdx !== -1 && matrix[fromIdx]?.[toIdx]) {
    return matrix[fromIdx][toIdx];
  }
  return undefined;
}

function formatClockTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 => 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minStr} ${ampm}`;
}

async function fetchGoogleDirectionsPolyline(
  orderedStops: LocationNode[],
  mode: TravelMode
): Promise<string | undefined> {
  if (orderedStops.length < 2) return undefined;
  const service = new google.maps.DirectionsService();

  const origin = { lat: orderedStops[0].latitude, lng: orderedStops[0].longitude };
  const destination = {
    lat: orderedStops[orderedStops.length - 1].latitude,
    lng: orderedStops[orderedStops.length - 1].longitude,
  };

  const waypoints = orderedStops.slice(1, -1).map((s) => ({
    location: { lat: s.latitude, lng: s.longitude },
    stopover: true,
  }));

  const travelMode =
    mode === "WALKING"
      ? google.maps.TravelMode.WALKING
      : mode === "TRANSIT"
      ? google.maps.TravelMode.TRANSIT
      : google.maps.TravelMode.DRIVING;

  return new Promise((resolve) => {
    service.route(
      {
        origin,
        destination,
        waypoints,
        travelMode,
        optimizeWaypoints: false, // Keep our calculated TSP order!
      },
      (res, status) => {
        if (status === google.maps.DirectionsStatus.OK && res?.routes[0]?.overview_polyline) {
          resolve(res.routes[0].overview_polyline);
        } else {
          resolve(undefined);
        }
      }
    );
  });
}
