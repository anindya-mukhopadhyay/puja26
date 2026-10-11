"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import PujaMap from "@/components/PujaMap";
import AuthModal from "@/components/AuthModal";
import VisitModal from "@/components/VisitModal";
import ReviewsDrawer from "@/components/ReviewsDrawer";
import AIPlannerModal from "@/components/AIPlannerModal";
import GroupInviteModal from "@/components/GroupInviteModal";
import AreaPandalSelectorModal from "@/components/AreaPandalSelectorModal";
import { useAuth, logoutUser } from "@/lib/auth";
import { subscribeToPublishedLocations } from "@/lib/locations";
import { SEED_LOCATIONS } from "@/lib/seedData";
import { fetchGooglePlaceInfo, type GooglePlaceDetails } from "@/lib/googlePlaces";
import { findNearestPandal } from "@/lib/routeOptimizer";
import {
  startSharingLocation,
  stopSharingLocation,
  subscribeToGroupLiveLocations,
  formatTimeAgo,
  isLocationStale,
} from "@/lib/liveLocation";
import {
  getStoredVisited,
  saveStoredVisited,
  syncVisitToFirestore,
  calculateDistanceKm,
  formatDistance,
} from "@/lib/visits";
import {
  toggleFavourite,
  subscribeToUserFavourites,
  subscribeToUserVisits,
  createGroup,
  joinGroupByCode,
  subscribeToGroupMembers,
  subscribeToGroupStops,
  addGroupStop,
  toggleGroupStopCompleted,
} from "@/lib/social";
import {
  estimateRouteMetrics,
  generateGoogleMapsDirectionsUrl,
  saveItinerary,
  subscribeToUserItineraries,
} from "@/lib/routes";
import { fetchKolkataWeather } from "@/lib/weather";
import type {
  Category,
  FavouriteItem,
  Group,
  GroupMember,
  GroupStop,
  Itinerary,
  ItineraryDay,
  LiveLocation,
  LocationItem,
  VisitItem,
  WeatherForecast,
} from "@/lib/types";

const NAV_ITEMS = [
  ["map", "⌖", "Map"],
  ["routes", "⌁", "Routes"],
  ["connect", "◎", "Connect"],
  ["groups", "♧", "Groups"],
  ["profile", "◉", "Profile"],
] as const;

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className={styles.icon}>
      {children}
    </span>
  );
}

