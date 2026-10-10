import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
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

const STORAGE_KEY = "puja26_user_groups_v1";

export const initialSampleGroups: PujaGroup[] = [
  {
    id: "group-pujo2026",
    name: "Pujo 2026",
    tagline: "Tonight · 2 planned stops",
    date: "Thursday, 23 October",
    inviteCode: "PUJA26-KOL78",
    members: [
      { id: "m-1", name: "You", role: "organizer", initials: "ME", lastActive: "Just now" },
      { id: "m-2", name: "Riya Sen", role: "member", initials: "RS", lastActive: "4 min ago" },
      { id: "m-3", name: "Anirban Das", role: "member", initials: "AD", lastActive: "12 min ago" },
      { id: "m-4", name: "Poulomi Roy", role: "member", initials: "PR", lastActive: "1 hr ago" },
    ],
    stops: [
      { id: "sample-stop-1", name: "Dum Dum Park Sarbojanin Durga Puja Samity", locality: "Dum Dum Park", latitude: 22.6094363, longitude: 88.4164052 },
      { id: "sample-stop-2", name: "Tala Prattoy Durga Puja Art", locality: "Kolkata", latitude: 22.6087911, longitude: 88.382502 },
    ],
    createdAt: 1729000000000,
  },
];

export function getStoredGroups(): PujaGroup[] {
  if (typeof window === "undefined") return initialSampleGroups;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSampleGroups));
      return initialSampleGroups;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialSampleGroups;
  } catch {
    return initialSampleGroups;
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
