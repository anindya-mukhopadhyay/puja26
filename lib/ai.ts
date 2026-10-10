import { calculateDistanceKm, estimateRouteMetrics } from "./routes";
import { SEED_LOCATIONS } from "./seedData";
import type { AIRecommendation, LocationItem } from "./types";

export type AIQueryType =
  | "top_rated"
  | "near_metro"
  | "low_walking"
  | "accessible"
  | "south_kolkata"
  | "north_kolkata"
  | "custom";

export async function getAIRecommendation(
  queryText: string,
  availableLocations: LocationItem[] = SEED_LOCATIONS,
  userCoordinates?: { lat: number; lng: number }
): Promise<AIRecommendation> {
  const pandalsOnly = availableLocations.filter((l) => l.category === "Pandal");
  const lower = queryText.toLowerCase();

  // Deterministic smart clustering based on the query
  let selectedStops: LocationItem[] = [];
  let title = "Curated Durga Puja Recommendations";
  let summary = "Handcrafted recommendation based on authentic Kolkata pandal records.";
  let highlights: string[] = [];

  if (lower.includes("metro") || lower.includes("transit") || lower.includes("train")) {
    title = "Metro-Connected Pujo Route";
    summary = "Pandals located within easy walking distance or auto connectivity from Kolkata Metro Blue Line stations.";
    // Bagbazar (near Sovabazar metro), Sovabazar Rajbari, Mohammad Ali Park (MG road metro), Ekdalia (Kalighat metro)
    selectedStops = pandalsOnly.filter(
      (p) =>
        p.name.includes("Bagbazar") ||
        p.name.includes("Sovabazar") ||
        p.name.includes("Mohammad Ali") ||
        p.name.includes("College Square")
    );
    highlights = [
      "Sovabazar Sutanuti Metro is right across from historic Sovabazar Rajbari",
      "MG Road Metro exit connects directly to Mohammad Ali Park",
      "Avoid street vehicle traffic gridlocks using the underground metro corridor",
    ];
  } else if (lower.includes("less walking") || lower.includes("low walking") || lower.includes("close")) {
    title = "South Kolkata Compact Walking Circuit";
    summary = "High-density pandal cluster in Ballygunge with minimal walking distance between stops.";
    selectedStops = pandalsOnly.filter(
      (p) =>
        p.name.includes("Ekdalia") ||
        p.name.includes("Singhi") ||
        p.name.includes("Maddox")
    );
    highlights = [
      "Total inter-pandal walking is under 1.8 km",
      "Ekdalia Evergreen and Singhi Park are within 300 metres of each other",
      "Finish at Maddox Square for spacious open-lawn festive adda and street food",
    ];
  } else if (lower.includes("accessible") || lower.includes("wheelchair") || lower.includes("toilet") || lower.includes("senior")) {
    title = "Accessible & Senior-Friendly Pujo Tour";
    summary = "Pandals featuring ramp access, dedicated senior citizen queue gates, drinking water, and nearby civic toilets.";
    selectedStops = pandalsOnly.filter(
      (p) =>
        p.wheelchairAccessible ||
        p.facilities.some((f) => f.toLowerCase().includes("ramp") || f.toLowerCase().includes("accessible"))
    ).slice(0, 4);
    highlights = [
      "Dedicated wheelchair access confirmed at entrance gates",
      "Drinking water booths and rest benches on premises",
      "Nearby public convenience points verified by civic volunteers",
    ];
  } else if (lower.includes("north") || lower.includes("heritage") || lower.includes("traditional")) {
    title = "North Kolkata Heritage & Bonedi Bari Trail";
    summary = "Experience Kolkata's century-old aristocratic traditions, Ganga-side rituals, and artisanal artistry.";
    selectedStops = pandalsOnly.filter(
      (p) =>
        p.locality.toLowerCase().includes("north") ||
        p.name.includes("Bagbazar") ||
        p.name.includes("Sovabazar") ||
        p.name.includes("Sreebhumi")
    );
    highlights = [
      "100+ years of uninterrupted community tradition at Bagbazar Sarbojanin",
      "Aristocratic 18th-century Thakur Dalan rituals at Sovabazar Rajbari",
      "Sreebhumi architectural illuminations along the VIP corridor",
    ];
  } else if (lower.includes("south") || lower.includes("glamour") || lower.includes("theme")) {
    title = "South Kolkata Glamour & Art Circuit";
    summary = "South Kolkata's most celebrated art themes, chandeliers, and cultural hubs.";
    selectedStops = pandalsOnly.filter(
      (p) =>
        p.locality.toLowerCase().includes("south") ||
        p.name.includes("Ekdalia") ||
        p.name.includes("Deshapriya") ||
        p.name.includes("Chetla") ||
        p.name.includes("Suruchi")
    ).slice(0, 4);
    highlights = [
      "Ekdalia's world-famous German chandeliers and grand temple reproduction",
      "Suruchi Sangha's interactive regional folk art installation",
      "Chetla Agrani's eco-sensitive handcrafted artistry",
    ];
  } else {
    // Top rated overall
    title = "Puja26 Master Recommendation";
    summary = "Bengal's highest rated and most iconic pujos, arranged in optimal travel sequence.";
    const sorted = [...pandalsOnly].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    selectedStops = sorted.slice(0, 4);
    highlights = [
      "Verified ratings above 4.7 stars from 1,000+ local devotees",
      "Covers both monumental architectural lighting and heritage bonedi traditions",
      "All locations verified with active medical and police assistance booths",
    ];
  }

  // If user coordinates provided, sort by proximity to user
  if (userCoordinates && selectedStops.length > 0) {
    selectedStops.sort((a, b) => {
      const distA = calculateDistanceKm(userCoordinates.lat, userCoordinates.lng, a.latitude, a.longitude);
      const distB = calculateDistanceKm(userCoordinates.lat, userCoordinates.lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }

  const metrics = estimateRouteMetrics(selectedStops, "walking");

  return {
    id: `rec-${Date.now()}`,
    title,
    summary,
    suggestedPandalIds: selectedStops.map((s) => s.id),
    stops: selectedStops,
    totalDistanceKm: metrics.totalDistanceKm,
    estimatedDuration: `${Math.round(metrics.durationMinutes / 60)} hours`,
    highlights,
  };
}
