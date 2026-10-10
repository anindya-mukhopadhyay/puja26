"use client";

import { loadGoogleMaps } from "./googleMaps";

export type GooglePlaceDetails = {
  name?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  googleMapsUrl?: string;
  photoUrl?: string;
  website?: string;
  internationalPhoneNumber?: string;
};

// In-memory cache to avoid duplicate Google API quota usage
const placeDetailsCache = new Map<string, GooglePlaceDetails>();

/**
 * Fetches real-time place details for a pandal or facility using Google Maps PlacesService
 */
export async function fetchGooglePlaceInfo(
  placeName: string,
  latitude: number,
  longitude: number
): Promise<GooglePlaceDetails | null> {
  const cacheKey = `${placeName}_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  if (placeDetailsCache.has(cacheKey)) {
    return placeDetailsCache.get(cacheKey)!;
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || typeof window === "undefined") {
    return null;
  }

  try {
    await loadGoogleMaps("places");
    if (!window.google?.maps?.places) return null;

    // Create an invisible dummy element for PlacesService
    const dummyDiv = document.createElement("div");
    const service = new google.maps.places.PlacesService(dummyDiv);

    return new Promise((resolve) => {
      // 1. Find place by query near coordinates
      const request: google.maps.places.FindPlaceFromPhoneNumberRequest | google.maps.places.TextSearchRequest = {
        query: `${placeName} Durga Puja Kolkata`,
        locationBias: new google.maps.LatLng(latitude, longitude),
      };

      service.textSearch(request, (results, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          results &&
          results.length > 0
        ) {
          const place = results[0];
          const photoUrl = place.photos && place.photos.length > 0
            ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
            : undefined;

          const details: GooglePlaceDetails = {
            name: place.name,
            formattedAddress: place.formatted_address,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            openNow: place.opening_hours?.isOpen?.(),
            photoUrl,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${place.name}, Kolkata`
            )}&query_place_id=${place.place_id}`,
          };

          placeDetailsCache.set(cacheKey, details);
          resolve(details);
        } else {
          // Resolve with fallback info if Google Maps text search didn't return a match
          const fallback: GooglePlaceDetails = {
            name: placeName,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${placeName}, Kolkata`
            )}`,
          };
          placeDetailsCache.set(cacheKey, fallback);
          resolve(fallback);
        }
      });
    });
  } catch (err) {
    console.warn("Could not fetch Google Maps Place info:", err);
    return null;
  }
}
