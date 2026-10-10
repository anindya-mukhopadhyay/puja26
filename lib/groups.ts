import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type GroupMember = {
  id: string;
  name: string;
  role: "organizer" | "member";
  initials: string;
  lastActive?: string;
};

export type GroupStop = {
  id: string;
  name: string;
  locality: string;
  latitude?: number;
  longitude?: number;
};

export type PujaGroup = {
  id: string;
  name: string;
  tagline: string;
  date: string;
  inviteCode: string;
  ownerId?: string;
  members: GroupMember[];
  stops: GroupStop[];
  createdAt: number;
};

const STORAGE_KEY = "puja26_user_groups_v2";

export function getStoredGroups(): PujaGroup[] {
  if (typeof window === "undefined") return [];
  try {
    // Clean up old demo key if it exists
    if (localStorage.getItem("puja26_user_groups_v1")) {
      localStorage.removeItem("puja26_user_groups_v1");
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredGroups(groups: PujaGroup[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (err) {
    console.error("Failed to save groups to localStorage:", err);
  }
}

export function generateInviteCode(name: string): string {
  const prefix = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "PUJA";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export async function syncGroupToFirestore(group: PujaGroup, userId?: string): Promise<void> {
  if (!db || !userId) return;
  try {
    const groupRef = doc(db, "groups", group.id);
    await setDoc(groupRef, {
      id: group.id,
      name: group.name,
      tagline: group.tagline,
      date: group.date,
      inviteCode: group.inviteCode,
      ownerId: userId,
      memberCount: group.members.length,
      stopCount: group.stops.length,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn("Firestore group sync optional warning:", e);
  }
}
