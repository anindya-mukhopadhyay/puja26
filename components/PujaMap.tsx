"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { Category, LiveLocation, LocationItem } from "@/lib/types";
import styles from "./PujaMap.module.css";

type Coordinates = { lat: number; lng: number };

type Props = {
  pandals: LocationItem[];
  selectedId?: string;
  onSelect?: (location: LocationItem) => void;
  editable?: boolean;
  pin?: Coordinates | null;
  onPinChange?: (point: Coordinates) => void;
  liveMembers?: LiveLocation[];
  routeStops?: LocationItem[];
  showRoutePath?: boolean;
  className?: string;
};

const KOLKATA = { lat: 22.5726, lng: 88.3639 };

const CATEGORY_COLORS: Record<Category, string> = {
  Pandal: "#C62828",   // Sindoor red
  Metro: "#26734D",    // Transit green
  Food: "#F5BD32",     // Festive gold
  Toilet: "#5D75A6",   // Civic blue
  Medical: "#780D19",  // Dark maroon
  Parking: "#607D8B",  // Slate
  Emergency: "#C62828",
  Other: "#70676A",
};

const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ color: "#dce5d4" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#f6f1e6" }] },
  { featureType: "water", stylers: [{ color: "#d7e6eb" }] },
];

export default function PujaMap({
  pandals,
  selectedId,
  onSelect,
  editable = false,
  pin,
  onPinChange,
  liveMembers = [],
  routeStops = [],
  showRoutePath = false,
  className,
}: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const memberMarkersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const editMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "loading" : "missing"
  );
  const [locating, setLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !elementRef.current) return;
    let cancelled = false;

    loadGoogleMaps("maps")
      .then(() => {
        if (cancelled || !elementRef.current) return;
        const map = new google.maps.Map(elementRef.current, {
          center: pin || KOLKATA,
          zoom: pin ? 15 : 12,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;

        if (editable) {
          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              onPinChange?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
            }
          });
        }
        setState("ready");
      })
      .catch((error: Error) => {
        console.error("Google Maps failed to load", error);
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      memberMarkersRef.current.forEach((marker) => marker.setMap(null));
      userMarkerRef.current?.setMap(null);
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [editable, onPinChange]);

  // Render Pandal / Facility markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    markersRef.current.forEach((marker) => marker.setMap(null));

    // Map stop IDs to their 1-indexed order if routeStops are provided
    const routeOrderMap = new Map<string, number>();
    routeStops.forEach((stop, index) => {
      routeOrderMap.set(stop.id, index + 1);
    });

    markersRef.current = pandals
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .map((p) => {
        const isSelected = p.id === selectedId;
        const routeOrder = showRoutePath ? routeOrderMap.get(p.id) : undefined;
        const color = CATEGORY_COLORS[p.category] || "#C62828";

        const markerOptions: google.maps.MarkerOptions = {
          position: { lat: p.latitude, lng: p.longitude },
          map,
          title: routeOrder ? `#${routeOrder} ${p.name}` : `${p.name} (${p.category})`,
          zIndex: isSelected ? 30 : routeOrder ? 20 : 5,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 13 : routeOrder ? 11 : p.category === "Pandal" ? 9 : 7,
            fillColor: isSelected ? "#780D19" : routeOrder ? "#C62828" : color,
            fillOpacity: 1,
            strokeColor: isSelected ? "#F5BD32" : routeOrder ? "#FFFFFF" : "#FFF9F0",
            strokeWeight: isSelected ? 4 : routeOrder ? 3 : 2,
          },
        };

        if (routeOrder) {
          markerOptions.label = {
            text: String(routeOrder),
            color: "#FFFFFF",
            fontSize: "10px",
            fontWeight: "bold",
          };
        }

        const marker = new google.maps.Marker(markerOptions);
        marker.addListener("click", () => {
          onSelect?.(p);
          map.panTo({ lat: p.latitude, lng: p.longitude });
        });

        return marker;
      });

    // Auto pan or fit bounds
    if (selectedId) {
      const active = pandals.find((p) => p.id === selectedId);
      if (active && Number.isFinite(active.latitude) && Number.isFinite(active.longitude)) {
        map.panTo({ lat: active.latitude, lng: active.longitude });
      }
    } else if (pandals.length > 0 && !pin && !showRoutePath) {
      const bounds = new google.maps.LatLngBounds();
      let hasValidCoords = false;
      pandals.forEach((p) => {
        if (Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) {
          bounds.extend({ lat: p.latitude, lng: p.longitude });
          hasValidCoords = true;
        }
      });
      if (hasValidCoords && !bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 40, right: 30, bottom: 40, left: 30 });
      }
    }
  }, [pandals, selectedId, onSelect, pin, routeStops, showRoutePath, state]);

  // Render Pathfinding Polyline or Google Maps DirectionsRenderer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    // Clean up previous directions / polyline
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!showRoutePath || routeStops.length < 2) return;

    const validStops = routeStops.filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude));
    if (validStops.length < 2) return;

    // Try Google Maps DirectionsService
    if (validStops.length <= 10 && typeof google !== "undefined" && google.maps?.DirectionsService) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true, // We already draw our styled numbered markers!
        polylineOptions: {
          strokeColor: "#780D19", // Puja26 dark maroon
          strokeOpacity: 0.85,
          strokeWeight: 5,
        },
      });
      directionsRendererRef.current = directionsRenderer;

      const origin = { lat: validStops[0].latitude, lng: validStops[0].longitude };
      const destination = { lat: validStops[validStops.length - 1].latitude, lng: validStops[validStops.length - 1].longitude };
      const waypoints = validStops.slice(1, -1).map((s) => ({
        location: new google.maps.LatLng(s.latitude, s.longitude),
        stopover: true,
      }));

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
          } else {
            // Directions quota or walk path unavailable -> draw clean geodesic polyline
            drawGeodesicPolyline(map, validStops);
          }
        }
      );
    } else {
      // More than 10 stops or DirectionsService unavailable -> draw clean geodesic polyline
      drawGeodesicPolyline(map, validStops);
    }

    // Fit map bounds around all route stops
    const bounds = new google.maps.LatLngBounds();
    validStops.forEach((s) => bounds.extend({ lat: s.latitude, lng: s.longitude }));
    map.fitBounds(bounds, { top: 50, right: 35, bottom: 50, left: 35 });
  }, [routeStops, showRoutePath, state]);

  // Helper to draw styled geodesic polyline
  const drawGeodesicPolyline = (map: google.maps.Map, stops: LocationItem[]) => {
    const path = stops.map((s) => ({ lat: s.latitude, lng: s.longitude }));
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#C62828",
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
    });
    polylineRef.current = polyline;
  };

  // Render Live Group Members
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    memberMarkersRef.current.forEach((m) => m.setMap(null));
    memberMarkersRef.current = liveMembers
      .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng) && m.sharing)
      .map((m) => {
        const isStale = Date.now() - m.updatedAt > 3 * 60 * 1000;
        const marker = new google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map,
          title: `${m.displayName} (${isStale ? "Stale GPS" : "Live GPS"})`,
          zIndex: 35,
          label: {
            text: m.displayName.slice(0, 1).toUpperCase(),
            color: "#FFFFFF",
            fontSize: "10px",
            fontWeight: "bold",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: isStale ? "#9E9E9E" : "#0288D1",
            fillOpacity: 1,
            strokeColor: isStale ? "#E0E0E0" : "#E1F5FE",
            strokeWeight: 3,
          },
        });
        return marker;
      });
  }, [liveMembers, state]);

  // Handle Admin Edit Pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !editable || !pin || state !== "ready") return;

    if (!editMarkerRef.current) {
      editMarkerRef.current = new google.maps.Marker({
        map,
        draggable: true,
        title: "Confirmed location pin",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#780D19",
          fillOpacity: 1,
          strokeColor: "#F5BD32",
          strokeWeight: 3,
        },
      });
      editMarkerRef.current.addListener("dragend", () => {
        const point = editMarkerRef.current?.getPosition();
        if (point) onPinChange?.({ lat: point.lat(), lng: point.lng() });
      });
    }

    editMarkerRef.current.setPosition(pin);
    map.panTo(pin);
  }, [editable, pin, onPinChange, state]);

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter(pin || KOLKATA);
    map.setZoom(pin ? 15 : 12);
  };

  const locateUser = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const map = mapRef.current;
        if (!map) return;

        map.panTo(coords);
        map.setZoom(15);

        if (!userMarkerRef.current) {
          userMarkerRef.current = new google.maps.Marker({
            position: coords,
            map,
            title: "Your Location",
            zIndex: 40,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#1976D2",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 3,
            },
          });
        } else {
          userMarkerRef.current.setPosition(coords);
        }
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={`${styles.wrapper} ${className || ""}`}>
      <div
        ref={elementRef}
        className={styles.map}
        aria-label="Google map of published Durga Puja pandals and amenities"
      />
      {state === "loading" && <div className={styles.overlay}>Loading Google Map…</div>}
      {state === "missing" && (
        <div className={styles.overlay}>
          <strong>Map setup needed</strong>
          <span>
            Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to `.env.local` to load the live Google Map.
          </span>
        </div>
      )}
      {state === "error" && (
        <div className={styles.overlay}>
          <strong>Google Map unavailable</strong>
          <span>Check the API key, billing, enabled APIs, and referrer restrictions.</span>
        </div>
      )}
      {state === "ready" && (
        <div style={{ position: "absolute", right: 12, bottom: 13, display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            className={styles.recenter}
            onClick={locateUser}
            title="Locate my position"
            aria-label="Find my current location"
            style={{ color: locating ? "#F5BD32" : "#26734D" }}
          >
            ⦿
          </button>
          <button className={styles.recenter} onClick={recenter} title="Recenter map" aria-label="Recenter map">
            ⌖
          </button>
        </div>
      )}
      {editable && state === "ready" && (
        <p className={styles.hint}>Tap the map or drag the gold pin to confirm the exact location.</p>
      )}
    </div>
  );
}
