"use client";

import { useMemo, useState } from "react";
import type { LocationItem } from "@/lib/types";
import {
  PUJO_AREAS,
  type PujoArea,
  getBestPandalInArea,
  autoSuggestPandalsForArea,
  findNearestPandal,
  classifyArea,
} from "@/lib/routeOptimizer";
import { formatDistance, calculateDistanceKm } from "@/lib/visits";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  allLocations: LocationItem[];
  userCoords?: { lat: number; lng: number } | null;
  onSelectPandal: (pandal: LocationItem) => void;
  onAddToRoute: (pandal: LocationItem) => void;
  routePandalIds?: string[];
};

export default function BestInLocationModal({
  isOpen,
  onClose,
  allLocations,
  userCoords,
  onSelectPandal,
  onAddToRoute,
  routePandalIds = [],
}: Props) {
  // If userCoords is present, detect user's area
  const detectedUserArea = useMemo<PujoArea>(() => {
    if (!userCoords) return "North Kolkata";
    const nearest = findNearestPandal(userCoords.lat, userCoords.lng, allLocations);
    return nearest ? classifyArea(nearest.pandal) : "North Kolkata";
  }, [userCoords, allLocations]);

  const [selectedArea, setSelectedArea] = useState<PujoArea | "NearMe">("North Kolkata");

  // Determine active target area
  const effectiveArea: PujoArea = selectedArea === "NearMe" ? detectedUserArea : selectedArea;

  // Compute best pandal in the active area
  const bestPandal = useMemo(() => {
    return getBestPandalInArea(effectiveArea, allLocations);
  }, [effectiveArea, allLocations]);

  // Compute runners up (ranks #2, #3, #4)
  const runnersUp = useMemo(() => {
    const list = autoSuggestPandalsForArea(effectiveArea, allLocations, 4);
    return list.slice(1);
  }, [effectiveArea, allLocations]);

  if (!isOpen) return null;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "1.5px",
                fontWeight: 800,
                color: "#780D19",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 2,
              }}
            >
              ★ CURATED FESTIVAL EXCELLENCE
            </span>
            <h2
              style={{
                fontSize: 22,
                margin: 0,
                color: "#191516",
                fontFamily: "'Playfair Display', serif",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>🏆 Best Pandal by Location</span>
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#70676A" }}>
              Explore the most celebrated, award-winning pandals in each Kolkata zone.
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

        {/* Location Tabs Picker */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 20,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {userCoords && (
            <button
              type="button"
              onClick={() => setSelectedArea("NearMe")}
              style={{
                padding: "7px 12px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                border: "1px solid",
                borderColor: selectedArea === "NearMe" ? "#780D19" : "#E8DCCB",
                background: selectedArea === "NearMe" ? "#780D19" : "#FFF",
                color: selectedArea === "NearMe" ? "#FFF" : "#70676A",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>📍 Near My Location</span>
            </button>
          )}

          {PUJO_AREAS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedArea(a.id)}
              style={{
                padding: "7px 12px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                border: "1px solid",
                borderColor: selectedArea === a.id ? "#780D19" : "#E8DCCB",
                background: selectedArea === a.id ? "#780D19" : "#FFF",
                color: selectedArea === a.id ? "#FFF" : "#70676A",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* #1 Best Pandal Spotlight Card */}
        {bestPandal ? (
          <div
            style={{
              background: "#FFF",
              border: "2px solid #F5BD32",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              boxShadow: "0 6px 20px rgba(245, 189, 50, 0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Gold Ribbon Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "linear-gradient(135deg, #780D19, #C62828)",
                color: "#FFF",
                fontSize: 10,
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: 99,
                letterSpacing: "0.5px",
                marginBottom: 10,
                boxShadow: "0 2px 8px rgba(120, 13, 25, 0.2)",
              }}
            >
              <span>👑 #1 BEST PUJA IN {effectiveArea.toUpperCase()}</span>
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
                  {bestPandal.name}
                </h3>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#70676A" }}>
                  📍 {bestPandal.locality}
                  {userCoords && (
                    <span style={{ color: "#780D19", fontWeight: 700, marginLeft: 6 }}>
                      ({formatDistance(calculateDistanceKm(userCoords.lat, userCoords.lng, bestPandal.latitude, bestPandal.longitude))})
                    </span>
                  )}
                </p>
              </div>

              {/* Rating Pill */}
              <div
                style={{
                  background: "#FFF9F0",
                  border: "1px solid #F5BD32",
                  borderRadius: 10,
                  padding: "4px 8px",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <strong style={{ fontSize: 13, color: "#780D19", display: "block" }}>
                  ★ {bestPandal.rating || "4.9"}
                </strong>
                <small style={{ fontSize: 9, color: "#70676A" }}>Top Ranked</small>
              </div>
            </div>

            {bestPandal.description && (
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#413839", lineHeight: 1.5 }}>
                {bestPandal.description}
              </p>
            )}

            {/* Key Facilities Tags */}
            {bestPandal.facilities && bestPandal.facilities.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                {bestPandal.facilities.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#F8F4EC",
                      borderRadius: 4,
                      fontSize: 9,
                      color: "#70676A",
                      padding: "2px 6px",
                      border: "1px solid #E8DCCB",
                    }}
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons for #1 Best Pandal */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  onSelectPandal(bestPandal);
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                🗺️ View on Map
              </button>

              <button
                type="button"
                onClick={() => onAddToRoute(bestPandal)}
                style={{
                  flex: 1,
                  background: routePandalIds.includes(bestPandal.id) ? "#FFF2E6" : "#FFF",
                  color: "#780D19",
                  border: "1px solid #780D19",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {routePandalIds.includes(bestPandal.id) ? "✓ In Route" : "＋ Add to Route"}
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${bestPandal.latitude},${bestPandal.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#F5BD32",
                  color: "#191516",
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
                Directions ↗
              </a>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#70676A", fontSize: 12 }}>
            No pandals registered in this area yet.
          </div>
        )}

        {/* Runners Up Section */}
        {runnersUp.length > 0 && (
          <div>
            <h4
              style={{
                fontSize: 13,
                margin: "0 0 10px",
                color: "#191516",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🥈 Top Runner-Ups in {effectiveArea}</span>
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {runnersUp.map((p, index) => {
                const rank = index + 2;
                const inRoute = routePandalIds.includes(p.id);
                return (
                  <div
                    key={p.id}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 99,
                          background: rank === 2 ? "#ECEFF1" : rank === 3 ? "#FFF3E0" : "#F5F5F5",
                          color: "#191516",
                          fontSize: 11,
                          fontWeight: 800,
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid #CFD8DC",
                        }}
                      >
                        #{rank}
                      </span>
                      <div>
                        <strong style={{ fontSize: 12, color: "#191516", display: "block" }}>
                          {p.name}
                        </strong>
                        <span style={{ fontSize: 10, color: "#70676A" }}>
                          ★ {p.rating || "4.8"} · {p.locality}
                          {userCoords && (
                            <span style={{ marginLeft: 4, color: "#780D19", fontWeight: 600 }}>
                              · {formatDistance(calculateDistanceKm(userCoords.lat, userCoords.lng, p.latitude, p.longitude))}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPandal(p);
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
                        onClick={() => onAddToRoute(p)}
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
