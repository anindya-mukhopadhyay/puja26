"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { Pandal } from "@/lib/pandals";
import styles from "./PujaMap.module.css";

type Coordinates = { lat: number; lng: number };

export type RouteStopMarker = {
  lat: number;
  lng: number;
  name: string;
  stopIndex: number;
  isVisited?: boolean;
};

type Props = {
  pandals: Pandal[];
  selectedId?: string;
  onSelect?: (pandal: Pandal) => void;
  editable?: boolean;
  pin?: Coordinates | null;
  onPinChange?: (point: Coordinates) => void;
  className?: string;
  visitedIds?: string[];
  userLocation?: Coordinates | null;
  routeStops?: RouteStopMarker[];
  routePolyline?: string;
};

const KOLKATA = { lat: 22.5726, lng: 88.3639 };
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
  className,
  visitedIds = [],
  userLocation,
  routeStops,
  routePolyline,
}: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const editMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeMarkersRef = useRef<google.maps.Marker[]>([]);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "loading" : "missing"
  );

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !elementRef.current) return;
    let cancelled = false;
    loadGoogleMaps("maps")
      .then(() => {
        if (cancelled || !elementRef.current) return;
        const map = new google.maps.Map(elementRef.current, {
          center: pin || userLocation || KOLKATA,
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
            if (event.latLng) onPinChange?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
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
      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      routeMarkersRef.current.forEach((marker) => marker.setMap(null));
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
    };
  }, [editable, onPinChange]);

  // Handle user current location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      userMarkerRef.current = new google.maps.Marker({
        position: userLocation,
        map,
        title: "Your location",
        zIndex: 50,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#1A73E8",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
      });
    }
  }, [userLocation, state]);

  // Handle pandal markers (including checked visited markers)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = pandals
      .filter((pandal) => Number.isFinite(pandal.latitude) && Number.isFinite(pandal.longitude))
      .map((pandal) => {
        const isSelected = pandal.id === selectedId;
        const isVisited = visitedIds.includes(pandal.id);
        const marker = new google.maps.Marker({
          position: { lat: pandal.latitude, lng: pandal.longitude },
          map,
          title: `${pandal.name}${isVisited ? " (Visited ✓)" : ""}`,
          zIndex: isSelected ? 30 : isVisited ? 15 : 5,
          label: isVisited
            ? {
                text: "✓",
                color: "#FFFFFF",
                fontWeight: "bold",
                fontSize: isSelected ? "13px" : "10px",
              }
            : undefined,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 13 : isVisited ? 10 : 9,
            fillColor: isVisited
              ? isSelected ? "#1B5E20" : "#2E7D32"
              : isSelected ? "#780D19" : "#C62828",
            fillOpacity: 1,
            strokeColor: isSelected
              ? "#F5BD32"
              : isVisited ? "#A5D6A7" : "#FFF9F0",
            strokeWeight: isSelected ? 4 : 2,
          },
        });
        marker.addListener("click", () => onSelect?.(pandal));
        return marker;
      });

    if (selectedId) {
      const active = pandals.find((p) => p.id === selectedId);
      if (active && Number.isFinite(active.latitude) && Number.isFinite(active.longitude)) {
        map.panTo({ lat: active.latitude, lng: active.longitude });
      }
    } else if (pandals.length > 0 && !pin) {
      const bounds = new google.maps.LatLngBounds();
      let hasValidCoords = false;
      pandals.forEach((p) => {
        if (Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) {
          bounds.extend({ lat: p.latitude, lng: p.longitude });
          hasValidCoords = true;
        }
      });
      if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
        bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
        hasValidCoords = true;
      }
      if (hasValidCoords && !bounds.isEmpty()) {
        map.fitBounds(bounds, 60);
      }
    }
  }, [pandals, selectedId, onSelect, state, pin, visitedIds, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !editable || !pin || state !== "ready") return;
    if (!editMarkerRef.current) {
      editMarkerRef.current = new google.maps.Marker({
        map,
        draggable: true,
        title: "Confirmed pandal pin",
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

  // Handle route markers and polyline rendering
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    routeMarkersRef.current.forEach((m) => m.setMap(null));
    routeMarkersRef.current = [];
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (!routeStops || routeStops.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    const pathCoords: google.maps.LatLngLiteral[] = [];

    routeStops.forEach((stop) => {
      if (!Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) return;
      const pos = { lat: stop.lat, lng: stop.lng };
      pathCoords.push(pos);
      bounds.extend(pos);

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `Stop #${stop.stopIndex}: ${stop.name}`,
        zIndex: 50 + stop.stopIndex,
        label: {
          text: String(stop.stopIndex),
          color: "#FFFFFF",
          fontWeight: "bold",
          fontSize: "12px",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: stop.isVisited ? "#2E7D32" : "#780D19",
          fillOpacity: 1,
          strokeColor: "#F5BD32",
          strokeWeight: 3,
        },
      });

      routeMarkersRef.current.push(marker);
    });

    if (pathCoords.length >= 2) {
      routePolylineRef.current = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#780D19",
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 70);
    }
  }, [routeStops, routePolyline, state]);

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter(pin || userLocation || KOLKATA);
    map.setZoom(pin ? 15 : 13);
  };

  return (
    <div className={`${styles.wrapper} ${className || ""}`}>
      <div ref={elementRef} className={styles.map} aria-label="Google map of published Durga Puja pandals" />
      {state === "loading" && <div className={styles.overlay}>Loading Google Map…</div>}
      {state === "missing" && (
        <div className={styles.overlay}>
          <strong>Map setup needed</strong>
          <span>Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to `.env.local` to load the live Google Map.</span>
        </div>
      )}
      {state === "error" && (
        <div className={styles.overlay}>
          <strong>Google Map unavailable</strong>
          <span>Check the API key, billing, enabled APIs, and referrer restrictions.</span>
        </div>
      )}
      {state === "ready" && (
        <button className={styles.recenter} onClick={recenter} aria-label="Recenter map">
          ⌖
        </button>
      )}
      {editable && state === "ready" && (
        <p className={styles.hint}>Tap the map or drag the gold pin to confirm the exact location.</p>
      )}
    </div>
  );
}
