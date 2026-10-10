# Puja26

A mobile-first Durga Puja discovery and planning experience. The starter is intentionally useful without external credentials: its map canvas, discovery, favourites, itinerary, group, and consent UI are all interactive. Configure Google Maps and Firebase to connect it to live data.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and supply Firebase and Google Maps credentials.
3. Run `npm run dev`, then open `http://localhost:3000`.
4. Run `npm run build` before deployment.

## Firebase model

Firestore holds durable data: `users`, `locations`, `favourites`, `itineraries`, `visits`, `reviews`, `groups/{groupId}/members`, `groups/{groupId}/stops`, `invitations`, `reports`, and `adminAuditLogs`. Location records use a GeoPoint, `status` (`draft`, `published`, or `archived`), verification metadata, and timestamps. Keep member and review sets as documents rather than arrays.

Realtime Database holds only short-lived group GPS data under `groupLocations/{groupId}/{uid}` and user presence. A client should write its own position only after an explicit opt-in, throttle changes by time/distance, attach `onDisconnect().remove()`, and remove location data when sharing stops. It must visibly mark stale data and never display it on the public map.

## Security and roles

Deploy rules with `firebase deploy --only firestore:rules,database,storage`. Grant administrator claims only through a trusted Cloud Function/Admin SDK, e.g. `setCustomUserClaims(uid, { admin: true })`; a hidden dashboard route is not authorization. Firestore rules expose only published locations publicly, protect account-owned data, and scope group reads to group members. Before production, test these rules in the Emulator Suite, especially cross-user writes, expired/revoked invites, and group membership changes.

## Integrations

Use Google Maps JavaScript API for the live map and Places Autocomplete, Geocoding for the admin location-confirmation flow, and Routes API from a server route for walking/transit estimates. Never call Routes or AI providers directly from the browser with unrestricted keys. Restrict the Maps browser key by referrer and API, and keep server keys in your deployment secret store.

The recommendation layer should receive only verified Firestore locations plus route/weather results. If the AI provider is absent or fails, sort deterministically by eligibility, distance, rating/review count, open hours, and facility fit; do not invent a crowd level, hours, routes, or a location.

## Deployment

Deploy the app to Vercel or Firebase App Hosting. Configure every value from `.env.example` in the host’s secret/environment settings, deploy Firebase rules and indexes, enable App Check for web, and use Firebase Emulator Suite in CI for rules tests. Configure email/password auth and the allowed domains in Firebase Authentication before releasing sign-in.
