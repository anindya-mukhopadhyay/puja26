import { GeoPoint, Timestamp, addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";

export type PandalStatus = "draft" | "published" | "archived";
export type Pandal = {
  id: string;
  name: string;
  address: string;
  locality: string;
  latitude: number;
  longitude: number;
  description?: string;
  photoURL?: string;
  status: PandalStatus;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type PandalInput = Pick<Pandal, "name" | "address" | "locality" | "latitude" | "longitude" | "description" | "photoURL" | "status">;

const toPandal = (snapshot: { id: string; data: () => Record<string, unknown> }): Pandal => {
  const value = snapshot.data();
  const point = value.location as GeoPoint | undefined;
  return { id: snapshot.id, name: String(value.name || "Unnamed pandal"), address: String(value.address || ""), locality: String(value.locality || ""), latitude: Number(value.latitude ?? point?.latitude), longitude: Number(value.longitude ?? point?.longitude), description: value.description ? String(value.description) : undefined, photoURL: value.photoURL ? String(value.photoURL) : undefined, status: value.status as PandalStatus, createdBy: String(value.createdBy || ""), createdAt: value.createdAt as Timestamp | undefined, updatedAt: value.updatedAt as Timestamp | undefined };
};

export function subscribeToPublishedPandals(onChange: (items: Pandal[]) => void, onError: (message: string) => void) {
  if (!db) { onChange([]); return () => undefined; }
  return onSnapshot(
    query(collection(db, "pandals"), where("status", "==", "published")),
    (snapshot) => {
      const items = snapshot.docs.map(toPandal);
      items.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() ?? (a.createdAt?.toMillis?.() ?? 0);
        const timeB = b.updatedAt?.toMillis?.() ?? (b.createdAt?.toMillis?.() ?? 0);
        return timeB - timeA;
      });
      onChange(items);
    },
    (error) => {
      console.error("Firestore subscription error:", error);
      onError(error.message);
    }
  );
}

export function subscribeToAdminPandals(onChange: (items: Pandal[]) => void, onError: (message: string) => void) {
  if (!db) { onChange([]); return () => undefined; }
  return onSnapshot(query(collection(db, "pandals"), orderBy("updatedAt", "desc")), (snapshot) => onChange(snapshot.docs.map(toPandal)), (error) => onError(error.message));
}

const validCoordinates = (latitude: number, longitude: number) => Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

export async function publishPandal(input: PandalInput, uid: string) {
  if (!db) throw new Error("Firebase is not configured. Add the public Firebase API key to .env.local.");
  if (!input.name.trim() || !validCoordinates(input.latitude, input.longitude)) throw new Error("A pandal name and valid confirmed coordinates are required.");
  return addDoc(collection(db, "pandals"), { ...input, name: input.name.trim(), address: input.address.trim(), locality: input.locality.trim(), location: new GeoPoint(input.latitude, input.longitude), createdBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updatePandal(id: string, input: PandalInput) {
  if (!db) throw new Error("Firebase is not configured.");
  if (!input.name.trim() || !validCoordinates(input.latitude, input.longitude)) throw new Error("A pandal name and valid confirmed coordinates are required.");
  return updateDoc(doc(db, "pandals", id), { ...input, name: input.name.trim(), address: input.address.trim(), locality: input.locality.trim(), location: new GeoPoint(input.latitude, input.longitude), updatedAt: serverTimestamp() });
}

export async function archivePandal(id: string) { if (!db) throw new Error("Firebase is not configured."); return updateDoc(doc(db, "pandals", id), { status: "archived", updatedAt: serverTimestamp() }); }
export async function removePandal(id: string) { if (!db) throw new Error("Firebase is not configured."); return deleteDoc(doc(db, "pandals", id)); }
