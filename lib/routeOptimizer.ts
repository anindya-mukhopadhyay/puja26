import { calculateDistanceKm, estimateRouteMetrics } from "./routes";
import type { LocationItem } from "./types";

export type PujoArea =
  | "North Kolkata"
  | "South Kolkata"
  | "Central Kolkata"
  | "Salt Lake & East"
  | "All Kolkata";

export const PUJO_AREAS: { id: PujoArea; label: string; description: string }[] = [
  {
    id: "North Kolkata",
    label: "North Kolkata",
    description: "Bagbazar, Sovabazar, Kumartuli, Hatibagan & Heritage Bonedi Bari",
  },
  {
    id: "Central Kolkata",
    label: "Central Kolkata",
    description: "College Square, Mohammad Ali Park, Lebutala & Bowbazar",
  },
  {
    id: "South Kolkata",
    label: "South Kolkata",
    description: "Ekdalia, Singhi Park, Maddox Square, Deshapriya, Chetla & Suruchi",
  },
  {
    id: "Salt Lake & East",
    label: "Salt Lake & East",
    description: "Sreebhumi (VIP Road), Lake Town, FD Block & BJ Block Bidhannagar",
  },
];

/**
 * Classifies a location into one of Kolkata's traditional Durga Puja zones
 */
export function classifyArea(item: LocationItem): PujoArea {
  const text = `${item.locality} ${item.address} ${item.name}`.toLowerCase();

  if (
    text.includes("lake town") ||
    text.includes("vip road") ||
    text.includes("salt lake") ||
    text.includes("bidhannagar") ||
    text.includes("sector") ||
    text.includes("sreebhumi") ||
    text.includes("dum dum park") ||
    (item.latitude > 22.585 && item.longitude > 88.39)
  ) {
    return "Salt Lake & East";
  }

  if (
    text.includes("north") ||
    text.includes("bagbazar") ||
    text.includes("sovabazar") ||
    text.includes("hatibagan") ||
    text.includes("shyambazar") ||
    text.includes("kumartuli") ||
    text.includes("ahiritola") ||
    text.includes("kashi bose") ||
    text.includes("telengabagan") ||
    text.includes("belgachia") ||
    item.latitude >= 22.59
  ) {
    return "North Kolkata";
  }

  if (
    text.includes("college") ||
    text.includes("mohammad ali") ||
    text.includes("mg road") ||
    text.includes("central") ||
    text.includes("bowbazar") ||
    text.includes("sealdah") ||
    text.includes("lebutala") ||
    text.includes("simla") ||
    (item.latitude >= 22.555 && item.latitude < 22.59 && item.longitude < 88.385)
  ) {
    return "Central Kolkata";
  }

  return "South Kolkata";
}

/**
 * Gets all pandals belonging to a specific area
 */
export function getPandalsInArea(area: PujoArea, allPandals: LocationItem[]): LocationItem[] {
  const pandalsOnly = allPandals.filter((p) => p.category === "Pandal");
  if (area === "All Kolkata") return pandalsOnly;
  return pandalsOnly.filter((p) => classifyArea(p) === area);
}

/**
 * Suggests the best/top-rated pandals for an area
 */
export function autoSuggestPandalsForArea(
  area: PujoArea,
  allPandals: LocationItem[],
  maxCount: number | "all" = 3
): LocationItem[] {
  const areaPandals = getPandalsInArea(area, allPandals);
  const sorted = [...areaPandals].sort(
    (a, b) => (b.rating || 4.5) * (b.reviewCount || 10) - (a.rating || 4.5) * (a.reviewCount || 10)
  );
  if (maxCount === "all") {
    return sorted;
  }
  return sorted.slice(0, maxCount);
}

/**
 * Finds the nearest pandal to the user's current GPS position
 */
export function findNearestPandal(
  currentLat: number,
  currentLng: number,
  allPandals: LocationItem[]
): { pandal: LocationItem; distanceKm: number } | null {
  const pandals = allPandals.filter((p) => p.category === "Pandal");
  if (pandals.length === 0) return null;

  let nearest = pandals[0];
  let minDistance = calculateDistanceKm(currentLat, currentLng, nearest.latitude, nearest.longitude);

  for (let i = 1; i < pandals.length; i++) {
    const dist = calculateDistanceKm(currentLat, currentLng, pandals[i].latitude, pandals[i].longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = pandals[i];
    }
  }

  return {
    pandal: nearest,
    distanceKm: Number(minDistance.toFixed(1)),
  };
}

/**
 * Calculates total route distance in km
 */
function totalPathDistance(stops: LocationItem[]): number {
  let sum = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    sum += calculateDistanceKm(
      stops[i].latitude,
      stops[i].longitude,
      stops[i + 1].latitude,
      stops[i + 1].longitude
    );
  }
  return sum;
}

/**
 * 2-Opt TSP local search heuristic:
 * Iteratively uncrosses intersecting paths until no 2-edge exchange can reduce total travel distance.
 */
