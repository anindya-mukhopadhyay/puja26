import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Itinerary, ItineraryDay, LocationItem } from "./types";

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function estimateRouteMetrics(
  stops: LocationItem[],
  mode: "walking" | "transit" | "driving" = "walking"
): { totalDistanceKm: number; durationMinutes: number; summaryText: string } {
  if (stops.length < 2) {
    return {
      totalDistanceKm: 0,
      durationMinutes: stops.length === 1 ? 20 : 0,
      summaryText: stops.length === 1 ? "1 stop selected" : "No stops added yet",
    };
  }

  let totalDistance = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    totalDistance += calculateDistanceKm(
      stops[i].latitude,
      stops[i].longitude,
      stops[i + 1].latitude,
      stops[i + 1].longitude
    );
  }

  // Speed in km/h based on Kolkata festival reality
  const speedKmH = mode === "walking" ? 4.2 : mode === "transit" ? 14 : 18;
  const travelTimeMinutes = Math.round((totalDistance / speedKmH) * 60);
  const stopDwellMinutes = (stops.length - 1) * 20; // ~20 min browsing per pandal
  const totalDuration = travelTimeMinutes + stopDwellMinutes;

  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;
  const durationText = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;

  return {
    totalDistanceKm: Number(totalDistance.toFixed(1)),
    durationMinutes: totalDuration,
    summaryText: `${stops.length} stops · ${totalDistance.toFixed(1)} km · ~${durationText}`,
  };
}

export function generateGoogleMapsDirectionsUrl(
  stops: LocationItem[],
  mode: "walking" | "transit" | "driving" = "walking"
): string {
  if (stops.length === 0) return "https://www.google.com/maps";
  if (stops.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${stops[0].name}, ${stops[0].locality}`
    )}`;
  }

  const origin = `${stops[0].latitude},${stops[0].longitude}`;
  const destination = `${stops[stops.length - 1].latitude},${stops[stops.length - 1].longitude}`;

  const waypoints = stops
    .slice(1, stops.length - 1)
    .map((s) => `${s.latitude},${s.longitude}`)
    .join("|");

  const travelmodeParam = mode === "transit" ? "transit" : mode === "driving" ? "driving" : "walking";

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelmodeParam}`;
  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return url;
}

export async function saveItinerary(
  userId: string,
  title: string,
  day: ItineraryDay,
  stops: LocationItem[],
  travelMode: "walking" | "transit" | "driving",
  notes?: string
): Promise<string> {
  if (!db) throw new Error("Firebase is not configured.");
  const metrics = estimateRouteMetrics(stops, travelMode);
  const itineraryRef = doc(collection(db, "itineraries"));

  const data: Itinerary = {
    id: itineraryRef.id,
    userId,
    title: title.trim() || `Pujo Route: ${day}`,
    day,
    stops,
    travelMode,
    totalDistanceKm: metrics.totalDistanceKm,
    totalDurationMin: metrics.durationMinutes,
    createdAt: Date.now(),
    notes: notes?.trim() || undefined,
  };

  await setDoc(itineraryRef, data);
  return itineraryRef.id;
}

export function subscribeToUserItineraries(
  userId: string,
  onChange: (itineraries: Itinerary[]) => void
) {
  if (!db || !userId) {
    onChange([]);
    return () => {};
  }
  const q = query(
    collection(db, "itineraries"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Itinerary);
      onChange(list);
    },
    (err) => {
      console.warn("Could not subscribe to itineraries:", err);
      onChange([]);
    }
  );
}

export async function deleteItinerary(itineraryId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "itineraries", itineraryId));
}
