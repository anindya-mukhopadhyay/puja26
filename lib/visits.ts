import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const STORAGE_KEY = "puja26_visited_pandals_v1";

export function getStoredVisited(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredVisited(visitedIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedIds));
  } catch (err) {
    console.error("Failed to save visited pandals to localStorage:", err);
  }
}

export async function syncVisitToFirestore(pandalId: string, visited: boolean, userId?: string): Promise<void> {
  if (!db || !userId) return;
  try {
    const visitRef = doc(db, "visits", `${userId}_${pandalId}`);
    if (visited) {
      await setDoc(visitRef, {
        userId,
        locationId: pandalId,
        visitedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      await deleteDoc(visitRef);
    }
  } catch (err) {
    console.warn("Firestore visit sync warning:", err);
  }
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}
