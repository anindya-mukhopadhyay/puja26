"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { Pandal } from "@/lib/pandals";
import {
  BLUE_LINE_STATIONS,
  GREEN_LINE_STATIONS,
  PURPLE_LINE_STATIONS,
  YELLOW_LINE_STATIONS,
  ALL_METRO_STATIONS,
  METRO_LINES,
  getMetroLineDetails,
  getMetroMarkerSvg,
  metroStationToPlace,
  type MetroStation,
  type MetroLineType,
} from "@/lib/metro";
import styles from "./PujaMap.module.css";

type Coordinates = { lat: number; lng: number };

export type RouteStopMarker = {
  lat: number;
  lng: number;
  name: string;
  stopIndex: number;
  isVisited?: boolean;
};

export type MapItem = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  locality?: string;
  address?: string;
  category?: string;
  [key: string]: unknown;
};

type Props = {
  pandals: Array<Pandal | MapItem>;
  selectedId?: string;
  onSelect?: (pandal: any) => void;
  editable?: boolean;
  pin?: Coordinates | null;
  onPinChange?: (point: Coordinates) => void;
  className?: string;
  visitedIds?: string[];
  userLocation?: Coordinates | null;
  routeStops?: RouteStopMarker[];
  routePolyline?: string;
  showMetro?: boolean;
  onLocationFound?: (coords: Coordinates) => void;
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
  showMetro,
  onLocationFound,
}: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const editMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeMarkersRef = useRef<google.maps.Marker[]>([]);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const metroLinesRef = useRef<google.maps.Polyline[]>([]);
  const metroMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const userCircleRef = useRef<google.maps.Circle | null>(null);
  const userManuallySelectedRef = useRef(false);
  const hasFittedFallbackBoundsRef = useRef(false);
  const prevSelectedIdRef = useRef<string | undefined>(selectedId);
  const [showMetroLines, setShowMetroLines] = useState(showMetro ?? true);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCtDfk8jIajSqYzqAcJvzYSpjyKitnNAzE";
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">(
    mapsKey ? "loading" : "missing"
  );

  useEffect(() => {
    const key = mapsKey;
    if (!key || !elementRef.current) return;
    let cancelled = false;
    loadGoogleMaps("maps")
      .then(() => {
        if (cancelled || !elementRef.current) return;
        const initialCenter = pin || KOLKATA;
        const map = new google.maps.Map(elementRef.current, {
          center: initialCenter,
          zoom: pin ? 15 : 12,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
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
      if (userCircleRef.current) userCircleRef.current.setMap(null);
      routeMarkersRef.current.forEach((marker) => marker.setMap(null));
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
      metroLinesRef.current.forEach((line) => line.setMap(null));
      metroMarkersRef.current.forEach((marker) => marker.setMap(null));
      if (infoWindowRef.current) infoWindowRef.current.close();
    };
  }, [editable, onPinChange]);

  // Handle user current location marker and centering on load/reload
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    if (userCircleRef.current) {
      userCircleRef.current.setMap(null);
      userCircleRef.current = null;
    }
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      userMarkerRef.current = new google.maps.Marker({
        position: userLocation,
        map,
        title: "Your current location",
        zIndex: 100,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#1A73E8",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 4,
        },
      });

      userCircleRef.current = new google.maps.Circle({
        strokeColor: "#1A73E8",
        strokeOpacity: 0.35,
        strokeWeight: 1.5,
        fillColor: "#1A73E8",
        fillOpacity: 0.14,
        map,
        center: userLocation,
        radius: 180,
        zIndex: 99,
      });
    }
  }, [userLocation, state, pin]);

  // Handle pandal markers (including checked visited markers)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    markersRef.current.forEach((marker) => marker.setMap(null));

    const validPandals = pandals.filter(
      (pandal): pandal is (Pandal | MapItem) & { latitude: number; longitude: number } => {
        if (typeof pandal.latitude !== "number" || typeof pandal.longitude !== "number") return false;
        if (!Number.isFinite(pandal.latitude) || !Number.isFinite(pandal.longitude)) return false;
        // When showMetroLines is active, metro stations are rendered by the dedicated metro route layer
        if (showMetroLines && ((pandal as { category?: string }).category === "Metro" || pandal.id?.startsWith("metro-"))) {
          return false;
        }
        return true;
      }
    );

    markersRef.current = validPandals.map((pandal) => {
      const isSelected = pandal.id === selectedId;
      const isVisited = visitedIds.includes(pandal.id);
      const category = (pandal as { category?: string }).category;
      const isMetro = category === "Metro" || pandal.id?.startsWith("metro-");

      if (isMetro) {
        const line: MetroLineType = (pandal as { metroLine?: MetroLineType }).metroLine ||
          (pandal.id?.includes("green")
            ? "green"
            : pandal.id?.includes("purple")
            ? "purple"
            : pandal.id?.includes("yellow")
            ? "yellow"
            : "blue");
        const isInterchange = Boolean((pandal as { isInterchange?: boolean }).isInterchange) ||
          pandal.name.toLowerCase().includes("esplanade") ||
          pandal.name.toLowerCase().includes("noapara") ||
          pandal.name.toLowerCase().includes("majerhat") ||
          pandal.name.toLowerCase().includes("barasat") ||
          pandal.name.toLowerCase().includes("airport");
        const details = getMetroLineDetails(line);
        const marker = new google.maps.Marker({
          position: { lat: pandal.latitude, lng: pandal.longitude },
          map,
          title: `${pandal.name} (${details.name})`,
          zIndex: isSelected ? 40 : 15,
          icon: {
            url: getMetroMarkerSvg(line, isSelected, isInterchange),
            scaledSize: isSelected ? new google.maps.Size(36, 36) : new google.maps.Size(28, 28),
            anchor: isSelected ? new google.maps.Point(18, 18) : new google.maps.Point(14, 14),
          },
        });
        marker.addListener("click", () => {
          const content = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 190px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${details.color};"></span>
                <span style="font-size: 10px; font-weight: 800; color: ${details.color}; text-transform: uppercase; letter-spacing: 0.5px;">${details.name}</span>
                ${isInterchange ? '<span style="background: #FFF3E0; color: #E65100; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 3px;">INTERCHANGE</span>' : ''}
              </div>
              <div style="font-size: 14px; font-weight: 800; color: #1a1a1a; line-height: 1.25; margin-bottom: 3px;">${pandal.name}</div>
              <div style="font-size: 11px; color: #555; line-height: 1.35; margin-bottom: 6px;">${pandal.locality || (pandal as { address?: string }).address || "Kolkata Metro"}</div>
              <div style="font-size: 10px; color: #780d19; font-weight: 700;">🚇 Tap card below for transit directions & nearby pandals</div>
            </div>
          `;
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(map, marker);
          onSelect?.(pandal as any);
        });
        return marker;
      }

      let fillColor = isVisited
        ? isSelected ? "#1B5E20" : "#2E7D32"
        : isSelected ? "#780D19" : "#C62828";

      if (category && category !== "Pandal") {
        if (category === "Food") fillColor = isSelected ? "#B78103" : "#F5BD32";
        else if (category === "Toilet") fillColor = isSelected ? "#34495E" : "#5D75A6";
      }

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
          fillColor,
          fillOpacity: 1,
          strokeColor: isSelected
            ? "#F5BD32"
            : isVisited ? "#A5D6A7" : "#FFF9F0",
          strokeWeight: isSelected ? 4 : 2,
        },
      });
      marker.addListener("click", () => {
        userManuallySelectedRef.current = true;
        onSelect?.(pandal as any);
      });
      return marker;
    });

    const prevSelectedId = prevSelectedIdRef.current;
    prevSelectedIdRef.current = selectedId;

    // Only pan to selected pandal if user deliberately clicked / selected another pandal
    if (selectedId && selectedId !== prevSelectedId && userManuallySelectedRef.current) {
      const active = validPandals.find((p) => p.id === selectedId);
      if (active) {
        map.panTo({ lat: active.latitude, lng: active.longitude });
        if (validPandals.length === 1 || (map.getZoom() && map.getZoom()! < 14)) {
          map.setZoom(15);
        }
      } else {
        const activeMetro = ALL_METRO_STATIONS.find((s) => s.id === selectedId);
        if (activeMetro) {
          map.panTo({ lat: activeMetro.latitude, lng: activeMetro.longitude });
          if (map.getZoom() && map.getZoom()! < 14) {
            map.setZoom(15);
          }
        }
      }
    } else if (!selectedId) {
      userManuallySelectedRef.current = false;
    }

    // On initial load, fit bounds once so user sees all pandals across Kolkata freely
    if (!hasFittedFallbackBoundsRef.current && validPandals.length > 0 && !pin && !selectedId) {
      const bounds = new google.maps.LatLngBounds();
      validPandals.forEach((p) => {
        bounds.extend({ lat: p.latitude, lng: p.longitude });
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 50);
      }
      hasFittedFallbackBoundsRef.current = true;
    }
  }, [pandals, selectedId, onSelect, state, pin, visitedIds, userLocation, showMetroLines]);

  // Handle Kolkata Metro Connected Routes and "M" station markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    metroLinesRef.current.forEach((polyline) => polyline.setMap(null));
    metroLinesRef.current = [];
    metroMarkersRef.current.forEach((marker) => marker.setMap(null));
    metroMarkersRef.current = [];

    if (!showMetroLines) return;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    // 1. Render all 4 connected Metro routes (Blue, Green, Purple, Yellow)
    METRO_LINES.forEach((line) => {
      const polyline = new google.maps.Polyline({
        path: line.path,
        geodesic: true,
        strokeColor: line.color,
        strokeOpacity: 0.88,
        strokeWeight: 4,
        zIndex: 8,
        map,
      });
      polyline.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          infoWindowRef.current?.setContent(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 6px 8px; line-height: 1.4;">
              <div style="font-weight: 800; font-size: 13px; color: ${line.color};">${line.emoji} ${line.name}</div>
              <div style="font-size: 11px; color: #333; margin-top: 2px;">${line.corridor}</div>
              <div style="font-size: 10px; color: #666; margin-top: 3px;">${line.description}</div>
            </div>
          `);
          infoWindowRef.current?.setPosition(e.latLng);
          infoWindowRef.current?.open(map);
        }
      });
      metroLinesRef.current.push(polyline);
    });

    // 2. Render Metro Station Markers ("M" in circle)
    ALL_METRO_STATIONS.forEach((station) => {
      const isSelected = selectedId === station.id;
      const details = getMetroLineDetails(station.line);

      const marker = new google.maps.Marker({
        position: { lat: station.latitude, lng: station.longitude },
        map,
        title: `${station.name} (${details.name})`,
        zIndex: isSelected ? 40 : 15,
        icon: {
          url: getMetroMarkerSvg(station.line, isSelected, station.isInterchange),
          scaledSize: isSelected ? new google.maps.Size(36, 36) : new google.maps.Size(28, 28),
          anchor: isSelected ? new google.maps.Point(18, 18) : new google.maps.Point(14, 14),
        },
      });

      marker.addListener("click", () => {
        const content = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 190px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${details.color};"></span>
              <span style="font-size: 10px; font-weight: 800; color: ${details.color}; text-transform: uppercase; letter-spacing: 0.5px;">${details.name}</span>
              ${station.isInterchange ? '<span style="background: #FFF3E0; color: #E65100; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 3px;">INTERCHANGE</span>' : ''}
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #1a1a1a; line-height: 1.25; margin-bottom: 3px;">${station.name}</div>
            <div style="font-size: 11px; color: #555; line-height: 1.35; margin-bottom: 6px;">${station.description}</div>
            <div style="font-size: 10px; color: #780d19; font-weight: 700;">🚇 Tap card below for transit directions & nearby pandals</div>
          </div>
        `;
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(map, marker);

        onSelect?.(metroStationToPlace(station) as any);
      });

      if (isSelected) {
        const content = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 190px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${details.color};"></span>
              <span style="font-size: 10px; font-weight: 800; color: ${details.color}; text-transform: uppercase; letter-spacing: 0.5px;">${details.name}</span>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #1a1a1a; line-height: 1.25; margin-bottom: 3px;">${station.name}</div>
            <div style="font-size: 11px; color: #555; line-height: 1.35; margin-bottom: 6px;">${station.description}</div>
          </div>
        `;
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(map, marker);
      }

      metroMarkersRef.current.push(marker);
    });
  }, [showMetroLines, selectedId, onSelect, state]);

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

  const fitAllPandals = () => {
    const map = mapRef.current;
    if (!map) return;
    userManuallySelectedRef.current = false;
    const validPandals = pandals.filter(
      (p): p is (Pandal | MapItem) & { latitude: number; longitude: number } =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude)
    );
    if (validPandals.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validPandals.forEach((p) => {
        bounds.extend({ lat: p.latitude, lng: p.longitude });
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 50);
        return;
      }
    }
    map.panTo(pin || KOLKATA);
    map.setZoom(pin ? 15 : 12);
  };

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    userManuallySelectedRef.current = false;
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      map.panTo(userLocation);
      map.setZoom(15);
      return;
    }
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.panTo(coords);
          map.setZoom(15);
          onLocationFound?.(coords);
        },
        (err) => {
          console.warn("Manual geolocation request failed/denied:", err);
          map.panTo(pin || KOLKATA);
          map.setZoom(pin ? 15 : 12);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      map.panTo(pin || KOLKATA);
      map.setZoom(pin ? 15 : 12);
    }
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
        <>
          <div className={styles.mapActionsRight}>
            <button
              className={styles.mapBtn}
              onClick={fitAllPandals}
              aria-label="Show all pandals overview"
              title="Show all pandals (Kolkata overview)"
            >
              ⛶
            </button>
            <button
              className={styles.mapBtn}
              onClick={recenter}
              aria-label="Go to my location"
              title={userLocation ? "Go to my current location (GPS)" : "Locate my position (GPS)"}
            >
              ⌖
            </button>
          </div>
          {!editable && (
            <button
              className={`${styles.metroToggle} ${showMetroLines ? styles.metroToggleActive : ""}`}
              onClick={() => setShowMetroLines((prev) => !prev)}
              title="Toggle Kolkata Metro route overlay (Blue, Green, Purple & Yellow Lines)"
              aria-label="Toggle Kolkata Metro route overlay"
            >
              <span>🚇</span>
              <span>Metro Lines {showMetroLines ? "On" : "Off"}</span>
            </button>
          )}
        </>
      )}
      {editable && state === "ready" && (
        <p className={styles.hint}>Tap the map or drag the gold pin to confirm the exact location.</p>
      )}
    </div>
  );
}
