"use client";

import { useMemo, useState } from "react";
import type { LocationItem } from "@/lib/types";
import { findNearestPandals, findNearestPandal } from "@/lib/routeOptimizer";
import { formatDistance, calculateDistanceKm } from "@/lib/visits";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  allLocations: LocationItem[];
  userCoords?: { lat: number; lng: number } | null;
  onSelectPandal: (pandal: LocationItem) => void;
  onAddToRoute: (pandal: LocationItem) => void;
  onRequestGPS: () => void;
  routePandalIds?: string[];
};

// Popular Kolkata landmark hubs for fallback when GPS is not active
const KOLKATA_HUBS: { name: string; lat: number; lng: number }[] = [
  { name: "Shyambazar / North", lat: 22.6025, lng: 88.3712 },
  { name: "Gariahat / South", lat: 22.5186, lng: 88.3654 },
  { name: "College Street / Central", lat: 22.5768, lng: 88.3639 },
  { name: "Lake Town / VIP Road", lat: 22.6001, lng: 88.4022 },
  { name: "Salt Lake (Sector 1)", lat: 22.5875, lng: 88.4085 },
  { name: "Behala / South West", lat: 22.4988, lng: 88.3195 },
  { name: "Kalighat / Hazra", lat: 22.5228, lng: 88.3448 },
];

