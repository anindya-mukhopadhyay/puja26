"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import styles from "./PandalSearch.module.css";

export type PlaceChoice = { name: string; address: string; locality: string; lat: number; lng: number };
export default function PandalSearch({ onPlaceSelected }: { onPlaceSelected: (place: PlaceChoice) => void }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !elementRef.current) return;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | undefined;
    let onSelect: ((event: google.maps.places.PlacePredictionSelectEvent) => void) | undefined;
    loadGoogleMaps("places").then(() => {
      if (!elementRef.current) return;
      autocomplete = new google.maps.places.PlaceAutocompleteElement({ includedRegionCodes: ["IN"], placeholder: "Search Durga Puja pandal or location..." });
      onSelect = async (event) => {
        const place = event.placePrediction.toPlace();
        await place.fetchFields({ fields: ["displayName", "formattedAddress", "location", "addressComponents"] });
        if (!place.location) { setError("This result has no usable coordinates. Choose a point manually on the map."); return; }
        const locality = place.addressComponents?.find((part) => part.types?.includes("locality") || part.types?.includes("sublocality"))?.longText || "";
        setError(""); onPlaceSelected({ name: place.displayName || "", address: place.formattedAddress || "", locality, lat: place.location.lat(), lng: place.location.lng() });
      };
      autocomplete.addEventListener("gmp-select", onSelect);
      elementRef.current.replaceChildren(autocomplete);
    }).catch(() => setError("Place search is unavailable. You can still name the pandal and click its position on the map."));
    return () => { if (autocomplete && onSelect) autocomplete.removeEventListener("gmp-select", onSelect); };
  }, [onPlaceSelected]);
  return <div><p className={styles.label}>Search Google Places</p><div ref={elementRef} className={styles.input} aria-label="Search Durga Puja pandal or location" />{!isConfigured && <p className={styles.error}>Add the Google Maps browser key to enable place search. You can still select a pin manually.</p>}{error && <p className={styles.error}>{error}</p>}</div>;
}
