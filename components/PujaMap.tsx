"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { Pandal } from "@/lib/pandals";
import styles from "./PujaMap.module.css";

type Coordinates = { lat: number; lng: number };
type Props = { pandals: Pandal[]; selectedId?: string; onSelect?: (pandal: Pandal) => void; editable?: boolean; pin?: Coordinates | null; onPinChange?: (point: Coordinates) => void; className?: string };

const KOLKATA = { lat: 22.5726, lng: 88.3639 };
const mapStyles: google.maps.MapTypeStyle[] = [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }, { featureType: "poi.park", stylers: [{ color: "#dce5d4" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#f6f1e6" }] }, { featureType: "water", stylers: [{ color: "#d7e6eb" }] }];

export default function PujaMap({ pandals, selectedId, onSelect, editable = false, pin, onPinChange, className }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const editMarkerRef = useRef<google.maps.Marker | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "loading" : "missing");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !elementRef.current) return;
    let cancelled = false;
    loadGoogleMaps("maps").then(() => {
      if (cancelled || !elementRef.current) return;
      const map = new google.maps.Map(elementRef.current, { center: pin || KOLKATA, zoom: pin ? 15 : 12, styles: mapStyles, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false, gestureHandling: "greedy" });
      mapRef.current = map;
      if (editable) map.addListener("click", (event: google.maps.MapMouseEvent) => { if (event.latLng) onPinChange?.({ lat: event.latLng.lat(), lng: event.latLng.lng() }); });
      setState("ready");
    }).catch((error: Error) => { console.error("Google Maps failed to load", error); if (!cancelled) setState("error"); });
    return () => { cancelled = true; markersRef.current.forEach((marker) => marker.setMap(null)); };
  }, [editable, onPinChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = pandals.filter((pandal) => Number.isFinite(pandal.latitude) && Number.isFinite(pandal.longitude)).map((pandal) => {
      const marker = new google.maps.Marker({ position: { lat: pandal.latitude, lng: pandal.longitude }, map, title: pandal.name, zIndex: pandal.id === selectedId ? 10 : 1, icon: { path: google.maps.SymbolPath.CIRCLE, scale: pandal.id === selectedId ? 11 : 8, fillColor: "#C62828", fillOpacity: 1, strokeColor: "#FFF9F0", strokeWeight: 3 } });
      marker.addListener("click", () => onSelect?.(pandal));
      return marker;
    });
  }, [pandals, selectedId, onSelect, state]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !editable || !pin || state !== "ready") return;
    if (!editMarkerRef.current) {
      editMarkerRef.current = new google.maps.Marker({ map, draggable: true, title: "Confirmed pandal pin", icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#780D19", fillOpacity: 1, strokeColor: "#F5BD32", strokeWeight: 3 } });
      editMarkerRef.current.addListener("dragend", () => { const point = editMarkerRef.current?.getPosition(); if (point) onPinChange?.({ lat: point.lat(), lng: point.lng() }); });
    }
    editMarkerRef.current.setPosition(pin);
    map.panTo(pin);
  }, [editable, pin, onPinChange, state]);

  const recenter = () => { const map = mapRef.current; if (!map) return; map.setCenter(pin || KOLKATA); map.setZoom(pin ? 15 : 12); };
  return <div className={`${styles.wrapper} ${className || ""}`}>
    <div ref={elementRef} className={styles.map} aria-label="Google map of published Durga Puja pandals" />
    {state === "loading" && <div className={styles.overlay}>Loading Google Map…</div>}
    {state === "missing" && <div className={styles.overlay}><strong>Map setup needed</strong><span>Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to `.env.local` to load the live Google Map.</span></div>}
    {state === "error" && <div className={styles.overlay}><strong>Google Map unavailable</strong><span>Check the API key, billing, enabled APIs, and referrer restrictions.</span></div>}
    {state === "ready" && <button className={styles.recenter} onClick={recenter} aria-label="Recenter map">⌖</button>}
    {editable && state === "ready" && <p className={styles.hint}>Tap the map or drag the gold pin to confirm the exact location.</p>}
  </div>;
}
