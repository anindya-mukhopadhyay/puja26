import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  FavouriteItem,
  Group,
  GroupMember,
  GroupStop,
  LocationItem,
  ReviewItem,
  VisitItem,
} from "./types";

// ========================
// 1. Favourites
// ========================

export async function toggleFavourite(
  userId: string,
  location: LocationItem
): Promise<boolean> {
  if (!db) throw new Error("Firebase is not configured.");
  const favDocId = `${userId}_${location.id}`;
  const favRef = doc(db, "favourites", favDocId);
  const snap = await getDoc(favRef);

  if (snap.exists()) {
    await deleteDoc(favRef);
    return false; // Removed
  } else {
    const item: FavouriteItem = {
      id: favDocId,
      userId,
      locationId: location.id,
      locationName: location.name,
      locality: location.locality,
      category: location.category,
      createdAt: Date.now(),
    };
    await setDoc(favRef, item);
    return true; // Added
  }
}

export function subscribeToUserFavourites(
  userId: string,
  onChange: (favs: FavouriteItem[]) => void
) {
  if (!db || !userId) {
    onChange([]);
    return () => {};
  }
  const q = query(collection(db, "favourites"), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as FavouriteItem);
      onChange(list);
    },
    (err) => {
      console.warn("Could not subscribe to favourites:", err);
      onChange([]);
    }
  );
}

// ========================
// 2. Visits
// ========================

export async function recordVisit(
  userId: string,
  location: LocationItem,
  visitedAt: string,
  notes?: string
): Promise<void> {
  if (!db) throw new Error("Firebase is not configured.");
  const visitId = `${userId}_${location.id}`;
  const item: VisitItem = {
    id: visitId,
    userId,
    locationId: location.id,
    locationName: location.name,
    locality: location.locality,
    visitedAt: visitedAt || new Date().toISOString().split("T")[0],
    notes: notes?.trim() || undefined,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "visits", visitId), item);
}

export function subscribeToUserVisits(
  userId: string,
  onChange: (visits: VisitItem[]) => void
) {
  if (!db || !userId) {
    onChange([]);
    return () => {};
  }
  const q = query(collection(db, "visits"), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as VisitItem);
      onChange(list);
    },
    (err) => {
      console.warn("Could not subscribe to visits:", err);
      onChange([]);
    }
  );
}

// ========================
// 3. Reviews & Ratings
// ========================

export async function submitReview(
  locationId: string,
  user: { uid: string; displayName: string },
  rating: number,
  comment: string
): Promise<void> {
  if (!db) throw new Error("Firebase is not configured.");
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5.");
  if (!comment.trim()) throw new Error("Please write a brief comment.");

  const reviewId = `${user.uid}_${locationId}`;
  const reviewRef = doc(db, "reviews", reviewId);

  const reviewData: ReviewItem = {
    id: reviewId,
    locationId,
    userId: user.uid,
    userName: user.displayName || "Anonymous Devotee",
    rating,
    comment: comment.trim(),
    createdAt: Date.now(),
  };

  await setDoc(reviewRef, reviewData);

  // Recalculate average rating for the location
  try {
    const q = query(collection(db, "reviews"), where("locationId", "==", locationId));
    const snap = await getDocs(q);
    const reviews = snap.docs.map((d) => d.data() as ReviewItem);
    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

    const pandalRef = doc(db, "pandals", locationId);
    await updateDoc(pandalRef, {
      rating: Number(avg.toFixed(1)),
      reviewCount: reviews.length,
    });
  } catch (err) {
    console.warn("Could not update pandal rating aggregates:", err);
  }
}

export function subscribeToLocationReviews(
  locationId: string,
  onChange: (reviews: ReviewItem[]) => void
) {
  if (!db || !locationId) {
    onChange([]);
    return () => {};
  }
  const q = query(
    collection(db, "reviews"),
    where("locationId", "==", locationId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as ReviewItem);
      onChange(list);
    },
    (err) => {
      console.warn("Could not subscribe to reviews:", err);
      onChange([]);
    }
  );
}

// ========================
// 4. Groups & Shared Itineraries
// ========================

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createGroup(
  name: string,
  description: string,
  user: { uid: string; displayName: string }
): Promise<Group> {
  if (!db) throw new Error("Firebase is not configured.");
  if (!name.trim()) throw new Error("Group name is required.");

  const inviteCode = generateInviteCode();
  const groupRef = doc(collection(db, "groups"));

  const groupData: Group = {
    id: groupRef.id,
    name: name.trim(),
    description: description.trim() || undefined,
    ownerId: user.uid,
    ownerName: user.displayName || "Group Creator",
    inviteCode,
    createdAt: Date.now(),
    memberCount: 1,
  };

  await setDoc(groupRef, groupData);

  // Add owner to members subcollection
  const memberData: GroupMember = {
    uid: user.uid,
    displayName: user.displayName || "Owner",
    role: "owner",
    joinedAt: Date.now(),
  };
  await setDoc(doc(db, "groups", groupRef.id, "members", user.uid), memberData);

  return groupData;
}

export async function joinGroupByCode(
  inviteCode: string,
  user: { uid: string; displayName: string }
): Promise<string> {
  if (!db) throw new Error("Firebase is not configured.");
  const cleanCode = inviteCode.trim().toUpperCase();
  const q = query(collection(db, "groups"), where("inviteCode", "==", cleanCode));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Invalid or expired invite code. Please check with your group organizer.");
  }

  const groupDoc = snap.docs[0];
  const groupId = groupDoc.id;

  const memberData: GroupMember = {
    uid: user.uid,
    displayName: user.displayName || "Member",
    role: "member",
    joinedAt: Date.now(),
  };

  await setDoc(doc(db, "groups", groupId, "members", user.uid), memberData);
  await updateDoc(doc(db, "groups", groupId), {
    memberCount: (groupDoc.data().memberCount || 1) + 1,
  });

  return groupId;
}

export function subscribeToGroupMembers(
  groupId: string,
  onChange: (members: GroupMember[]) => void
) {
  if (!db || !groupId) {
    onChange([]);
    return () => {};
  }
  return onSnapshot(collection(db, "groups", groupId, "members"), (snap) => {
    const list = snap.docs.map((d) => d.data() as GroupMember);
    onChange(list);
  });
}

export function subscribeToGroupStops(
  groupId: string,
  onChange: (stops: GroupStop[]) => void
) {
  if (!db || !groupId) {
    onChange([]);
    return () => {};
  }
  const q = query(collection(db, "groups", groupId, "stops"), orderBy("order", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupStop));
      onChange(list);
    },
    (err) => {
      console.warn("Could not subscribe to group stops:", err);
      onChange([]);
    }
  );
}

export async function addGroupStop(
  groupId: string,
  location: LocationItem,
  uid: string,
  currentStopsCount: number
): Promise<void> {
  if (!db) throw new Error("Firebase is not configured.");
  const stopRef = doc(collection(db, "groups", groupId, "stops"));
  const stopData: Omit<GroupStop, "id"> = {
    locationId: location.id,
    name: location.name,
    locality: location.locality,
    category: location.category,
    latitude: location.latitude,
    longitude: location.longitude,
    completed: false,
    order: currentStopsCount,
    addedBy: uid,
  };
  await setDoc(stopRef, stopData);
}

export async function toggleGroupStopCompleted(
  groupId: string,
  stopId: string,
  completed: boolean
): Promise<void> {
  if (!db) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, "groups", groupId, "stops", stopId), {
    completed,
  });
}

export async function leaveGroup(groupId: string, uid: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "groups", groupId, "members", uid));
}
