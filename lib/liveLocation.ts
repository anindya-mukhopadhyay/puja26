import { onDisconnect, onValue, ref, remove, set, update } from "firebase/database";
import { realtimeDb } from "./firebase";
import type { LiveLocation } from "./types";

let activeWatchId: number | null = null;
let activeGroupId: string | null = null;
let activeUid: string | null = null;

export const STALE_LOCATION_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

export function isLocationStale(updatedAt: number): boolean {
  if (!updatedAt) return true;
  return Date.now() - updatedAt > STALE_LOCATION_THRESHOLD_MS;
}

export function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 15) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

export async function startSharingLocation(
  groupId: string,
  user: { uid: string; displayName: string },
  onUpdate?: (pos: { lat: number; lng: number; accuracy: number }) => void,
  onError?: (err: Error) => void
): Promise<() => void> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    throw new Error("Geolocation is not supported by your browser.");
  }
  if (!realtimeDb) {
    throw new Error("Firebase Realtime Database is not configured.");
  }

  // Stop any previous active watcher
  stopSharingLocation();

  activeGroupId = groupId;
  activeUid = user.uid;

  const locRef = ref(realtimeDb, `groupLocations/${groupId}/${user.uid}`);

  // Set up onDisconnect hook so if user closes browser, sharing turns off
  try {
    await onDisconnect(locRef).update({
      sharing: false,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn("Could not set up onDisconnect presence:", e);
  }

  // Request high-accuracy continuous updates
  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy);
      const updatedAt = Date.now();

      onUpdate?.({ lat, lng, accuracy });

      try {
        await set(locRef, {
          uid: user.uid,
          displayName: user.displayName || "Group Member",
          lat,
          lng,
          accuracy,
          updatedAt,
          sharing: true,
        });
      } catch (err) {
        console.warn("Failed to push GPS update to Realtime Database:", err);
      }
    },
    (geoError) => {
      let msg = "Could not retrieve GPS location.";
      if (geoError.code === geoError.PERMISSION_DENIED) {
        msg = "Location permission was denied. Please allow location access in your browser settings.";
      } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
        msg = "GPS signal is currently unavailable.";
      } else if (geoError.code === geoError.TIMEOUT) {
        msg = "GPS request timed out.";
      }
      onError?.(new Error(msg));
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000,
    }
  );

  activeWatchId = watchId;

  return () => {
    stopSharingLocation();
  };
}

export async function stopSharingLocation(): Promise<void> {
  if (activeWatchId !== null && typeof window !== "undefined") {
    navigator.geolocation.clearWatch(activeWatchId);
    activeWatchId = null;
  }

  if (realtimeDb && activeGroupId && activeUid) {
    const locRef = ref(realtimeDb, `groupLocations/${activeGroupId}/${activeUid}`);
    try {
      await update(locRef, {
        sharing: false,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn("Error marking location as stopped:", e);
    }
  }

  activeGroupId = null;
  activeUid = null;
}

export function subscribeToGroupLiveLocations(
  groupId: string,
  onChange: (locations: LiveLocation[]) => void
) {
  if (!realtimeDb || !groupId) {
    onChange([]);
    return () => {};
  }

  const groupLocRef = ref(realtimeDb, `groupLocations/${groupId}`);
  return onValue(groupLocRef, (snapshot) => {
    if (!snapshot.exists()) {
      onChange([]);
      return;
    }

    const val = snapshot.val() as Record<string, LiveLocation>;
    const list: LiveLocation[] = Object.values(val).filter((item) => item && item.sharing);
    onChange(list);
  });
}
