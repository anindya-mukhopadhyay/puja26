"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

export async function loadGoogleMaps(library: "maps" | "places") {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCtDfk8jIajSqYzqAcJvzYSpjyKitnNAzE";
  if (!key) throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  if (!configured) { setOptions({ key, v: "weekly", region: "IN", language: "en" }); configured = true; }
  return importLibrary(library);
}
