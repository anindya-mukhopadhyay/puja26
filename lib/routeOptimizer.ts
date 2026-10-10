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
    description: "Bagbazar, Sovabazar, Hatibagan & Heritage Bonedi Bari",
  },
  {
    id: "South Kolkata",
    label: "South Kolkata",
    description: "Ballygunge, Gariahat, Maddox Square, Chetla & New Alipore",
  },
  {
    id: "Central Kolkata",
    label: "Central Kolkata",
    description: "College Square, Mohammad Ali Park & Santosh Mitra Square",
  },
  {
    id: "Salt Lake & East",
    label: "Salt Lake & East",
    description: "Sreebhumi (VIP Road), Lake Town & FD Block Bidhannagar",
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
    item.latitude > 22.585 && item.longitude > 88.39
  ) {
    return "Salt Lake & East";
  }

  if (
    text.includes("north") ||
    text.includes("bagbazar") ||
    text.includes("sovabazar") ||
    text.includes("hatibagan") ||
    text.includes("shyambazar") ||
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
    (item.latitude >= 22.56 && item.latitude < 22.59 && item.longitude < 88.38)
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
 * Suggests the best/top-rated pandals for an area when user hasn't explicitly selected any
 */
export function autoSuggestPandalsForArea(
  area: PujoArea,
  allPandals: LocationItem[],
  maxCount = 2
): LocationItem[] {
  const areaPandals = getPandalsInArea(area, allPandals);
  // Sort by rating descending and review count
  return [...areaPandals]
    .sort((a, b) => (b.rating || 0) * (b.reviewCount || 1) - (a.rating || 0) * (a.reviewCount || 1))
    .slice(0, maxCount);
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
 * Creates an optimized, logical route visiting pandals across multiple selected areas
 * 1. If an area is selected with no specific pandals chosen, automatically suggests the best from that area.
 * 2. Uses Nearest-Neighbor sequence to order all selected stops with minimal backtracking across city traffic.
 */
export function optimizeMultiAreaRoute(params: {
  selectedAreas: PujoArea[];
  selectedPandalIds: string[];
  allLocations: LocationItem[];
  startCoords?: { lat: number; lng: number };
  travelMode?: "walking" | "transit" | "driving";
}): {
  routeStops: LocationItem[];
  autoSuggestedIds: string[];
  areaSummary: { area: PujoArea; pandalCount: number }[];
  totalDistanceKm: number;
  durationMinutes: number;
  summaryText: string;
} {
  const { selectedAreas, selectedPandalIds, allLocations, startCoords, travelMode = "walking" } = params;
  const pandalsOnly = allLocations.filter((l) => l.category === "Pandal");

  const chosenIdsSet = new Set(selectedPandalIds);
  const stopsToInclude: LocationItem[] = [];
  const autoSuggestedIds: string[] = [];
  const areaSummary: { area: PujoArea; pandalCount: number }[] = [];

  // If user selected specific areas
  for (const area of selectedAreas) {
    const areaPandals = getPandalsInArea(area, pandalsOnly);
    const explicitlySelectedInArea = areaPandals.filter((p) => chosenIdsSet.has(p.id));

    if (explicitlySelectedInArea.length > 0) {
      stopsToInclude.push(...explicitlySelectedInArea);
      areaSummary.push({ area, pandalCount: explicitlySelectedInArea.length });
    } else {
      // Auto-suggest best 2 pandals for this area because user selected the area without picking specific pandals!
      const best = autoSuggestPandalsForArea(area, pandalsOnly, 2);
      stopsToInclude.push(...best);
      best.forEach((b) => autoSuggestedIds.push(b.id));
      areaSummary.push({ area, pandalCount: best.length });
    }
  }

  // Also include any explicitly selected pandals that might belong to areas not in selectedAreas
  for (const pid of selectedPandalIds) {
    if (!stopsToInclude.some((s) => s.id === pid)) {
      const found = pandalsOnly.find((p) => p.id === pid);
      if (found) stopsToInclude.push(found);
    }
  }

  // Deduplicate
  const uniqueStops = Array.from(new Map(stopsToInclude.map((item) => [item.id, item])).values());

  if (uniqueStops.length <= 1) {
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

  // Optimize visit sequence using Nearest-Neighbor heuristic to avoid criss-crossing Kolkata
  const remaining = [...uniqueStops];
  const orderedStops: LocationItem[] = [];

  // Determine starting point: user coordinates if provided, else northernmost or first stop
  let currentLat = startCoords ? startCoords.lat : remaining[0].latitude;
  let currentLng = startCoords ? startCoords.lng : remaining[0].longitude;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = calculateDistanceKm(currentLat, currentLng, remaining[0].latitude, remaining[0].longitude);

    for (let i = 1; i < remaining.length; i++) {
      const dist = calculateDistanceKm(currentLat, currentLng, remaining[i].latitude, remaining[i].longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const [nextStop] = remaining.splice(nearestIndex, 1);
    orderedStops.push(nextStop);
    currentLat = nextStop.latitude;
    currentLng = nextStop.longitude;
  }

  const metrics = estimateRouteMetrics(orderedStops, travelMode);

  return {
    routeStops: orderedStops,
    autoSuggestedIds,
    areaSummary,
    totalDistanceKm: metrics.totalDistanceKm,
    durationMinutes: metrics.durationMinutes,
    summaryText: metrics.summaryText,
  };
}
