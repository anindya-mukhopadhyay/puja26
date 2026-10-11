"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import styles from "./page.module.css";
import PujaMap, { type RouteStopMarker } from "@/components/PujaMap";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { signOutUser } from "@/lib/auth";
import { type Pandal, subscribeToPublishedPandals } from "@/lib/pandals";
import GroupsManager from "@/components/GroupsManager";
import { getStoredGroups, type PujaGroup } from "@/lib/groups";
import {
  optimizePandalRoute,
  type TravelMode,
  type OptimizationObjective,
  type OptimizationResult,
  type LocationNode,
  type RouteConstraints,
} from "@/lib/optimizer";

import {
  getStoredVisited,
  saveStoredVisited,
  syncVisitToFirestore,
  calculateDistanceKm,
  formatDistance,
} from "@/lib/visits";

type Category = "Pandal" | "Metro" | "Food" | "Toilet" | "Medical" | "Parking";
type FilterType = Category | "All" | "Visited";
type Place = {
  id: string;
  name: string;
  locality: string;
  address?: string;
  category: Category;
  rating?: string;
  reviews?: number;
  distance: string;
  distanceKm?: number;
  color: string;
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
  facilities: string[];
  description: string;
};

const civicUtilities: Place[] = [
  { id: "metro-1", name: "Belgachia Metro Station", locality: "Belgachia", category: "Metro", distance: "Transit Hub", color: "#26734D", x: 42, y: 68, latitude: 22.6062, longitude: 88.3846, facilities: ["Metro", "Auto stand"], description: "Nearest transit connection for North Kolkata pandals." },
  { id: "metro-2", name: "Shyambazar Metro Station", locality: "Shyambazar", category: "Metro", distance: "North Kolkata Junction", color: "#26734D", x: 40, y: 60, latitude: 22.6027, longitude: 88.3712, facilities: ["Metro", "Bus terminus"], description: "Key junction connecting Central and North Kolkata." },
  { id: "civic-1", name: "Public Drinking Water Point", locality: "Lake Town Connector", category: "Food", distance: "Drinking Water", color: "#F5BD32", x: 77, y: 50, latitude: 22.6015, longitude: 88.4012, facilities: ["Drinking water", "Purified water"], description: "Free civic drinking water facility." },
  { id: "civic-2", name: "Public Convenience & Restroom", locality: "VIP Road", category: "Toilet", distance: "Restroom", color: "#5D75A6", x: 35, y: 25, latitude: 22.6045, longitude: 88.4110, facilities: ["Accessible toilet"], description: "Civic sanitation point maintained for festival visitors." },
];

const placeFromPandal = (pandal: Pandal): Place => ({
  id: pandal.id,
  name: pandal.name,
  locality: pandal.locality || pandal.address || "Kolkata",
  address: pandal.address,
  category: "Pandal",
  rating: "4.8",
  reviews: 180,
  distance: "Published Pandal",
  color: "#C62828",
  x: 50,
  y: 50,
  latitude: pandal.latitude,
  longitude: pandal.longitude,
  facilities: ["Verified Pandal", "Confirmed Location"],
  description: pandal.description || (pandal.address ? `Address: ${pandal.address}` : "Published by a verified Puja26 administrator.")
});

const ROUTE_STORAGE_KEY = "puja26_user_route_v1";

function getStoredRoute(): Place[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROUTE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredRoute(places: Place[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(places));
  } catch (err) {
    console.error("Failed to save route to localStorage:", err);
  }
}

const nav = [
  ["map", "⌖", "Map"], ["routes", "⌁", "Routes"], ["connect", "◎", "Connect"], ["groups", "♧", "Groups"], ["profile", "◉", "Profile"],
] as const;