export default function Home() {
  const { user, profile } = useAuth();

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<(typeof NAV_ITEMS)[number][0]>("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");

  // Locations Data
  const [locations, setLocations] = useState<LocationItem[]>(SEED_LOCATIONS);
  const [selectedPlace, setSelectedPlace] = useState<LocationItem>(SEED_LOCATIONS[0]);
  const [mapError, setMapError] = useState("");

  // User GPS & Nearest Pandal
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestNotice, setNearestNotice] = useState("");
  const [locatingNearest, setLocatingNearest] = useState(false);

  // Google Maps Place Info
  const [googlePlaceDetails, setGooglePlaceDetails] = useState<GooglePlaceDetails | null>(null);
  const [loadingGoogleDetails, setLoadingGoogleDetails] = useState(false);

  // Favourites, Visits & Proximity
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [sortByNearest, setSortByNearest] = useState(false);

  // Route & Day-Wise Itineraries
  const [activeDay, setActiveDay] = useState<ItineraryDay>("Day 1 (Saptami)");
  const [routeStops, setRouteStops] = useState<LocationItem[]>([
    SEED_LOCATIONS[0],
    SEED_LOCATIONS[1],
    SEED_LOCATIONS[2],
  ]);
  const [travelMode, setTravelMode] = useState<"walking" | "transit" | "driving">("walking");
  const [showRouteOnMap, setShowRouteOnMap] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
  const [itinerarySavedNotice, setItinerarySavedNotice] = useState("");
  const [routeToast, setRouteToast] = useState<{ placeName: string; message: string } | null>(null);

  // Weather
  const [weather, setWeather] = useState<WeatherForecast | null>(null);

  // Live Location Sharing
  const [sharingLive, setSharingLive] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<number | null>(null);
  const [groupLiveLocations, setGroupLiveLocations] = useState<LiveLocation[]>([]);

  // Groups
  const [userGroups, setUserGroups] = useState<Group[]>([
    {
      id: "sample-group",
      name: "North & South Pujo 2026",
      description: "Family & friends puja hopping expedition",
      ownerId: "sample-owner",
      ownerName: "Anindya",
      inviteCode: "PUJA26",
      createdAt: Date.now() - 3600000,
      memberCount: 3,
    },
  ]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("sample-group");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { uid: "sample-1", displayName: "Riya Sen", role: "member", joinedAt: Date.now() - 300000 },
    { uid: "sample-2", displayName: "Subhashis Roy", role: "member", joinedAt: Date.now() - 600000 },
  ]);
  const [groupStops, setGroupStops] = useState<GroupStop[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [groupNotice, setGroupNotice] = useState("");

  // Modals & Drawers
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [reviewsDrawerOpen, setReviewsDrawerOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [inviteModalGroup, setInviteModalGroup] = useState<Group | null>(null);

  // Subscribe to published locations
  useEffect(() => {
    return subscribeToPublishedLocations(
      categoryFilter,
      (items) => {
        setLocations(items);
        if (items.length > 0 && !items.some((i) => i.id === selectedPlace.id)) {
          setSelectedPlace(items[0]);
        }
      },
      () => setMapError("Pandal updates temporarily offline; showing verified curated locations.")
    );
  }, [categoryFilter]);

  // Fetch real Google Maps info when selected place changes
  useEffect(() => {
    if (!selectedPlace) return;
    setLoadingGoogleDetails(true);
    fetchGooglePlaceInfo(selectedPlace.name, selectedPlace.latitude, selectedPlace.longitude)
      .then((details) => {
        setGooglePlaceDetails(details);
      })
      .catch(() => setGooglePlaceDetails(null))
      .finally(() => setLoadingGoogleDetails(false));
  }, [selectedPlace]);

  // Initialize visited pandals from local storage
  useEffect(() => {
    setVisitedIds(getStoredVisited());
  }, []);

  // Auto-dismiss route toast
  useEffect(() => {
    if (!routeToast) return;
    const timer = setTimeout(() => setRouteToast(null), 4000);
    return () => clearTimeout(timer);
  }, [routeToast]);

  // Subscribe to user favourites and visits
  useEffect(() => {
    if (!user) {
      setFavourites([]);
      setVisits([]);
      setSavedItineraries([]);
      return;
    }
    const unsubFavs = subscribeToUserFavourites(user.uid, setFavourites);
    const unsubVisits = subscribeToUserVisits(user.uid, (items) => {
      setVisits(items);
      const visitIds = items.map((v) => v.locationId);
      if (visitIds.length > 0) {
        setVisitedIds((prev) => Array.from(new Set([...prev, ...visitIds])));
      }
    });
    const unsubItin = subscribeToUserItineraries(user.uid, setSavedItineraries);
    return () => {
      unsubFavs();
      unsubVisits();
      unsubItin();
    };
  }, [user]);

  // Fetch Weather on Mount
  useEffect(() => {
    fetchKolkataWeather().then(setWeather).catch(console.error);
  }, []);

  // Listen to Group Stops & Members
  useEffect(() => {
    if (!selectedGroupId || selectedGroupId === "sample-group") return;
    const unsubStops = subscribeToGroupStops(selectedGroupId, setGroupStops);
    const unsubMembers = subscribeToGroupMembers(selectedGroupId, setGroupMembers);
    const unsubLive = subscribeToGroupLiveLocations(selectedGroupId, setGroupLiveLocations);
    return () => {
      unsubStops();
      unsubMembers();
      unsubLive();
    };
  }, [selectedGroupId]);

  // Handle URL Join Query Parameter
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) {
      setJoinCodeInput(joinCode.toUpperCase());
      setActiveTab("groups");
    }
  }, []);

  // Filter visible locations based on search and category
  const visibleLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchCat = categoryFilter === "All" || loc.category === categoryFilter;
      const matchSearch =
        searchQuery.trim() === "" ||
        `${loc.name} ${loc.locality} ${loc.category} ${loc.facilities.join(" ")}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [locations, categoryFilter, searchQuery]);

  // Pandals sorted by proximity when GPS is enabled
  const sortedNearbyPandals = useMemo(() => {
    const list = locations.filter((p) => p.category === "Pandal");
    if (!sortByNearest || !userCoords) return list;
    return [...list].sort((a, b) => {
      const distA = calculateDistanceKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
      const distB = calculateDistanceKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }, [locations, sortByNearest, userCoords]);

  const isSelectedFav = favourites.some((f) => f.locationId === selectedPlace.id);
  const isSelectedVisited = visits.some((v) => v.locationId === selectedPlace.id);

  // Find Nearest Pandal handler
  const handleFindNearestPandal = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingNearest(true);
    setNearestNotice("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingNearest(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);

        const result = findNearestPandal(coords.lat, coords.lng, locations);
        if (result) {
          setSelectedPlace(result.pandal);
          setSortByNearest(true);
          setNearestNotice(
            `📍 Nearest Pandal: ${result.pandal.name} is ${result.distanceKm} km away from your location!`
          );
          setActiveTab("map");
          setTimeout(() => setNearestNotice(""), 7000);
        }
      },
      (err) => {
        setLocatingNearest(false);
        alert(
          err.code === 1
            ? "Location permission was denied. Please allow location in your browser."
            : "Could not retrieve your GPS location. Please check your signal."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Actions
  const handleToggleFavourite = async (place: LocationItem) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await toggleFavourite(user.uid, place);
    } catch (e) {
      console.error("Could not toggle favourite:", e);
    }
  };

  const toggleVisited = async (id: string) => {
    const isAlreadyVisited = visitedIds.includes(id);
    const next = isAlreadyVisited ? visitedIds.filter((x) => x !== id) : [...visitedIds, id];
    setVisitedIds(next);
    saveStoredVisited(next);
    if (user) {
      await syncVisitToFirestore(id, !isAlreadyVisited, user.uid);
    }
  };

  const toggleRoute = (place: LocationItem) => {
    setRouteStops((prev) => {
      const exists = prev.some((p) => p.id === place.id);
      let updated: LocationItem[];
      if (exists) {
        updated = prev.filter((p) => p.id !== place.id);
        setRouteToast({
          placeName: place.name,
          message: "Removed from route",
        });
      } else {
        updated = [...prev, place];
        setRouteToast({
          placeName: place.name,
          message: `Added as Stop #${updated.length} in your route!`,
        });
      }
      return updated;
    });
  };

  const openPandalDirections = (place: LocationItem) => {
    const dest =
      Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
        ? `${place.latitude},${place.longitude}`
        : encodeURIComponent(`${place.name}, ${place.locality || "Kolkata"}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
  };

  const handleAddToRoute = (place: LocationItem) => {
    if (!routeStops.some((s) => s.id === place.id)) {
      setRouteStops((prev) => [...prev, place]);
      setRouteToast({
        placeName: place.name,
        message: `Added as Stop #${routeStops.length + 1} in your route!`,
      });
    }
  };

  const handleRemoveRouteStop = (id: string) => {
    const found = routeStops.find((s) => s.id === id);
    setRouteStops((prev) => prev.filter((s) => s.id !== id));
    if (found) {
      setRouteToast({
        placeName: found.name,
        message: "Removed from route",
      });
    }
  };

  const handleMoveStop = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= routeStops.length) return;
    const copy = [...routeStops];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setRouteStops(copy);
  };

  const handleSaveRoute = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await saveItinerary(
        user.uid,
        `Puja26 Route: ${activeDay}`,
        activeDay,
        routeStops,
        travelMode
      );
      setItinerarySavedNotice("Route saved to your profile!");
      setTimeout(() => setItinerarySavedNotice(""), 3000);
    } catch {
      setItinerarySavedNotice("Failed to save route. Please try again.");
    }
  };

  // Live Location Toggle
  const handleToggleSharing = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (sharingLive) {
      await stopSharingLocation();
      setSharingLive(false);
      setGpsAccuracy(null);
    } else {
      try {
        await startSharingLocation(
          selectedGroupId,
          { uid: user.uid, displayName: profile?.displayName || user.displayName || "Devotee" },
          (pos) => {
            setGpsAccuracy(pos.accuracy);
            setLastGpsUpdate(Date.now());
            setUserCoords({ lat: pos.lat, lng: pos.lng });
          },
          (err) => {
            alert(err.message);
            setSharingLive(false);
          }
        );
        setSharingLive(true);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to start GPS sharing");
      }
    }
  };

  // Group Handlers
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!newGroupName.trim()) return;
    try {
      const g = await createGroup(newGroupName, "", {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || "Member",
      });
      setUserGroups((prev) => [g, ...prev]);
      setSelectedGroupId(g.id);
      setNewGroupName("");
      setGroupNotice(`Group "${g.name}" created! Invite friends with code ${g.inviteCode}`);
      setTimeout(() => setGroupNotice(""), 5000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to create group");
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!joinCodeInput.trim()) return;
    try {
      const groupId = await joinGroupByCode(joinCodeInput, {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || "Member",
      });
      setSelectedGroupId(groupId);
      setJoinCodeInput("");
      setGroupNotice("Successfully joined the group!");
      setTimeout(() => setGroupNotice(""), 4000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Invalid invite code");
    }
  };

  const routeMetrics = estimateRouteMetrics(routeStops, travelMode);
  const activeGroup = userGroups.find((g) => g.id === selectedGroupId) || userGroups[0];

  return (
    <main className={styles.app}>
      <section className={styles.shell}>
        {/* Top bar with branding and Auth status */}
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles.motif}>✦</span>
            <span>
              puja<span>26</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleFindNearestPandal}
              disabled={locatingNearest}
              title="Find nearest Durga Puja pandal to my location"
              style={{
                background: "#FFF",
                border: "1px solid #C62828",
                color: "#C62828",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                padding: "6px 11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              🧭 {locatingNearest ? "Locating…" : "Nearest Pandal"}
            </button>

            {user ? (
              <button
                className={styles.avatar}
                onClick={() => setActiveTab("profile")}
                aria-label="Open profile"
                title={profile?.displayName || user.displayName || "Profile"}
              >
                {(profile?.displayName || user.displayName || "AM")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <Link
                  href="/login"
                  style={{
                    background: "#FFF",
                    color: "#780D19",
                    border: "1px solid #780D19",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "6px 12px",
                    textDecoration: "none",
                  }}
                >
                  Log In
                </Link>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  style={{
                    background: "#780D19",
                    color: "#FFF",
                    border: "none",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Nearest Pandal Toast Banner */}
        {nearestNotice && (
          <div
            style={{
              background: "#780D19",
              color: "#FFF",
              padding: "10px 14px",
              borderRadius: 12,
              marginBottom: 12,
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 14px rgba(120, 13, 25, 0.25)",
            }}
          >
            <span>{nearestNotice}</span>
            <button
              onClick={() => setNearestNotice("")}
              style={{ background: "none", border: "none", color: "#FFF", fontSize: 16, cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        )}

        {/* ===================== TAB 1: MAP ===================== */}
        {activeTab === "map" && (
          <>
            <div className={styles.hero}>
              <div>
                <p className={styles.kicker}>SHUBHO MAHALAYA 2026</p>
                <h1>
                  Find your <em>pujo.</em>
                </h1>
                <p>Discover pandals, plan routes, and explore safely together.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, zIndex: 1 }}>
                <div className={styles.diya}>🪔</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setAreaModalOpen(true)}
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      color: "#780D19",
                      border: "none",
                      borderRadius: 99,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "5px 10px",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    🗺️ Select Areas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(true)}
                    style={{
                      background: "#F5BD32",
                      color: "#191516",
                      border: "none",
                      borderRadius: 99,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "5px 10px",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    ✨ AI Curator
                  </button>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className={styles.searchWrap}>
              <Icon>⌕</Icon>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pandals, metro, toilets, food..."
                aria-label="Search places"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} aria-label="Clear search">
                  ×
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className={styles.chips} role="tablist" aria-label="Place categories">
              {(
                [
                  "All",
                  "Pandal",
                  "Metro",
                  "Food",
                  "Toilet",
                  "Medical",
                  "Parking",
                ] as const
              ).map((item) => (
                <button
                  key={item}
                  onClick={() => setCategoryFilter(item)}
                  className={categoryFilter === item ? styles.chipActive : ""}
                >
                  {item === "All"
                    ? "All places"
                    : item === "Pandal"
                    ? "Puja pandals"
                    : item === "Metro"
                    ? "Metro stations"
                    : item === "Food"
                    ? "Food & Water"
                    : item === "Toilet"
                    ? "Public Toilets"
                    : item === "Medical"
                    ? "Medical / First Aid"
                    : item}
                </button>
              ))}
            </div>

            {/* Route Status Banner if stops exist */}
            {routeStops.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                  padding: "8px 12px",
                  background: "#FFF",
                  borderRadius: 10,
                  border: "1px solid #E8DCCB",
                  fontSize: 11,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>🗺️</span>
                  <div>
                    <strong style={{ color: "#780D19" }}>{routeStops.length} Stops in Route</strong>
                    <span style={{ color: "#70676A", marginLeft: 4 }}>({activeDay.split(" ")[0]})</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setShowRouteOnMap(!showRouteOnMap)}
                    style={{
                      background: showRouteOnMap ? "#780D19" : "#FFF9F0",
                      color: showRouteOnMap ? "#FFF" : "#780D19",
                      border: "1px solid #780D19",
                      borderRadius: 6,
                      padding: "4px 9px",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {showRouteOnMap ? "✓ Path On" : "Show Path"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("routes")}
                    style={{
                      background: "#FFF",
                      color: "#70676A",
                      border: "1px solid #E8DCCB",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Route details ›
                  </button>
                </div>
              </div>
            )}

            {/* Google Map */}
            <div className={styles.mapCard}>
              <PujaMap
                pandals={visibleLocations}
                selectedId={selectedPlace.id}
                onSelect={(loc) => setSelectedPlace(loc)}
                liveMembers={groupLiveLocations}
                routeStops={routeStops}
                showRoutePath={showRouteOnMap}
                visitedIds={visitedIds}
                userLocation={userCoords}
              />
              <div className={styles.mapLegend}>
                <span>
                  <i style={{ background: "#C62828" }}></i> Pandal
                </span>
                <span>
                  <i style={{ background: "#2E7D32" }}></i> Visited ({visitedIds.length})
                </span>
                {userCoords && (
                  <span>
                    <i style={{ background: "#1A73E8" }}></i> You
                  </span>
                )}
                <span>
                  <i style={{ background: "#26734D" }}></i> Metro
                </span>
                <span>
                  <i style={{ background: "#5D75A6" }}></i> Toilet
                </span>
                <span>
                  <i style={{ background: "#F5BD32" }}></i> Food
                </span>
              </div>
              {mapError && (
                <div className={styles.toast}>
                  {mapError}
                  <button onClick={() => setMapError("")}>Dismiss</button>
                </div>
              )}
            </div>

            {/* Selected Location Preview Card with Live Google Maps Details */}
            <article className={`${styles.placeCard} ${visitedIds.includes(selectedPlace.id) ? styles.placeCardVisited : ""}`}>
              <div className={styles.placePhoto}>
                {visitedIds.includes(selectedPlace.id) ? (
                  <span style={{ fontSize: 24, color: "#2E7D32", fontWeight: "bold" }}>✓</span>
                ) : googlePlaceDetails?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={googlePlaceDetails.photoUrl}
                    alt={selectedPlace.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }}
                  />
                ) : (
                  <span>{selectedPlace.category === "Pandal" ? "দুর্গা" : "✦"}</span>
                )}
              </div>
              <div className={styles.placeInfo}>
                <div className={styles.placeTop}>
                  <div>
                    <div className={styles.typeBadgeRow}>
                      <p className={styles.type}>{selectedPlace.category}</p>
                      {visitedIds.includes(selectedPlace.id) && (
                        <span className={styles.visitedBadge}>✓ Visited</span>
                      )}
                      {routeStops.some((p) => p.id === selectedPlace.id) && (
                        <span
                          className={styles.visitedBadge}
                          style={{ background: "#FFF3E0", color: "#E65100", borderColor: "#FFE0B2" }}
                        >
                          Stop #{routeStops.findIndex((p) => p.id === selectedPlace.id) + 1}
                        </span>
                      )}
                    </div>
                    <h2>{selectedPlace.name}</h2>
                  </div>
                  <button
                    className={isSelectedFav ? styles.saved : ""}
                    onClick={() => handleToggleFavourite(selectedPlace)}
                    aria-label="Save favourite"
                  >
                    {isSelectedFav ? "★" : "☆"}
                  </button>
                </div>

                <p className={styles.muted}>
                  {googlePlaceDetails?.formattedAddress || selectedPlace.locality || selectedPlace.address}
                  {userCoords && Number.isFinite(selectedPlace.latitude) && Number.isFinite(selectedPlace.longitude) && (
                    <> · <span className={styles.distanceHighlight}>{formatDistance(calculateDistanceKm(userCoords.lat, userCoords.lng, selectedPlace.latitude, selectedPlace.longitude))}</span></>
                  )}
                </p>

                {/* Rating & Google Maps Details */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
                  <p className={styles.rating} style={{ margin: 0 }}>
                    ★ {googlePlaceDetails?.rating || selectedPlace.rating || "4.8"}{" "}
                    <span>
                      ({googlePlaceDetails?.userRatingsTotal || selectedPlace.reviewCount || 100}+ reviews)
                    </span>
                  </p>
                  {loadingGoogleDetails && (
                    <small style={{ fontSize: 9, color: "#70676A" }}>Updating via Google Maps…</small>
                  )}
                  {googlePlaceDetails?.openNow !== undefined && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: googlePlaceDetails.openNow ? "#26734D" : "#C62828",
                      }}
                    >
                      {googlePlaceDetails.openNow ? "● Open now" : "● Closed"}
                    </span>
                  )}
                </div>

                {/* Facilities Tags */}
                {selectedPlace.facilities && selectedPlace.facilities.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "6px 0" }}>
                    {selectedPlace.facilities.map((f, i) => (
                      <span
                        key={i}
                        style={{
                          background: "#FFF9F0",
                          border: "1px solid #E8DCCB",
                          borderRadius: 4,
                          fontSize: 9,
                          color: "#70676A",
                          padding: "2px 5px",
                        }}
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                )}

                {selectedPlace.operatingHours && (
                  <p style={{ margin: "2px 0 6px", fontSize: 9, color: "#26734D", fontWeight: 600 }}>
                    🕒 {selectedPlace.operatingHours}
                  </p>
                )}

                <div className={styles.actions}>
                  <button
                    className={visitedIds.includes(selectedPlace.id) ? styles.visitedBtnActive : styles.visitedBtn}
                    onClick={() => toggleVisited(selectedPlace.id)}
                    title={visitedIds.includes(selectedPlace.id) ? "Marked as visited (click to toggle)" : "Mark pandal as visited"}
                  >
                    {visitedIds.includes(selectedPlace.id) ? "✓ Visited" : "✓ Mark as Visited"}
                  </button>
                  <button
                    className={routeStops.some((p) => p.id === selectedPlace.id) ? styles.routeInBtn : styles.routeAddBtn}
                    onClick={() => toggleRoute(selectedPlace)}
                    title={routeStops.some((p) => p.id === selectedPlace.id) ? "Currently in route itinerary. Click to remove" : "Add pandal to your route itinerary"}
                  >
                    {routeStops.some((p) => p.id === selectedPlace.id)
                      ? `✓ In Route (#${routeStops.findIndex((p) => p.id === selectedPlace.id) + 1})`
                      : "＋ Add to Route"}
                  </button>
                  <button
                    className={styles.secondary}
                    onClick={() => setReviewsDrawerOpen(true)}
                  >
                    💬 Reviews
                  </button>
                  <button
                    className={styles.primary}
                    onClick={() => openPandalDirections(selectedPlace)}
                    title="Open direct turn-by-turn navigation in Google Maps"
                  >
                    Directions ↗
                  </button>
                </div>

                {routeStops.length > 0 && (
                  <div className={styles.routeCardHint}>
                    <span>🚶 <strong>{routeStops.length} pandal{routeStops.length === 1 ? "" : "s"}</strong> planned in your itinerary</span>
                    <button onClick={() => setActiveTab("routes")}>View Itinerary →</button>
                  </div>
                )}
              </div>
            </article>

            {/* Quick Actions Bar */}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setAreaModalOpen(true)}
                style={{
                  flex: 1,
                  background: "#FFF",
                  border: "1px solid #780D19",
                  color: "#780D19",
                  borderRadius: 10,
                  padding: "10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🗺️ Select Areas &amp; Best Pandals
              </button>
              <button
                type="button"
                onClick={handleFindNearestPandal}
                style={{
                  flex: 1,
                  background: "#FFF9F0",
                  border: "1px solid #C62828",
                  color: "#C62828",
                  borderRadius: 10,
                  padding: "10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🧭 Locate Nearest Pandal
              </button>
            </div>

            {/* Route Progress Float Bar */}
            {routeStops.length > 0 && (
              <div className={styles.routeFloatBar}>
                <div className={styles.routeFloatInfo}>
                  <span className={styles.routeFloatIcon}>🚶</span>
                  <div>
                    <strong>Your Route: {routeStops.length} Pandal{routeStops.length === 1 ? "" : "s"} Planned</strong>
                    <small>~{routeStops.length * 30} mins estimated visit time · Tap to view full itinerary</small>
                  </div>
                </div>
                <button className={styles.routeFloatBtn} onClick={() => setActiveTab("routes")}>
                  View Route ({routeStops.length}) →
                </button>
              </div>
            )}

            {/* Nearby Worth a Visit */}
            <div className={styles.nearbyHeading}>
              <div>
                <p className={styles.kicker}>
                  {sortByNearest ? "SORTED BY PROXIMITY" : "EXPLORE NEARBY"}
                </p>
                <h2>{sortByNearest ? "Nearest Pandals" : "Worth a visit"}</h2>
              </div>
              <div className={styles.nearbyActions}>
                {sortByNearest && (
                  <button className={styles.resetSortBtn} onClick={() => setSortByNearest(false)}>
                    Reset
                  </button>
                )}
                <button
                  className={styles.seeAllBtn}
                  onClick={() => setAreaModalOpen(true)}
                >
                  Explore Areas ›
                </button>
              </div>
            </div>
            <div className={styles.nearby}>
              {sortedNearbyPandals.map((p) => {
                const isVisited = visitedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    className={`${styles.nearbyCard} ${isVisited ? styles.nearbyCardVisited : ""}`}
                    onClick={() => setSelectedPlace(p)}
                  >
                    <div className={`${styles.tinyPhoto} ${isVisited ? styles.tinyPhotoVisited : ""}`}>
                      {isVisited ? "✓" : "✦"}
                    </div>
                    {isVisited && <span className={styles.tinyVisitedTag}>✓ Visited</span>}
                    <strong>{p.name}</strong>
                    <span>
                      ★ {p.rating || "4.8"} · {p.locality.split(",")[0]}
                    </span>
                    {userCoords && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && (
                      <small className={styles.nearbyDistance}>
                        📍 {formatDistance(calculateDistanceKm(userCoords.lat, userCoords.lng, p.latitude, p.longitude))}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ===================== TAB 2: ROUTES ===================== */}
        {activeTab === "routes" && (
          <section className={styles.screen}>
            <p className={styles.kicker}>YOUR DAY, BEAUTIFULLY PACED</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h1>
                Your pujo <em>route</em>
              </h1>
              <button
                type="button"
                onClick={() => setAreaModalOpen(true)}
                style={{
                  background: "#780D19",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                🗺️ Select Areas
              </button>
            </div>

            {/* Day Selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
              {(["Day 1 (Saptami)", "Day 2 (Ashtami)", "Day 3 (Navami)", "Custom"] as const).map(
                (day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 99,
                      border: "1px solid #E8DCCB",
                      fontSize: 11,
                      fontWeight: 700,
                      background: activeDay === day ? "#780D19" : "#FFF",
                      color: activeDay === day ? "#FFF" : "#70676A",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {day}
                  </button>
                )
              )}
            </div>

            {/* Travel Mode Toggle */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {(
                [
                  ["walking", "🚶 Walking"],
                  ["transit", "🚇 Metro/Transit"],
                  ["driving", "🚗 Driving"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setTravelMode(mode)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: 8,
                    border: "1px solid #E8DCCB",
                    fontSize: 10,
                    fontWeight: 700,
                    background: travelMode === mode ? "#FFF9F0" : "#FFF",
                    color: travelMode === mode ? "#780D19" : "#70676A",
                    borderColor: travelMode === mode ? "#780D19" : "#E8DCCB",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Route Summary */}
            <div className={styles.routeSummary}>
              <span>{travelMode === "walking" ? "🚶" : travelMode === "transit" ? "🚇" : "🚗"}</span>
              <div>
                <strong>{routeMetrics.summaryText}</strong>
                <small>Estimates tailored for Kolkata festival congestion.</small>
              </div>
              <button onClick={() => setAiModalOpen(true)} title="Curate with AI">
                ✨
              </button>
            </div>

            {/* Timeline Stops */}
            <div className={styles.timeline}>
              {routeStops.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#70676A", fontSize: 12 }}>
                  No stops added to this route yet. Tap &quot;Select Areas&quot; or add from map!
                </div>
              ) : (
                routeStops.map((p, index) => (
                  <div className={styles.stop} key={p.id}>
                    <i className={visitedIds.includes(p.id) ? styles.visitedStopIndex : ""}>
                      {visitedIds.includes(p.id) ? "✓" : index + 1}
                    </i>
                    <div>
                      <strong>
                        {p.name} {visitedIds.includes(p.id) ? <span style={{ color: "#2E7D32", fontSize: "11px" }}>✓</span> : null}
                      </strong>
                      <span>{p.locality}</span>
                      <small>
                        {index === 0
                          ? "Starting Stop · Suggested 5:00 PM"
                          : `Stop #${index + 1} · ~${25 * index} mins later`}
                      </small>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                      <button
                        onClick={() => handleMoveStop(index, "up")}
                        disabled={index === 0}
                        style={{ border: "none", background: "none", fontSize: 13, cursor: "pointer", color: "#70676A" }}
                        title="Move stop up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveStop(index, "down")}
                        disabled={index === routeStops.length - 1}
                        style={{ border: "none", background: "none", fontSize: 13, cursor: "pointer", color: "#70676A" }}
                        title="Move stop down"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => handleRemoveRouteStop(p.id)}
                        aria-label={`Remove ${p.name}`}
                        style={{ border: "none", background: "none", fontSize: 18, color: "#C62828", cursor: "pointer" }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button
                className={styles.addStop}
                style={{ flex: 1, margin: 0 }}
                onClick={() => setAreaModalOpen(true)}
              >
                🗺️ Select Areas &amp; Optimize
              </button>
              <button
                className={styles.addStop}
                style={{ flex: 1, margin: 0 }}
                onClick={() => setActiveTab("map")}
              >
                ＋ Add single stop from map
              </button>
            </div>

            {/* Weather Alert */}
            {weather && (
              <div className={styles.weather}>
                <span>{weather.rainWarning ? "☂" : "🌤"}</span>
                <div>
                  <strong>
                    {weather.condition} · {weather.tempC}°C ({weather.time})
                  </strong>
                  <p>{weather.advice}</p>
                  <small style={{ fontSize: 9, color: "#92888A", display: "block", marginTop: 4 }}>
                    Observed for {weather.locality} · Rain probability: {weather.rainProbability}%
                  </small>
                </div>
              </div>
            )}

            {itinerarySavedNotice && (
              <div style={{ background: "#E8F5E9", color: "#26734D", padding: 10, borderRadius: 8, fontSize: 11, marginBottom: 10, textAlign: "center", fontWeight: 700 }}>
                {itinerarySavedNotice}
              </div>
            )}

            {/* View Route Path on Interactive Map Button */}
            {routeStops.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowRouteOnMap(true);
                  setActiveTab("map");
                }}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#F5BD32",
                  color: "#191516",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 10,
                  boxShadow: "0 2px 8px rgba(245, 189, 50, 0.25)",
                }}
              >
                🗺️ View Route Path on Interactive Map ({routeStops.length} stops)
              </button>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button
                type="button"
                className={styles.secondary}
                onClick={handleSaveRoute}
                style={{ flex: 1, padding: 12, fontSize: 11 }}
              >
                💾 Save Itinerary
              </button>
              <a
                href={generateGoogleMapsDirectionsUrl(routeStops, travelMode)}
                target="_blank"
                rel="noreferrer"
                className={styles.primary}
                style={{ flex: 2, padding: 12, fontSize: 11, textAlign: "center", textDecoration: "none" }}
              >
                Open in Google Maps ↗
              </a>
            </div>
          </section>
        )}

        {/* ===================== TAB 3: CONNECT ===================== */}
        {activeTab === "connect" && (
          <section className={styles.screen}>
            <p className={styles.kicker}>EXPLORE TOGETHER, ON YOUR TERMS</p>
            <h1>
              Stay in <em>sync.</em>
            </h1>

            <div className={styles.connectCard}>
              <span className={styles.bigIcon}>⌖</span>
              <h2>Share live location</h2>
              <p>
                Only people in your selected group ({activeGroup.name}) can see your live GPS, and only while you explicitly keep sharing active.
              </p>

              <button
                className={sharingLive ? styles.stopShare : styles.primaryWide}
                onClick={handleToggleSharing}
              >
                {sharingLive ? "Stop sharing live location" : "Start sharing live location"}
              </button>

              {sharingLive && (
                <div style={{ marginTop: 12 }}>
                  <small className={styles.live}>
                    ● Live Sharing is Active (Updating continuously)
                  </small>
                  {gpsAccuracy !== null && (
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: "#70676A" }}>
                      GPS Accuracy: ±{gpsAccuracy}m · Last updated: {lastGpsUpdate ? formatTimeAgo(lastGpsUpdate) : "Just now"}
                    </p>
                  )}
                </div>
              )}
            </div>

            <h2 className={styles.sectionTitle}>
              Group Members ({groupMembers.length})
            </h2>

            {groupMembers.map((m) => {
              const liveData = groupLiveLocations.find((l) => l.uid === m.uid);
              const isStale = liveData ? isLocationStale(liveData.updatedAt) : true;
              return (
                <div className={styles.member} key={m.uid}>
                  <span>{m.displayName.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{m.displayName}</strong>
                    <small>
                      {liveData && !isStale
                        ? "● Live now · Sharing GPS"
                        : liveData && isStale
                        ? `Stale GPS (${formatTimeAgo(liveData.updatedAt)})`
                        : "Location sharing inactive"}
                    </small>
                  </div>
                  {liveData && (
                    <button
                      onClick={() => {
                        setActiveTab("map");
                      }}
                    >
                      View on Map
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ===================== TAB 4: GROUPS ===================== */}
        {activeTab === "groups" && (
          <section className={styles.screen}>
            <p className={styles.kicker}>MAKE A PLAN TOGETHER</p>
            <h1>
              Your <em>groups</em>
            </h1>

            {groupNotice && (
              <div style={{ background: "#E8F5E9", color: "#26734D", padding: 10, borderRadius: 8, fontSize: 11, marginBottom: 14, fontWeight: 700 }}>
                {groupNotice}
              </div>
            )}

            {/* Active Group Card */}
            <div className={styles.groupCard}>
              <div className={styles.groupArt}>✦</div>
              <div>
                <span>{groupMembers.length} MEMBERS</span>
                <h2>{activeGroup.name}</h2>
                <p>Invite code: <strong>{activeGroup.inviteCode}</strong></p>
              </div>
              <button onClick={() => setInviteModalGroup(activeGroup)} title="Share group invite">
                QR
              </button>
            </div>

            {/* Shared Stops */}
            <div style={{ background: "#FFF", border: "1px solid #E8DCCB", borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", margin: 0, fontSize: 16, color: "#780D19" }}>
                  Shared Group Stops ({groupStops.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) setAuthModalOpen(true);
                    else addGroupStop(activeGroup.id, selectedPlace, user.uid, groupStops.length);
                  }}
                  style={{ background: "#FFF9F0", border: "1px solid #780D19", color: "#780D19", borderRadius: 6, fontSize: 10, fontWeight: 700, padding: "4px 8px", cursor: "pointer" }}
                >
                  ＋ Add &quot;{selectedPlace.name.slice(0, 15)}…&quot;
                </button>
              </div>

              {groupStops.length === 0 ? (
                <p style={{ margin: 0, fontSize: 11, color: "#70676A" }}>
                  No shared stops added yet. Tap above to add your current selected pandal!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {groupStops.map((stop) => (
                    <div
                      key={stop.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        background: stop.completed ? "#F1F8F4" : "#FFF9F0",
                        borderRadius: 8,
                        border: "1px solid #E8DCCB",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={stop.completed}
                        onChange={(e) => toggleGroupStopCompleted(activeGroup.id, stop.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 12, textDecoration: stop.completed ? "line-through" : "none", color: stop.completed ? "#70676A" : "#191516" }}>
                          {stop.name}
                        </strong>
                        <span style={{ fontSize: 10, color: "#70676A", display: "block" }}>
                          {stop.locality}
                        </span>
                      </div>
                      {stop.completed && (
                        <span style={{ fontSize: 9, color: "#26734D", fontWeight: 700 }}>
                          ✓ Done
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Group Form */}
            <form onSubmit={handleCreateGroup} style={{ background: "#FFF", border: "1px solid #E8DCCB", borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <strong style={{ display: "block", fontSize: 12, marginBottom: 8, color: "#191516" }}>
                Create a new group
              </strong>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Saptami Night Explorers"
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #E8DCCB", fontSize: 11 }}
                />
                <button
                  type="submit"
                  style={{ background: "#780D19", color: "#FFF", border: "none", borderRadius: 8, padding: "0 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Create
                </button>
              </div>
            </form>

            {/* Join Group with Code */}
            <form onSubmit={handleJoinGroup} style={{ background: "#FFF", border: "1px solid #E8DCCB", borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <strong style={{ display: "block", fontSize: 12, marginBottom: 8, color: "#191516" }}>
                Join existing group with invite code
              </strong>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. PUJA26"
                  maxLength={8}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #E8DCCB", fontSize: 11, letterSpacing: 2, fontFamily: "monospace" }}
                />
                <button
                  type="submit"
                  style={{ background: "#26734D", color: "#FFF", border: "none", borderRadius: 8, padding: "0 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Join Group
                </button>
              </div>
            </form>

            {/* Invite Banner */}
            <div className={styles.invite}>
              <strong>Invite friends with link or QR code</strong>
              <p>Invitation links can be revoked at any time. Member live locations are only visible to authorized group members.</p>
              <button className={styles.secondary} onClick={() => setInviteModalGroup(activeGroup)}>
                Show Invite QR &amp; Link
              </button>
            </div>
          </section>
        )}

        {/* ===================== TAB 5: PROFILE ===================== */}
        {activeTab === "profile" && (
          <section className={styles.screen}>
            <div className={styles.profileHead}>
              <div className={styles.profileAvatar}>
                {(profile?.displayName || user?.displayName || "AM")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <p className={styles.kicker}>
                  {user ? "AUTHENTICATED DEVOTEE" : "GUEST EXPLORER"}
                </p>
                <h1>{profile?.displayName || user?.displayName || "Guest Explorer"}</h1>
                <span>
                  {user ? user.email : "Sign in to sync your pujo favourites across devices"}
                </span>
              </div>
            </div>

            {/* Stats Bar */}
            <div className={styles.stats}>
              <div>
                <strong>{favourites.length}</strong>
                <span>Saved</span>
              </div>
              <div>
                <strong>{visitedIds.length}</strong>
                <span>Visited</span>
              </div>
              <div>
                <strong>{routeStops.length}</strong>
                <span>Route Stops</span>
              </div>
              <div>
                <strong>{userGroups.length}</strong>
                <span>Groups</span>
              </div>
            </div>

            {/* Saved Pandals List */}
            {favourites.length > 0 && (
              <div style={{ background: "#FFF", border: "1px solid #E8DCCB", borderRadius: 14, padding: 14, marginBottom: 14 }}>
                <strong style={{ display: "block", fontSize: 13, marginBottom: 10, color: "#780D19", fontFamily: "'Playfair Display', serif" }}>
                  ⭐ Saved Favourite Pandals
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {favourites.map((fav) => (
                    <div key={fav.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F0EAE1" }}>
                      <div>
                        <strong style={{ fontSize: 12, color: "#191516" }}>{fav.locationName}</strong>
                        <span style={{ fontSize: 10, color: "#70676A", display: "block" }}>{fav.locality}</span>
                      </div>
                      <button
                        onClick={() => {
                          const found = locations.find((l) => l.id === fav.locationId);
                          if (found) {
                            handleAddToRoute(found);
                            setActiveTab("routes");
                          }
                        }}
                        style={{ background: "#FFF9F0", border: "1px solid #780D19", color: "#780D19", borderRadius: 6, fontSize: 10, fontWeight: 700, padding: "4px 8px", cursor: "pointer" }}
                      >
                        Add to route
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visit History */}
            {visits.length > 0 && (
              <div style={{ background: "#FFF", border: "1px solid #E8DCCB", borderRadius: 14, padding: 14, marginBottom: 14 }}>
                <strong style={{ display: "block", fontSize: 13, marginBottom: 10, color: "#26734D", fontFamily: "'Playfair Display', serif" }}>
                  ✓ Completed Visits
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {visits.map((v) => (
                    <div key={v.id} style={{ padding: "6px 0", borderBottom: "1px solid #F0EAE1" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ fontSize: 12, color: "#191516" }}>{v.locationName}</strong>
                        <span style={{ fontSize: 10, color: "#26734D", fontWeight: 700 }}>{v.visitedAt}</span>
                      </div>
                      {v.notes && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#70676A" }}>{v.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings & Auth Buttons */}
            <div className={styles.settings}>
              {user ? (
                <>
                  <button onClick={() => setActiveTab("map")}>
                    ♡ Browse and save more pandals <span>›</span>
                  </button>
                  <button onClick={() => setAreaModalOpen(true)}>
                    🗺️ Multi-Area trip planner <span>›</span>
                  </button>
                  <button onClick={() => setAiModalOpen(true)}>
                    ✨ AI Route recommendations <span>›</span>
                  </button>
                  <Link
                    href="/admin"
                    style={{
                      padding: 15,
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#413839",
                      borderBottom: "1px solid var(--line)",
                      background: "#FFF",
                      textDecoration: "none",
                      fontSize: 12,
                    }}
                  >
                    ⚙ Admin pandal management <span>›</span>
                  </Link>
                  <button onClick={logoutUser} style={{ color: "#C62828" }}>
                    ↪ Sign out of Puja26 <span>›</span>
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Link
                    href="/login"
                    style={{
                      padding: 15,
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#780D19",
                      fontWeight: 700,
                      borderBottom: "1px solid var(--line)",
                      background: "#FFF",
                      textDecoration: "none",
                      fontSize: 12,
                    }}
                  >
                    ↪ User Login page <span>›</span>
                  </Link>
                  <button onClick={() => setAuthModalOpen(true)} style={{ color: "#780D19", fontWeight: 700 }}>
                    ↪ Quick sign in or register <span>›</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Route Toast Feedback */}
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
                  setActiveTab("routes");
                  setRouteToast(null);
                }}
              >
                View Route ({routeStops.length}) →
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

        {/* Bottom Navigation */}
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_ITEMS.map(([id, glyph, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`${activeTab === id ? styles.activeNav : ""} ${styles.navBtn}`}
            >
              <div className={styles.navIconWrap}>
                <Icon>{glyph}</Icon>
                {id === "routes" && routeStops.length > 0 && (
                  <span className={styles.navBadge}>{routeStops.length}</span>
                )}
              </div>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </section>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <VisitModal
        isOpen={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        location={selectedPlace}
        userId={user?.uid || ""}
      />

      <ReviewsDrawer
        isOpen={reviewsDrawerOpen}
        onClose={() => setReviewsDrawerOpen(false)}
        location={selectedPlace}
        user={user ? { uid: user.uid, displayName: profile?.displayName || user.displayName || "Devotee" } : null}
        onRequestLogin={() => {
          setReviewsDrawerOpen(false);
          setAuthModalOpen(true);
        }}
      />

      <AIPlannerModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        availableLocations={locations}
        onApplyRoute={(stops) => {
          setRouteStops(stops);
          setShowRouteOnMap(true);
          setActiveTab("routes");
        }}
      />

      <AreaPandalSelectorModal
        isOpen={areaModalOpen}
        onClose={() => setAreaModalOpen(false)}
        allLocations={locations}
        userCoords={userCoords || undefined}
        onApplyRoute={(stops) => {
          setRouteStops(stops);
          setShowRouteOnMap(true);
          setActiveTab("routes");
        }}
      />

      <GroupInviteModal
        isOpen={Boolean(inviteModalGroup)}
        onClose={() => setInviteModalGroup(null)}
        group={inviteModalGroup}
      />
    </main>
  );
}