export default function NearestPandalModal({
  isOpen,
  onClose,
  allLocations,
  userCoords,
  onSelectPandal,
  onAddToRoute,
  onRequestGPS,
  routePandalIds = [],
}: Props) {
  const [selectedHub, setSelectedHub] = useState<string>("Shyambazar / North");

  // Determine reference coordinates (either real user GPS or selected Kolkata hub)
  const refCoords = useMemo(() => {
    if (userCoords) return userCoords;
    const hub = KOLKATA_HUBS.find((h) => h.name === selectedHub);
    return hub ? { lat: hub.lat, lng: hub.lng } : { lat: 22.5726, lng: 88.3639 };
  }, [userCoords, selectedHub]);

  // Compute nearest pandals from reference coordinates
  const nearestList = useMemo(() => {
    return findNearestPandals(refCoords.lat, refCoords.lng, allLocations, 6);
  }, [refCoords, allLocations]);

  if (!isOpen) return null;

  const topNearest = nearestList.length > 0 ? nearestList[0] : null;
  const otherNearest = nearestList.slice(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(25, 21, 22, 0.7)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFF9F0",
          border: "1px solid #E8DCCB",
          borderRadius: 20,
          width: "100%",
          maxWidth: 580,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(120, 13, 25, 0.25)",
          padding: 24,
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "1.5px",
                fontWeight: 800,
                color: "#C62828",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 2,
              }}
            >
              🧭 REAL-TIME PROXIMITY FINDER
            </span>
            <h2
              style={{
                fontSize: 22,
                margin: 0,
                color: "#191516",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Nearest Durga Puja Pandals
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#70676A" }}>
              {userCoords
                ? "Calculated from your live GPS location."
                : "Select a neighborhood hub or tap 'Use My GPS' for exact distance."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "#FFF",
              border: "1px solid #E8DCCB",
              borderRadius: 99,
              width: 32,
              height: 32,
              fontSize: 16,
              cursor: "pointer",
              color: "#70676A",
              display: "grid",
              placeItems: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* GPS Control Bar */}
        <div
          style={{
            background: "#FFF",
            border: "1px solid #E8DCCB",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{userCoords ? "📍" : "🧭"}</span>
            <div>
              <strong style={{ fontSize: 11, color: userCoords ? "#26734D" : "#191516", display: "block" }}>
                {userCoords ? "Live GPS Active" : "Reference Location"}
              </strong>
              <small style={{ fontSize: 9, color: "#70676A" }}>
                {userCoords
                  ? `Lat: ${userCoords.lat.toFixed(4)}, Lng: ${userCoords.lng.toFixed(4)}`
                  : `Using ${selectedHub}`}
              </small>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {!userCoords && (
              <button
                type="button"
                onClick={onRequestGPS}
                style={{
                  background: "#780D19",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📡 Use My Live GPS
              </button>
            )}

            {!userCoords && (
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                style={{
                  background: "#FFF9F0",
                  border: "1px solid #E8DCCB",
                  borderRadius: 6,
                  padding: "5px 8px",
                  fontSize: 10,
                  color: "#191516",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {KOLKATA_HUBS.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* #1 Nearest Pandal Hero Card */}
        {topNearest && (
          <div
            style={{
              background: "#FFF",
              border: "2px solid #C62828",
              borderRadius: 16,
              padding: 16,
              marginBottom: 18,
              boxShadow: "0 6px 20px rgba(198, 40, 40, 0.15)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#C62828",
                color: "#FFF",
                fontSize: 10,
                fontWeight: 800,
                padding: "3px 9px",
                borderRadius: 99,
                marginBottom: 8,
              }}
            >
              <span>📍 #1 CLOSEST PANDAL · {formatDistance(topNearest.distanceKm).toUpperCase()}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    margin: "0 0 4px",
                    color: "#191516",
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {topNearest.pandal.name}
                </h3>
                <p style={{ margin: "0 0 10px", fontSize: 11, color: "#70676A" }}>
                  📍 {topNearest.pandal.locality} · ★ {topNearest.pandal.rating || "4.8"}
                </p>
              </div>

              <div
                style={{
                  background: "#FFF9F0",
                  border: "1px solid #E8DCCB",
                  borderRadius: 8,
                  padding: "6px 10px",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <strong style={{ fontSize: 14, color: "#C62828", display: "block" }}>
                  {formatDistance(topNearest.distanceKm)}
                </strong>
                <small style={{ fontSize: 9, color: "#70676A" }}>Walking distance</small>
              </div>
            </div>

            {topNearest.pandal.description && (
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#413839", lineHeight: 1.4 }}>
                {topNearest.pandal.description}
              </p>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  onSelectPandal(topNearest.pandal);
                  onClose();
                }}
                style={{
                  flex: 1,
                  background: "#780D19",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🗺️ View on Map
              </button>

              <button
                type="button"
                onClick={() => onAddToRoute(topNearest.pandal)}
                style={{
                  flex: 1,
                  background: routePandalIds.includes(topNearest.pandal.id) ? "#FFF2E6" : "#FFF",
                  color: "#780D19",
                  border: "1px solid #780D19",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {routePandalIds.includes(topNearest.pandal.id) ? "✓ In Route" : "＋ Add to Route"}
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${topNearest.pandal.latitude},${topNearest.pandal.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#26734D",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                🚶 Navigate ↗
              </a>
            </div>
          </div>
        )}

        {/* Other Nearby Pandals List */}
        {otherNearest.length > 0 && (
          <div>
            <h4
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#191516",
                margin: "0 0 10px",
              }}
            >
              Other Nearby Pandals Within Walking Range:
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {otherNearest.map((item, idx) => {
                const inRoute = routePandalIds.includes(item.pandal.id);
                return (
                  <div
                    key={item.pandal.id}
                    style={{
                      background: "#FFF",
                      border: "1px solid #E8DCCB",
                      borderRadius: 12,
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 12, color: "#191516", display: "block" }}>
                        {item.pandal.name}
                      </strong>
                      <span style={{ fontSize: 10, color: "#70676A" }}>
                        📍 {item.pandal.locality} ·{" "}
                        <strong style={{ color: "#C62828" }}>{formatDistance(item.distanceKm)}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPandal(item.pandal);
                          onClose();
                        }}
                        style={{
                          background: "#FFF9F0",
                          border: "1px solid #E8DCCB",
                          color: "#780D19",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "5px 8px",
                          cursor: "pointer",
                        }}
                      >
                        Map
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddToRoute(item.pandal)}
                        style={{
                          background: inRoute ? "#FFF2E6" : "#FFF",
                          border: "1px solid #780D19",
                          color: "#780D19",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "5px 8px",
                          cursor: "pointer",
                        }}
                      >
                        {inRoute ? "✓" : "＋ Route"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