export function twoOptOptimize(route: LocationItem[]): LocationItem[] {
  if (route.length <= 3) return route;

  let best = [...route];
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        // Evaluate distance change if segment between i and k is reversed
        const d_i_prev = calculateDistanceKm(best[i - 1].latitude, best[i - 1].longitude, best[i].latitude, best[i].longitude);
        const d_k_next = k + 1 < best.length
          ? calculateDistanceKm(best[k].latitude, best[k].longitude, best[k + 1].latitude, best[k + 1].longitude)
          : 0;

        const d_i_k = calculateDistanceKm(best[i - 1].latitude, best[i - 1].longitude, best[k].latitude, best[k].longitude);
        const d_prev_k = k + 1 < best.length
          ? calculateDistanceKm(best[i].latitude, best[i].longitude, best[k + 1].latitude, best[k + 1].longitude)
          : 0;

        if (d_i_k + d_prev_k < d_i_prev + d_k_next - 0.05) {
          // Reverse sub-segment [i...k]
          const newRoute = [
            ...best.slice(0, i),
            ...best.slice(i, k + 1).reverse(),
            ...best.slice(k + 1),
          ];
          best = newRoute;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return best;
}

/**
 * Intelligent Multi-Area Route Optimizer:
 * 1. Honors user choices: specific selected pandals + auto-suggestions for chosen areas.
 * 2. Groups by geographic transit corridor to prevent absurd cross-city bouncing.
 * 3. Within each cluster, arranges in optimal nearest-neighbor order.
 * 4. Runs 2-Opt local search to uncross path loops and produce the shortest path.
 */
export function optimizeMultiAreaRoute(params: {
  selectedAreas: PujoArea[];
  selectedPandalIds: string[];
  allLocations: LocationItem[];
  startCoords?: { lat: number; lng: number };
  pandalsPerArea?: number | "all"; // Configurable: 2, 3, 4, 5, or "all"
  travelMode?: "walking" | "transit" | "driving";
}): {
  routeStops: LocationItem[];
  autoSuggestedIds: string[];
  areaSummary: { area: PujoArea; pandalCount: number }[];
  totalDistanceKm: number;
  durationMinutes: number;
  summaryText: string;
} {
  const {
    selectedAreas,
    selectedPandalIds,
    allLocations,
    startCoords,
    pandalsPerArea = 3,
    travelMode = "walking",
  } = params;

  const pandalsOnly = allLocations.filter((l) => l.category === "Pandal");
  const chosenIdsSet = new Set(selectedPandalIds);
  const stopsToInclude: LocationItem[] = [];
  const autoSuggestedIds: string[] = [];
  const areaSummary: { area: PujoArea; pandalCount: number }[] = [];

  // Define traditional geographic corridor order:
  // North / Salt Lake (top) -> Central (middle) -> South (bottom)
  const CORRIDOR_ORDER: PujoArea[] = [
    "Salt Lake & East",
    "North Kolkata",
    "Central Kolkata",
    "South Kolkata",
  ];

  // If user coordinates provided, determine whether they are closer to South or North/East
  const startAtSouth = startCoords ? startCoords.lat < 22.54 : false;
  const orderedAreas = startAtSouth
    ? [...CORRIDOR_ORDER].reverse()
    : CORRIDOR_ORDER;

  // Filter to only areas user selected (or all if none selected)
  const activeAreas = orderedAreas.filter((a) =>
    selectedAreas.length === 0 || selectedAreas.includes(a)
  );

  for (const area of activeAreas) {
    const areaPandals = getPandalsInArea(area, pandalsOnly);
    const explicitlySelectedInArea = areaPandals.filter((p) => chosenIdsSet.has(p.id));

    if (explicitlySelectedInArea.length > 0) {
      stopsToInclude.push(...explicitlySelectedInArea);
      areaSummary.push({ area, pandalCount: explicitlySelectedInArea.length });
    } else if (selectedAreas.includes(area)) {
      // Auto-suggest best pandals according to the user's pandalsPerArea preference!
      const best = autoSuggestPandalsForArea(area, pandalsOnly, pandalsPerArea);
      stopsToInclude.push(...best);
      best.forEach((b) => autoSuggestedIds.push(b.id));
      areaSummary.push({ area, pandalCount: best.length });
    }
  }

  // Also include any explicitly selected pandals that might have been picked outside the active areas
  for (const pid of selectedPandalIds) {
    if (!stopsToInclude.some((s) => s.id === pid)) {
      const found = pandalsOnly.find((p) => p.id === pid);
      if (found) stopsToInclude.push(found);
    }
  }

  // Deduplicate
  const uniqueStops = Array.from(new Map(stopsToInclude.map((item) => [item.id, item])).values());

  if (uniqueStops.length <= 2) {
    const metrics = estimateRouteMetrics(uniqueStops, travelMode);
    return {
      routeStops: uniqueStops,
      autoSuggestedIds,
      areaSummary,
      totalDistanceKm: metrics.totalDistanceKm,
      durationMinutes: metrics.durationMinutes,
      summaryText: metrics.summaryText,
    };
  }

  // Initial Nearest-Neighbor traversal respecting corridor clusters
  const remaining = [...uniqueStops];
  const initialOrdered: LocationItem[] = [];

  let curLat = startCoords ? startCoords.lat : remaining[0].latitude;
  let curLng = startCoords ? startCoords.lng : remaining[0].longitude;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minD = calculateDistanceKm(curLat, curLng, remaining[0].latitude, remaining[0].longitude);

    for (let i = 1; i < remaining.length; i++) {
      const d = calculateDistanceKm(curLat, curLng, remaining[i].latitude, remaining[i].longitude);
      if (d < minD) {
        minD = d;
        nearestIdx = i;
      }
    }

    const [next] = remaining.splice(nearestIdx, 1);
    initialOrdered.push(next);
    curLat = next.latitude;
    curLng = next.longitude;
  }

  // Apply 2-Opt local search optimization to remove any path intersections
  const optimizedRoute = twoOptOptimize(initialOrdered);
  const metrics = estimateRouteMetrics(optimizedRoute, travelMode);

  return {
    routeStops: optimizedRoute,
    autoSuggestedIds,
    areaSummary,
    totalDistanceKm: metrics.totalDistanceKm,
    durationMinutes: metrics.durationMinutes,
    summaryText: metrics.summaryText,
  };
}
