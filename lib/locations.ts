import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  GeoPoint,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { SEED_LOCATIONS } from "./seedData";
import type { Category, LocationItem } from "./types";

export type LocationInput = Omit<LocationItem, "id" | "createdAt" | "updatedAt">;

function docToLocation(id: string, value: Record<string, unknown>): LocationItem {
  const pt = value.location as GeoPoint | undefined;
  const lat = Number(value.latitude ?? pt?.latitude ?? 22.5726);
  const lng = Number(value.longitude ?? pt?.longitude ?? 88.3639);

  return {
    id,
    name: String(value.name || "Unnamed place"),
    category: (value.category as Category) || "Pandal",
    address: String(value.address || ""),
    locality: String(value.locality || "Kolkata"),
    latitude: lat,
    longitude: lng,
    description: value.description ? String(value.description) : undefined,
    photoURL: value.photoURL ? String(value.photoURL) : undefined,
    facilities: Array.isArray(value.facilities) ? (value.facilities as string[]) : [],
    rating: value.rating ? Number(value.rating) : undefined,
    reviewCount: value.reviewCount ? Number(value.reviewCount) : undefined,
    operatingHours: value.operatingHours ? String(value.operatingHours) : undefined,
    festivalDates: value.festivalDates ? String(value.festivalDates) : undefined,
    contactNumber: value.contactNumber ? String(value.contactNumber) : undefined,
    wheelchairAccessible: Boolean(value.wheelchairAccessible),
    status: (value.status as "published" | "draft" | "archived") || "published",
    createdBy: String(value.createdBy || "unknown"),
  };
}

export function subscribeToPublishedLocations(
  categoryFilter: Category | "All",
  onChange: (items: LocationItem[]) => void,
  onError?: (err: Error) => void
) {
  if (!db) {
    const filtered =
      categoryFilter === "All"
        ? SEED_LOCATIONS
        : SEED_LOCATIONS.filter((l) => l.category === categoryFilter);
    onChange(filtered);
    return () => {};
  }

  // Subscribe to real-time Firestore pandals / locations
  const q = query(
    collection(db, "pandals"),
    where("status", "==", "published"),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const liveItems = snap.docs.map((d) => docToLocation(d.id, d.data()));
      // Merge with seed locations: Firestore takes precedence if ID matches; otherwise seed fills in
      const existingIds = new Set(liveItems.map((i) => i.id));
      const combined = [
        ...liveItems,
        ...SEED_LOCATIONS.filter((s) => !existingIds.has(s.id)),
      ];

      const filtered =
        categoryFilter === "All"
          ? combined
          : combined.filter((i) => i.category === categoryFilter);

      onChange(filtered);
    },
    (err) => {
      console.warn("Firestore subscription error; falling back to curated seed locations:", err);
      const filtered =
        categoryFilter === "All"
          ? SEED_LOCATIONS
          : SEED_LOCATIONS.filter((l) => l.category === categoryFilter);
      onChange(filtered);
      onError?.(err);
    }
  );
}

export async function addLocation(input: LocationInput, uid: string): Promise<string> {
  if (!db) throw new Error("Firebase is not configured.");
  if (!input.name.trim()) throw new Error("Location name is required.");
  if (typeof input.latitude !== "number" || typeof input.longitude !== "number") {
    throw new Error("Valid geographic coordinates are required.");
  }

  const docRef = await addDoc(collection(db, "pandals"), {
    ...input,
    name: input.name.trim(),
    address: input.address.trim(),
    locality: input.locality.trim(),
    location: new GeoPoint(input.latitude, input.longitude),
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateLocation(id: string, input: Partial<LocationInput>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured.");
  const data: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };

  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    data.location = new GeoPoint(input.latitude, input.longitude);
  }

  await updateDoc(doc(db, "pandals", id), data);
}

export async function deleteLocation(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured.");
  await deleteDoc(doc(db, "pandals", id));
}

export async function seedLocationsToFirestore(uid: string): Promise<number> {
  if (!db) throw new Error("Firebase is not configured.");
  const batch = writeBatch(db);
  let count = 0;

  for (const item of SEED_LOCATIONS) {
    const docRef = doc(db, "pandals", item.id);
    batch.set(
      docRef,
      {
        ...item,
        location: new GeoPoint(item.latitude, item.longitude),
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    count++;
  }

  await batch.commit();
  return count;
}
