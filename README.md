# Puja26 — Durga Puja Discovery, Navigation & Social Planning Web App

Puja26 is a mobile-first web application designed for exploring Durga Puja pandals, navigating between locations, planning day-wise itineraries, locating verified public facilities, and sharing live GPS locations with friends in Kolkata.

---

## 1. Design System — Light Bengali Durga Puja Theme

Puja26 adopts a festive, warm Bengali aesthetic:
- **Ivory background**: `#FFF9F0`
- **White surfaces**: `#FFFFFF`
- **Golden yellow**: `#F5BD32`
- **Sindoor red**: `#C62828`
- **Dark maroon**: `#780D19`
- **Ink black**: `#191516`
- **Secondary text**: `#70676A`
- **Soft beige borders**: `#E8DCCB`
- **Success green**: `#26734D`

Typography uses `Playfair Display` for festive editorial headings and `DM Sans` for clean, accessible mobile legibility.

---

## 2. Technology Architecture

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, CSS Modules & Design Tokens.
- **Firebase Authentication**: Email/password signup with phone number, optional WhatsApp, and session management.
- **Cloud Firestore**: Persistent application data (`pandals`, `users`, `favourites`, `visits`, `reviews`, `groups`, `itineraries`).
- **Firebase Realtime Database**: Ephemeral live GPS coordinates (`groupLocations/{groupId}/{uid}`) with automatic presence detection and stale-location expiration.
- **Google Maps Platform**: Google Maps JavaScript API with customized festive styling, category markers, and Places Autocomplete.
- **QR Code Engine**: High-resolution SVG/Canvas QR generator for frictionless group invitations.
- **AI Recommendation Engine**: Grounded planning service with deterministic fallbacks rooted strictly in verified application data.
- **Weather Integration**: Autumn festival meteorological forecasts with rain probabilities and smart pandal routing advice.

---

## 3. Local Setup & Running

### Prerequisites
- Node.js (v20 or v22)
- npm

### Installation
```bash
# Clone and install dependencies
git clone <repo-url>
cd puja26
npm install
```

### Environment Configuration
Create `.env.local` in the project root:
```env
# Public Firebase web configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCaD5-ZR2cl91tohEVuNcRErK-pZYlY_SE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=puja26-5d19a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=puja26-5d19a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=puja26-5d19a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=797849505599
NEXT_PUBLIC_FIREBASE_APP_ID=1:797849505599:web:1a90a169242bfd0df4cd8a
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://puja26-5d19a-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FSPQHMRFL8

# Google Maps JavaScript API (restricted by HTTP referrer in Google Cloud Console)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCtDfk8jIajSqYzqAcJvzYSpjyKitnNAzE

# Server-side integrations (deterministic fallbacks active when empty)
GOOGLE_ROUTES_API_KEY=
AI_PROVIDER_API_KEY=
WEATHER_API_KEY=
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser (or use mobile device emulation in Developer Tools).

---

## 4. Testing & Verification

Run unit test suites:
```bash
npm test
```
*Current test suite: 15 passing unit tests verifying phone normalization, Haversine routing calculations, live GPS stale tracking, AI planning clusters, and weather integration.*

Type checking:
```bash
npx tsc --noEmit
```

Production build:
```bash
npm run build
```

---

## 5. Admin Pandal Management & Firestore Rules

### Admin Access
The `/admin` dashboard allows administrators to search pandals with Google Places, confirm coordinates on a draggable map pin, choose category and facilities, and publish live records.

To grant administrator access to a Firebase user, run via Firebase Admin SDK:
```js
const { getAuth } = require("firebase-admin/auth");
await getAuth().setCustomUserClaims("TARGET_USER_UID", { admin: true });
```

### 1-Click Seeding
Admins can click **"🌱 Seed Verified Kolkata Data"** in the `/admin` dashboard to instantly populate Cloud Firestore with 24 verified iconic Kolkata Durga Puja pandals (North, South, Central, Salt Lake), Metro stations, and public amenities.

### Deploying Security Rules
```bash
firebase deploy --only firestore:rules,database,storage
```

---

## 6. Live Location Privacy Model

- Live GPS sharing is **explicitly opt-in** and strictly disabled by default.
- Coordinates are stored only in Firebase Realtime Database under `groupLocations/{groupId}/{uid}`.
- Coordinates are never written to public Firestore collections or displayed to unauthorized users.
- Automatic disconnection presence (`onDisconnect`) ensures coordinates cease updating when the browser is closed or disconnected.
- Updates older than 3 minutes are explicitly flagged as **Stale GPS**.