function Icon({ children }: { children: React.ReactNode }) { return <span aria-hidden="true" className={styles.icon}>{children}</span>; }

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState("map");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [saved, setSaved] = useState<string[]>([]);
  const [visited, setVisited] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState("");
  const [route, setRoute] = useState<Place[]>([]);
  const [routeToast, setRouteToast] = useState<{ message: string; placeName: string } | null>(null);

  // Shortest-Path Route Optimizer State
  const [optimizing, setOptimizing] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>("WALKING");
  const [objective, setObjective] = useState<OptimizationObjective>("FASTEST");
  const [startConstraint, setStartConstraint] = useState<"first" | "current_gps" | "none">("first");
  const [returnToStart, setReturnToStart] = useState(false);
  const [lockDestination, setLockDestination] = useState(false);
  const [dwellMinutes, setDwellMinutes] = useState(25);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [originalSequence, setOriginalSequence] = useState<Place[] | null>(null);
  const [sharing, setSharing] = useState(false);
  const [livePandals, setLivePandals] = useState<Pandal[]>([]);
  const [mapDataError, setMapDataError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setVisited(getStoredVisited());
    setRoute(getStoredRoute());
  }, []);

  useEffect(() => {
    if (!routeToast) return;
    const t = setTimeout(() => setRouteToast(null), 4500);
    return () => clearTimeout(t);
  }, [routeToast]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (current) => setUser(current));
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return subscribeToPublishedPandals(
      (pandals) => {
        setLivePandals(pandals);
        setMapDataError("");
      },
      (err) => setMapDataError(`Pandal updates: ${err}`)
    );
  }, []);

  const livePlaces = useMemo<Place[]>(() => {
    const list = livePandals.map((pandal, idx) => {
      const hasCoords = Number.isFinite(pandal.latitude) && Number.isFinite(pandal.longitude);
      const distKm =
        hasCoords && userLocation
          ? calculateDistanceKm(userLocation.lat, userLocation.lng, pandal.latitude, pandal.longitude)
          : undefined;

      return {
        id: pandal.id,
        name: pandal.name,
        locality: pandal.locality || pandal.address || "Kolkata",
        address: pandal.address,
        category: "Pandal" as Category,
        rating: (4.7 + ((idx % 3) * 0.1)).toFixed(1),
        reviews: 140 + idx * 35,
        distance: distKm !== undefined ? formatDistance(distKm) : "Published Pandal",
        distanceKm: distKm,
        color: "#C62828",
        x: 50,
        y: 50,
        latitude: pandal.latitude,
        longitude: pandal.longitude,
        facilities: ["Verified Pandal", "Confirmed Coordinates"],
        description:
          pandal.description || (pandal.address ? `Address: ${pandal.address}` : "Official published festival pandal."),
      };
    });

    if (sortByNearest) {
      list.sort((a, b) => {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return list;
  }, [livePandals, userLocation, sortByNearest]);

  const allPlaces = useMemo<Place[]>(() => {
    if (livePlaces.length > 0) {
      return [...livePlaces, ...civicUtilities];
    }
    return civicUtilities;
  }, [livePlaces]);

  const [selected, setSelected] = useState<Place | null>(null);
  const [userGroups, setUserGroups] = useState<PujaGroup[]>([]);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setUserGroups(getStoredGroups());
  }, [active]);

  const activeGroup = userGroups.length > 0 ? userGroups[0] : null;

  useEffect(() => {
    if (livePlaces.length > 0) {
      setSelected((prev) => {
        if (!prev || !livePlaces.some((p) => p.id === prev.id)) {
          return livePlaces[0];
        }
        return prev;
      });
    } else if (civicUtilities.length > 0) {
      setSelected((prev) => prev || civicUtilities[0]);
    }
  }, [livePlaces]);

  useEffect(() => {
    if (sortByNearest && livePlaces.length > 0) {
      setSelected(livePlaces[0]);
    }
  }, [sortByNearest]);

  const toggleVisited = (id: string) => {
    setVisited((prev) => {
      const isAlready = prev.includes(id);
      const updated = isAlready ? prev.filter((item) => item !== id) : [...prev, id];
      saveStoredVisited(updated);
      if (user?.uid) {
        syncVisitToFirestore(id, !isAlready, user.uid);
      }
      return updated;
    });
  };

  const handleToggleNearest = () => {
    if (sortByNearest) {
      setSortByNearest(false);
      return;
    }
    if (userLocation) {
      setSortByNearest(true);
      return;
    }
    setLocating(true);
    setLocationNotice("");
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setSortByNearest(true);
          setLocating(false);
        },
        (err) => {
          console.warn("Geolocation denied/failed:", err);
          const fallback = { lat: 22.5726, lng: 88.3639 };
          setUserLocation(fallback);
          setSortByNearest(true);
          setLocating(false);
          setLocationNotice("Location permission not granted. Distances calculated from central Kolkata.");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      const fallback = { lat: 22.5726, lng: 88.3639 };
      setUserLocation(fallback);
      setSortByNearest(true);
      setLocating(false);
      setLocationNotice("Geolocation not supported. Distances calculated from central Kolkata.");
    }
  };

  const handleFindShortestRoute = async () => {
    if (route.length < 2) {
      setRouteToast({
        placeName: "Routing Notice",
        message: "Add at least 2 pandals to calculate an optimized route.",
      });
      return;
    }

    setOptimizing(true);
    try {
      const baseStops: LocationNode[] = route.map((p, idx) => ({
        id: p.id,
        name: p.name,
        locality: p.locality || "Kolkata",
        latitude: p.latitude ?? (22.5726 + idx * 0.008),
        longitude: p.longitude ?? (88.3639 + idx * 0.008),
        dwellMinutes,
        isUserOrigin: false,
      }));

      let stopsToOptimize = [...baseStops];
      let fixedStartIndex: number | undefined = undefined;
      let fixedEndIndex: number | undefined = undefined;

      if (startConstraint === "current_gps") {
        if (userLocation) {
          const gpsNode: LocationNode = {
            id: "current_gps_origin",
            name: "My Current Location",
            locality: "GPS Origin",
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            dwellMinutes: 0,
            isUserOrigin: true,
          };
          stopsToOptimize = [gpsNode, ...baseStops];
          fixedStartIndex = 0;
        } else {
          fixedStartIndex = 0;
        }
      } else if (startConstraint === "first") {
        fixedStartIndex = 0;
      }

      if (lockDestination && stopsToOptimize.length > 2) {
        fixedEndIndex = stopsToOptimize.length - 1;
      }

      const constraints: RouteConstraints = {
        fixedStartIndex,
        fixedEndIndex,
        returnToStart,
        startTime: new Date(),
        dwellMinutesPerPandal: dwellMinutes,
      };

      if (!originalSequence) {
        setOriginalSequence([...route]);
      }

      const result = await optimizePandalRoute(
        stopsToOptimize,
        travelMode,
        objective,
        constraints
      );

      setOptimizationResult(result);

      // Reorder route state based on result.orderedStops
      const reorderedPlaces: Place[] = [];
      const seenIds = new Set<string>();

      for (const stop of result.orderedStops) {
        if (stop.id === "current_gps_origin") continue;
        if (seenIds.has(stop.id)) continue;
        seenIds.add(stop.id);

        const original = route.find((r) => r.id === stop.id);
        if (original) {
          reorderedPlaces.push(original);
        } else {
          reorderedPlaces.push({
            id: stop.id,
            name: stop.name,
            locality: stop.locality || "Kolkata",
            category: "Pandal",
            distance: "Stop",
            color: "#C62828",
            x: 50,
            y: 50,
            latitude: stop.latitude,
            longitude: stop.longitude,
            facilities: [],
            description: "",
          });
        }
      }

      setRoute(reorderedPlaces);
      saveStoredRoute(reorderedPlaces);

      const algoLabel = result.isExactOptimal
        ? `Held-Karp Exact Optimal (${result.executionTimeMs.toFixed(1)}ms)`
        : `2-Opt Heuristic (${result.executionTimeMs.toFixed(1)}ms)`;
      setRouteToast({
        placeName: `Shortest Route Found`,
        message: `${algoLabel} · Total ${result.totalDistanceMeters < 1000 ? `${result.totalDistanceMeters}m` : `${(result.totalDistanceMeters / 1000).toFixed(1)}km`}`,
      });
    } catch (err: any) {
      console.error("Optimization failed:", err);
      setRouteToast({
        placeName: "Optimization Error",
        message: err.message || "Could not optimize route",
      });
    } finally {
      setOptimizing(false);
    }
  };

  const handleRevertToOriginal = () => {
    if (!originalSequence) return;
    setRoute([...originalSequence]);
    saveStoredRoute(originalSequence);
    setOptimizationResult(null);
    setOriginalSequence(null);
    setRouteToast({
      placeName: "Original Order Restored",
      message: "Reverted itinerary back to your initial order.",
    });
  };

  const moveStop = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= route.length) return;
    const next = [...route];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setRoute(next);
    saveStoredRoute(next);
    setOptimizationResult(null);
  };

  const routeStopMarkers = useMemo<RouteStopMarker[]>(() => {
    if (optimizationResult && optimizationResult.orderedStops.length > 0) {
      return optimizationResult.orderedStops
        .filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
        .map((s, idx) => ({
          lat: s.latitude,
          lng: s.longitude,
          name: s.name,
          stopIndex: idx + 1,
          isVisited: visited.includes(s.id),
        }));
    }
    return route
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .map((p, idx) => ({
        lat: p.latitude as number,
        lng: p.longitude as number,
        name: p.name,
        stopIndex: idx + 1,
        isVisited: visited.includes(p.id),
      }));
  }, [route, optimizationResult, visited]);


  const toggleLiveSharing = () => {
    if (!sharing) {
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLiveCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setSharing(true);
          },
          () => {
            setLiveCoords({ lat: 22.5726, lng: 88.3639 });
            setSharing(true);
          }
        );
      } else {
        setLiveCoords({ lat: 22.5726, lng: 88.3639 });
        setSharing(true);
      }
    } else {
      setSharing(false);
      setLiveCoords(null);
    }
  };

  const userInitials = useMemo(() => {
    if (!user) return "AM";
    const name = user.displayName || user.email || "";
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || "AM").toUpperCase();
  }, [user]);

  const visible = useMemo(
    () =>
      allPlaces.filter((p) => {
        const matchesCategory =
          filter === "All"
            ? true
            : filter === "Visited"
            ? visited.includes(p.id)
            : p.category === filter;
        const matchesQuery = `${p.name} ${p.locality} ${p.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [allPlaces, filter, query, visited]
  );

  const displayedPandals = useMemo(() => {
    return livePlaces.filter((p) => {
      if (filter === "Visited") {
        return visited.includes(p.id);
      }
      return true;
    });
  }, [livePlaces, filter, visited]);

  const toggleSaved = (id: string) => setSaved((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);

  const toggleRoute = (place: Place) => {
    setRoute((prev) => {
      const exists = prev.some((p) => p.id === place.id);
      let updated: Place[];
      if (exists) {
        updated = prev.filter((p) => p.id !== place.id);
        setRouteToast({
          placeName: place.name,
          message: `Removed from route`,
        });
      } else {
        updated = [...prev, place];
        setRouteToast({
          placeName: place.name,
          message: `Added as Stop #${updated.length} in your route!`,
        });
      }
      saveStoredRoute(updated);
      return updated;
    });
  };

  const openPandalDirections = (place: Place) => {
    const dest =
      Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
        ? `${place.latitude},${place.longitude}`
        : encodeURIComponent(`${place.name}, ${place.locality || "Kolkata"}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
  };

  return <main className={styles.app}>
    <section className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span className={styles.motif}>✦</span><span>puja<span>26</span></span></div>
        <button className={styles.avatar} onClick={() => setActive("profile")} aria-label="Open profile">{userInitials}</button>
      </header>

      {active === "map" && <>
        <div className={styles.hero}><div><p className={styles.kicker}>SHUBHO MAHALAYA</p><h1>Find your <em>pujo.</em></h1><p>Discover pandals, plan your route, and celebrate together.</p></div><div className={styles.diya}>🪔</div></div>
        <div className={styles.searchWrap}>
          <Icon>⌕</Icon><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pandals, metro, toilets, food..." aria-label="Search places" />
          <button onClick={() => setQuery("")} aria-label="Clear search">×</button>
        </div>
        <div className={styles.chips} role="tablist" aria-label="Place categories">
          <button
            onClick={handleToggleNearest}
            className={sortByNearest ? styles.chipNearestActive : styles.chipNearest}
            title="Find nearest Durga Puja pandals based on your location"
          >
            {locating ? "📍 Locating..." : sortByNearest ? "📍 Nearest (Active ✓)" : "📍 Nearest to me"}
          </button>
          {(["All", "Pandal", "Visited", "Metro", "Food", "Toilet", "Medical", "Parking"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={filter === item ? styles.chipActive : ""}
            >
              {item === "All"
                ? "All places"
                : item === "Pandal"
                ? `Puja pandals (${livePandals.length || "Live"})`
                : item === "Visited"
                ? `✓ Visited (${visited.length})`
                : item}
            </button>
          ))}
        </div>
        <div className={styles.mapCard}>
          <PujaMap
            pandals={livePandals}
            selectedId={selected?.id}
            visitedIds={visited}
            userLocation={userLocation}
            onSelect={(pandal) => {
              const matched = allPlaces.find((p) => p.id === pandal.id);
              setSelected(matched || placeFromPandal(pandal));
            }}
          />
          <div className={styles.mapLegend}>
            <span><i className={styles.redDot}></i> Pandals ({livePandals.length})</span>
            <span><i style={{ background: "#2E7D32" }}></i> Visited ({visited.length})</span>
            {userLocation && <span><i style={{ background: "#1A73E8" }}></i> You</span>}
          </div>
          {locationNotice && (
            <div className={styles.toast}>
              {locationNotice}
              <button onClick={() => setLocationNotice("")}>Dismiss</button>
            </div>
          )}
          {mapDataError && <div className={styles.toast}>{mapDataError}<button onClick={() => setMapDataError("")}>Dismiss</button></div>}
        </div>
        {selected ? (
          <article className={`${styles.placeCard} ${visited.includes(selected.id) ? styles.placeCardVisited : ""}`}>
            <div className={styles.placePhoto}>
              <span>{visited.includes(selected.id) ? "✓" : "দুর্গা"}</span>
            </div>
            <div className={styles.placeInfo}>
              <div className={styles.placeTop}>
                <div>
                  <div className={styles.typeBadgeRow}>
                    <p className={styles.type}>{selected.category}</p>
                    {visited.includes(selected.id) && (
                      <span className={styles.visitedBadge}>✓ Visited</span>
                    )}
                    {route.some((p) => p.id === selected.id) && (
                      <span
                        className={styles.visitedBadge}
                        style={{ background: "#FFF3E0", color: "#E65100", borderColor: "#FFE0B2" }}
                      >
                        Stop #{route.findIndex((p) => p.id === selected.id) + 1}
                      </span>
                    )}
                  </div>
                  <h2>{selected.name}</h2>
                </div>
                <button className={saved.includes(selected.id) ? styles.saved : ""} onClick={() => toggleSaved(selected.id)} aria-label="Save location">{saved.includes(selected.id) ? "★" : "☆"}</button>
              </div>
              <p className={styles.muted}>
                {selected.locality} · <span className={selected.distanceKm !== undefined ? styles.distanceHighlight : ""}>{selected.distance}</span>
              </p>
              {selected.rating && <p className={styles.rating}>★ {selected.rating} <span>({selected.reviews} reviews)</span></p>}
              <div className={styles.actions}>
                <button
                  className={visited.includes(selected.id) ? styles.visitedBtnActive : styles.visitedBtn}
                  onClick={() => toggleVisited(selected.id)}
                  title={visited.includes(selected.id) ? "Marked as visited (click to toggle)" : "Mark pandal as visited"}
                >
                  {visited.includes(selected.id) ? "✓ Visited" : "✓ Mark as Visited"}
                </button>
                <button
                  className={route.some((p) => p.id === selected.id) ? styles.routeInBtn : styles.routeAddBtn}
                  onClick={() => toggleRoute(selected)}
                  title={route.some((p) => p.id === selected.id) ? "Currently in route itinerary. Click to remove" : "Add pandal to your route itinerary"}
                >
                  {route.some((p) => p.id === selected.id)
                    ? `✓ In Route (#${route.findIndex((p) => p.id === selected.id) + 1})`
                    : "＋ Add to Route"}
                </button>
                <button
                  className={styles.primary}
                  onClick={() => openPandalDirections(selected)}
                  title="Open direct turn-by-turn navigation in Google Maps"
                >
                  Directions ↗
                </button>
              </div>
              {route.length > 0 && (
                <div className={styles.routeCardHint}>
                  <span>🚶 <strong>{route.length} pandal{route.length === 1 ? "" : "s"}</strong> planned in your itinerary</span>
                  <button onClick={() => setActive("routes")}>View Itinerary →</button>
                </div>
              )}
            </div>
          </article>
        ) : (
          <div className={styles.emptyNotice}>
            <p>No published pandals found.</p>
            <p className={styles.subtle}>Publish your first pandal in the Admin portal to view it on the map.</p>
          </div>
        )}
        {route.length > 0 && (
          <div className={styles.routeFloatBar}>
            <div className={styles.routeFloatInfo}>
              <span className={styles.routeFloatIcon}>🚶</span>
              <div>
                <strong>Your Route: {route.length} Pandal{route.length === 1 ? "" : "s"} Planned</strong>
                <small>~{route.length * 35} mins estimated visit time · Tap to view full itinerary</small>
              </div>
            </div>
            <button className={styles.routeFloatBtn} onClick={() => setActive("routes")}>
              View Route ({route.length}) →
            </button>
          </div>
        )}
        <div className={styles.nearbyHeading}>
          <div>
            <p className={styles.kicker}>
              {sortByNearest ? "SORTED BY PROXIMITY" : "EXPLORE PUJOS"}
            </p>
            <h2>{sortByNearest ? "Nearest Pandals" : "Published Pandals"}</h2>
          </div>
          <div className={styles.nearbyActions}>
            {sortByNearest && (
              <button
                className={styles.resetSortBtn}
                onClick={() => setSortByNearest(false)}
                title="Reset proximity sorting"
              >
                Reset
              </button>
            )}
            <button
              className={filter === "Pandal" ? styles.seeAllBtnActive : styles.seeAllBtn}
              onClick={() => setFilter(filter === "Pandal" ? "All" : "Pandal")}
              title="Filter to published pandals"
            >
              {filter === "Pandal" ? "All places" : "See all pandals →"}
            </button>
          </div>
        </div>
        <div className={styles.nearby}>
          {displayedPandals.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--muted)", padding: "10px 0" }}>
              {filter === "Visited"
                ? "No visited pandals yet. Mark any pandal as visited to view it here!"
                : "No pandals published yet."}
            </p>
          ) : (
            displayedPandals.map((p) => {
              const isVisited = visited.includes(p.id);
              return (
                <button
                  key={p.id}
                  className={`${styles.nearbyCard} ${isVisited ? styles.nearbyCardVisited : ""}`}
                  onClick={() => setSelected(p)}
                >
                  <div className={`${styles.tinyPhoto} ${isVisited ? styles.tinyPhotoVisited : ""}`}>
                    {isVisited ? "✓" : "✦"}
                  </div>
                  {isVisited && <span className={styles.tinyVisitedTag}>✓ Visited</span>}
                  <strong>{p.name}</strong>
                  <span>★ {p.rating} · {p.locality}</span>
                  {p.distanceKm !== undefined && (
                    <small className={styles.nearbyDistance}>📍 {p.distance}</small>
                  )}
                </button>
              );
            })
          )}
        </div>
      </>}


      {active === "routes" && <section className={styles.screen}>
        <p className={styles.kicker}>YOUR DAY, BEAUTIFULLY PACED · GRAPH OPTIMIZER</p>
        <h1>Pandal Hopping <em>Optimizer</em></h1>
        {route.length === 0 ? (
          <div className={styles.emptyNotice}>
            <p>Your itinerary is currently empty.</p>
            <p className={styles.subtle}>Browse published pandals on the map and tap &apos;＋ Add to plan&apos; to build your route.</p>
            <button className={styles.primary} style={{ marginTop: "10px" }} onClick={() => setActive("map")}>
              Browse Pandals on Map →
            </button>
          </div>
        ) : (
          <>
            <p className={styles.intro}>
              {route.length} stop{route.length === 1 ? "" : "s"} selected · ~{route.length * dwellMinutes} mins total darshan estimate
            </p>

            {/* Optimizer Settings Toolbar */}
            <div className={styles.optimizerBox}>
              <div className={styles.optHeader}>
                <h3 className={styles.optTitle}>⚡ Shortest-Path Route Planner</h3>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {route.length <= 11 ? "Held-Karp Exact DP" : "2-Opt Local Search"}
                </span>
              </div>

              {/* Optimization Objective */}
              <div className={styles.optSection}>
                <label className={styles.optSectionLabel}>Optimization Preference</label>
                <div className={styles.optPillsRow}>
                  <button
                    className={`${styles.optPill} ${objective === "FASTEST" ? styles.optPillActive : ""}`}
                    onClick={() => { setObjective("FASTEST"); setOptimizationResult(null); }}
                    type="button"
                  >
                    ⚡ Fastest Journey
                  </button>
                  <button
                    className={`${styles.optPill} ${objective === "SHORTEST" ? styles.optPillActive : ""}`}
                    onClick={() => { setObjective("SHORTEST"); setOptimizationResult(null); }}
                    type="button"
                  >
                    📏 Shortest Distance
                  </button>
                  <button
                    className={`${styles.optPill} ${objective === "MIN_WALKING" ? styles.optPillActive : ""}`}
                    onClick={() => { setObjective("MIN_WALKING"); setOptimizationResult(null); }}
                    type="button"
                  >
                    👟 Minimum Walking
                  </button>
                </div>
              </div>

              {/* Travel Mode */}
              <div className={styles.optSection}>
                <label className={styles.optSectionLabel}>Travel Mode</label>
                <div className={styles.optPillsRow}>
                  <button
                    className={`${styles.optPill} ${travelMode === "WALKING" ? styles.optPillActive : ""}`}
                    onClick={() => { setTravelMode("WALKING"); setOptimizationResult(null); }}
                    type="button"
                  >
                    🚶 Walking
                  </button>
                  <button
                    className={`${styles.optPill} ${travelMode === "TRANSIT" ? styles.optPillActive : ""}`}
                    onClick={() => { setTravelMode("TRANSIT"); setOptimizationResult(null); }}
                    type="button"
                  >
                    🚇 Public Transit
                  </button>
                  <button
                    className={`${styles.optPill} ${travelMode === "DRIVING" ? styles.optPillActive : ""}`}
                    onClick={() => { setTravelMode("DRIVING"); setOptimizationResult(null); }}
                    type="button"
                  >
                    🚗 Driving / Taxi
                  </button>
                </div>
              </div>

              {/* Constraints */}
              <div className={styles.optConstraintsGrid}>
                <div className={styles.optFieldRow}>
                  <span className={styles.optFieldLabel}>📍 Start Point:</span>
                  <select
                    className={styles.optSelect}
                    value={startConstraint}
                    onChange={(e) => {
                      setStartConstraint(e.target.value as "first" | "current_gps" | "none");
                      setOptimizationResult(null);
                    }}
                  >
                    <option value="first">Fixed: Stop #1 ({route[0]?.name.slice(0, 18)}…)</option>
                    {userLocation && <option value="current_gps">My Current Location (GPS)</option>}
                    <option value="none">Free (Best starting pandal)</option>
                  </select>
                </div>

                <div className={styles.optFieldRow}>
                  <label className={styles.optToggle}>
                    <input
                      type="checkbox"
                      className={styles.optCheckbox}
                      checked={returnToStart}
                      onChange={(e) => { setReturnToStart(e.target.checked); setOptimizationResult(null); }}
                    />
                    <span>🔄 Return to start (Round-trip tour)</span>
                  </label>

                  {route.length > 2 && (
                    <label className={styles.optToggle}>
                      <input
                        type="checkbox"
                        className={styles.optCheckbox}
                        checked={lockDestination}
                        onChange={(e) => { setLockDestination(e.target.checked); setOptimizationResult(null); }}
                      />
                      <span>🏁 Lock last stop as destination</span>
                    </label>
                  )}
                </div>

                <div className={styles.optFieldRow}>
                  <span className={styles.optFieldLabel}>⏳ Time per pandal:</span>
                  <select
                    className={styles.optSelect}
                    value={dwellMinutes}
                    onChange={(e) => {
                      setDwellMinutes(Number(e.target.value));
                      if (optimizationResult) setOptimizationResult(null);
                    }}
                  >
                    <option value="15">15 mins (Quick Darshan)</option>
                    <option value="25">25 mins (Standard Visit)</option>
                    <option value="40">40 mins (Detailed Experience)</option>
                  </select>
                </div>
              </div>

              {/* Prominent Find Shortest Route Button */}
              <button
                className={styles.findRouteBtn}
                onClick={handleFindShortestRoute}
                disabled={optimizing || route.length < 2}
                id="find-shortest-route-btn"
              >
                {optimizing ? (
                  <>⏳ Calculating Optimal Visiting Order…</>
                ) : (
                  <>⚡ Find Shortest Route</>
                )}
              </button>
            </div>

            {/* Comparison & Savings Card */}
            {optimizationResult && (
              <div className={styles.comparisonCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <span className={styles.algoBadge}>
                    {optimizationResult.isExactOptimal ? "✨ Held-Karp Exact Optimal" : "🚀 2-Opt Local Search Heuristic"}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--muted)", fontWeight: "bold" }}>
                    Solved in {optimizationResult.executionTimeMs.toFixed(1)}ms · {optimizationResult.timeComplexity}
                  </span>
                </div>

                {optimizationResult.comparison && (optimizationResult.comparison.distanceSavedMeters > 50 || optimizationResult.comparison.durationSavedSeconds > 60) ? (
                  <div className={styles.comparisonBanner}>
                    <span>🎉</span>
                    <span>
                      Saved {(optimizationResult.comparison.distanceSavedMeters / 1000).toFixed(1)} km &amp; {Math.round(optimizationResult.comparison.durationSavedSeconds / 60)} mins ({optimizationResult.comparison.percentDurationSaved}% faster)!
                    </span>
                  </div>
                ) : (
                  <div className={styles.comparisonBanner}>
                    <span>✓</span>
                    <span>Arranged in optimal hopping sequence with zero unnecessary backtracking.</span>
                  </div>
                )}

                <div className={styles.metricsGrid}>
                  <div className={styles.metricCard}>
                    <span className={styles.metricCardTitle}>Total Travel Distance</span>
                    <span className={styles.metricCardValue}>
                      {optimizationResult.totalDistanceMeters < 1000
                        ? `${optimizationResult.totalDistanceMeters} m`
                        : `${(optimizationResult.totalDistanceMeters / 1000).toFixed(1)} km`}
                    </span>
                    <span className={styles.metricCardSub}>
                      🚶 {(optimizationResult.totalWalkingDistanceMeters / 1000).toFixed(1)} km walking
                    </span>
                  </div>
                  <div className={styles.metricCard}>
                    <span className={styles.metricCardTitle}>Transit / Travel Time</span>
                    <span className={styles.metricCardValue}>
                      ~{Math.round(optimizationResult.totalDurationSeconds / 60)} mins
                    </span>
                    <span className={styles.metricCardSub}>
                      Road &amp; foot transit
                    </span>
                  </div>
                  <div className={styles.metricCard}>
                    <span className={styles.metricCardTitle}>Darshan / Dwell Time</span>
                    <span className={styles.metricCardValue}>
                      ~{route.length * dwellMinutes} mins
                    </span>
                    <span className={styles.metricCardSub}>
                      {dwellMinutes}m per pandal visit
                    </span>
                  </div>
                  <div className={styles.metricCard}>
                    <span className={styles.metricCardTitle}>Door-to-Door Itinerary</span>
                    <span className={styles.metricCardValue}>
                      ~{Math.round((optimizationResult.totalDurationSeconds + route.length * dwellMinutes * 60) / 60)} mins
                    </span>
                    <span className={styles.metricCardSub}>
                      Full festival journey
                    </span>
                  </div>
                </div>

                {!optimizationResult.isExactOptimal && (
                  <small style={{ display: "block", marginTop: "8px", color: "#8c6514", fontSize: "10px" }}>
                    * 2-Opt local search was applied for sub-second performance across {route.length} stops.
                  </small>
                )}
              </div>
            )}

            {/* Route Map Preview */}
            <div className={styles.routeMapCard}>
              <PujaMap
                pandals={livePandals}
                routeStops={routeStopMarkers}
                routePolyline={optimizationResult?.overviewPolyline}
                userLocation={userLocation}
              />
            </div>

            {/* Timeline of Stops with Timetable & Connecting Legs */}
            <div className={styles.timeline}>
              {route.map((p, index) => {
                const prevLeg = optimizationResult?.legs && index > 0 ? optimizationResult.legs[index - 1] : undefined;
                const nextLeg = optimizationResult?.legs && index < optimizationResult.legs.length ? optimizationResult.legs[index] : undefined;

                return (
                  <div key={p.id}>
                    {/* Connecting Leg between stops */}
                    {prevLeg && (
                      <div className={styles.timelineConnector}>
                        <div className={styles.connectorLine}></div>
                        <span className={styles.legBadge}>
                          {travelMode === "WALKING" ? "🚶" : travelMode === "TRANSIT" ? "🚇" : "🚗"}
                          {" "}
                          {prevLeg.distanceMeters < 1000
                            ? `${prevLeg.distanceMeters}m`
                            : `${(prevLeg.distanceMeters / 1000).toFixed(1)} km`}
                          {" · "}
                          ~{Math.round(prevLeg.durationSeconds / 60)} mins
                          {prevLeg.departureTime ? ` · Departs ${prevLeg.departureTime}` : ""}
                        </span>
                      </div>
                    )}

                    <div className={styles.stop}>
                      <i className={visited.includes(p.id) ? styles.visitedStopIndex : ""}>
                        {visited.includes(p.id) ? "✓" : index + 1}
                      </i>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>
                          {p.name} {visited.includes(p.id) ? <span style={{ color: "#2e7d32", fontSize: "11px" }}>✓</span> : null}
                        </strong>
                        <span>{p.locality}</span>
                        {optimizationResult ? (
                          <small>
                            Stop {index + 1}
                            {index === 0
                              ? ` · Start (Departs ~${nextLeg?.departureTime || "Now"})`
                              : ` · Arrives ~${prevLeg?.arrivalTime || ""}${nextLeg ? ` · Departs ~${nextLeg.departureTime}` : ""}`}
                          </small>
                        ) : (
                          <small>Stop {index + 1} · {index === 0 ? "Starting point" : `~${index * dwellMinutes} mins later`}</small>
                        )}
                      </div>

                      <div className={styles.stopActionsRow}>
                        <button
                          className={`${styles.stopSmallBtn} ${visited.includes(p.id) ? styles.stopSmallBtnVisited : ""}`}
                          onClick={() => toggleVisited(p.id)}
                          title="Toggle visited"
                        >
                          {visited.includes(p.id) ? "✓ Visited" : "Mark"}
                        </button>
                        {index > 0 && (
                          <button
                            className={styles.stopSmallBtn}
                            onClick={() => moveStop(index, "up")}
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < route.length - 1 && (
                          <button
                            className={styles.stopSmallBtn}
                            onClick={() => moveStop(index, "down")}
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setRoute((r) => {
                              const next = r.filter((x) => x.id !== p.id);
                              saveStoredRoute(next);
                              return next;
                            });
                            setOptimizationResult(null);
                            setRouteToast({ placeName: p.name, message: "Removed from route" });
                          }}
                          aria-label={`Remove ${p.name}`}
                          className={styles.stopSmallBtn}
                          style={{ color: "#c62828" }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Return to start leg indicator if enabled */}
              {returnToStart && optimizationResult && optimizationResult.legs.length === route.length && (
                <div className={styles.timelineConnector}>
                  <div className={styles.connectorLine}></div>
                  <span className={styles.legBadge} style={{ background: "#fef3e2", borderColor: "#f5bd32" }}>
                    🔄 Return to Start: {route[0]?.name} (~{Math.round((optimizationResult.legs[optimizationResult.legs.length - 1]?.durationSeconds || 300) / 60)} mins)
                  </span>
                </div>
              )}
            </div>

            <button className={styles.addStop} onClick={() => setActive("map")}>
              ＋ Add another stop from map
            </button>

            <button
              className={styles.primaryWide}
              onClick={() => {
                const destination = encodeURIComponent(
                  route[route.length - 1].name + ", " + (route[route.length - 1].locality || "Kolkata")
                );
                const waypoints = route
                  .slice(0, -1)
                  .map((r) => encodeURIComponent(r.name + ", " + (r.locality || "Kolkata")))
                  .join("|");
                const gmapMode =
                  travelMode === "WALKING" ? "walking" : travelMode === "TRANSIT" ? "transit" : "driving";
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=${gmapMode}`,
                  "_blank"
                );
              }}
            >
              Open in Google Maps ↗
            </button>

            {/* Bottom Actions Row */}
            <div className={styles.routeBottomActions}>
              <button
                className={styles.revertBtn}
                onClick={() => {
                  saveStoredRoute(route);
                  setRouteToast({
                    placeName: "Route Saved",
                    message: "Saved your itinerary stops and optimal sequence!",
                  });
                }}
              >
                💾 Save Route
              </button>

              {originalSequence ? (
                <button className={styles.revertBtn} onClick={handleRevertToOriginal}>
                  ↩ Revert to Original Order
                </button>
              ) : (
                <button
                  className={styles.revertBtn}
                  onClick={() => {
                    setRoute([]);
                    saveStoredRoute([]);
                    setOptimizationResult(null);
                    setRouteToast({ placeName: "Itinerary", message: "Cleared all stops from route" });
                  }}
                >
                  Clear Itinerary
                </button>
              )}
            </div>
          </>
        )}
      </section>}


      {active === "connect" && <section className={styles.screen}>
        <p className={styles.kicker}>EXPLORE TOGETHER, ON YOUR TERMS</p>
        <h1>Stay in <em>sync.</em></h1>
        <div className={styles.connectCard}>
          <span className={styles.bigIcon}>⌖</span>
          <h2>Share live location</h2>
          <p>Only people in your active group can see your location, and only while you choose to share it.</p>
          <button
            className={sharing ? styles.stopShare : styles.primaryWide}
            onClick={toggleLiveSharing}
          >
            {sharing ? "Stop sharing" : "Start sharing"}
          </button>
          {sharing && (
            <small className={styles.live}>
              ● Live location sharing active {liveCoords ? `(${liveCoords.lat.toFixed(4)}, ${liveCoords.lng.toFixed(4)})` : ""} — visible to your {activeGroup ? activeGroup.name : "active group"} members.
            </small>
          )}
        </div>
        <h2 className={styles.sectionTitle}>
          {activeGroup ? `With your group: ${activeGroup.name}` : "With your group"}
        </h2>
        {activeGroup && activeGroup.members.filter((m) => m.id !== (user?.uid || "usr-self") && m.name !== (user?.displayName || "You")).length > 0 ? (
          activeGroup.members
            .filter((m) => m.id !== (user?.uid || "usr-self") && m.name !== (user?.displayName || "You"))
            .map((m) => (
              <div className={styles.member} key={m.id}>
                <span>{m.initials}</span>
                <div>
                  <strong>{m.name}</strong>
                  <small>{m.lastActive ? `Active ${m.lastActive}` : "Group member"}</small>
                </div>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hey ${m.name}! Where are you at for Pujo hopping?`)}`, "_blank")}>
                  Message
                </button>
              </div>
            ))
        ) : activeGroup ? (
          <div className={styles.emptyNotice}>
            <p>You are the organizer in <strong>{activeGroup.name}</strong> (Code: <code>{activeGroup.inviteCode}</code>).</p>
            <p className={styles.subtle}>No other members have joined yet. Share your group invite link or QR code to see their location here!</p>
            <button className={styles.secondary} style={{ width: "100%" }} onClick={() => setActive("groups")}>
              Invite friends with QR / Link →
            </button>
          </div>
        ) : (
          <div className={styles.emptyNotice}>
            <p>You haven&apos;t created or joined a group yet.</p>
            <p className={styles.subtle}>Create a group with your friends to coordinate pandal hopping and stay in sync in real time.</p>
            <button className={styles.primary} style={{ width: "100%" }} onClick={() => setActive("groups")}>
              Create or Join a Group →
            </button>
          </div>
        )}
        <button className={styles.secondary} style={{ width: "100%", marginTop: "12px" }} onClick={() => setActive("groups")}>
          Manage Groups & Itineraries →
        </button>
      </section>}

      {active === "groups" && (
        <GroupsManager
          publishedPandals={livePandals}
          user={user}
          onViewRoute={(stops) => {
            setRoute(stops as Place[]);
            setActive("routes");
          }}
          onNavigateTab={setActive}
        />
      )}

      {active === "profile" && <section className={styles.screen}>
        <div className={styles.profileHead}>
          <div className={styles.profileAvatar}>{userInitials}</div>
          <div>
            <p className={styles.kicker}>{user ? "SIGNED IN USER" : "GUEST EXPLORER"}</p>
            <h1>{user ? (user.displayName || user.email?.split("@")[0] || "Explorer") : "Guest User"}</h1>
            <span>{user ? `● ${user.email}` : "Local visitor mode"}</span>
          </div>
        </div>
        <div className={styles.stats}>
          <div><strong>{saved.length}</strong><span>Saved</span></div>
          <div><strong>{visited.length}</strong><span>Visited</span></div>
          <div><strong>{userGroups.length}</strong><span>Groups</span></div>
        </div>
        <div className={styles.settings}>
          <button>♡ Saved pandals <span>›</span></button>
          <button>◷ Visit history <span>›</span></button>
          <button>⚙ Account & privacy <span>›</span></button>
          {user ? (
            <button onClick={async () => { await signOutUser(); }} style={{ color: "#a22525", fontWeight: 700 }}>
              ↪ Sign out <span>›</span>
            </button>
          ) : (
            <button onClick={() => router.push("/login")} style={{ fontWeight: 700, color: "#780d19" }}>
              ↪ Sign in or Create Account to sync <span>›</span>
            </button>
          )}
          <button onClick={() => router.push("/admin/login")}>
            ✦ Organizer & Admin Portal <span>›</span>
          </button>
        </div>
      </section>}

      {routeToast && (
        <div className={styles.routeToast} role="status">
          <div>
            <strong>{routeToast.placeName}</strong>
            <span>: {routeToast.message}</span>
          </div>
          <div className={styles.routeToastActions}>
            <button
              className={styles.routeToastViewBtn}
              onClick={() => {
                setActive("routes");
                setRouteToast(null);
              }}
            >
              View Route ({route.length}) →
            </button>
            <button
              className={styles.routeToastCloseBtn}
              onClick={() => setRouteToast(null)}
              aria-label="Dismiss toast"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <nav className={styles.nav} aria-label="Main navigation">
        {nav.map(([id, glyph, label]) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`${active === id ? styles.activeNav : ""} ${styles.navBtn}`}
          >
            <div className={styles.navIconWrap}>
              <Icon>{glyph}</Icon>
              {id === "routes" && route.length > 0 && (
                <span className={styles.navBadge}>{route.length}</span>
              )}
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </section>
  </main>;
}
