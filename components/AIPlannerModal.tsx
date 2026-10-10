"use client";

import { useState } from "react";
import { getAIRecommendation } from "@/lib/ai";
import type { AIRecommendation, LocationItem } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  availableLocations: LocationItem[];
  onApplyRoute: (stops: LocationItem[]) => void;
};

export default function AIPlannerModal({
  isOpen,
  onClose,
  availableLocations,
  onApplyRoute,
}: Props) {
  const [query, setQuery] = useState("");
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuery = async (text: string) => {
    setLoading(true);
    setQuery(text);
    try {
      const rec = await getAIRecommendation(text, availableLocations);
      setRecommendation(rec);
    } catch (e) {
      console.error("AI recommendation error:", e);
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    { label: "⭐ Top Rated Master Trail", query: "best pandals to visit today" },
    { label: "🚇 Metro-Connected Pujos", query: "pandals near metro stations" },
    { label: "🚶 Low Walking Circuit", query: "make a route with less walking" },
    { label: "🏛️ North Heritage Bonedi Bari", query: "north kolkata heritage traditional pandals" },
    { label: "♿ Accessible & Senior Friendly", query: "accessible locations with nearby toilets" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99,
        background: "rgba(25, 21, 22, 0.65)",
        backdropFilter: "blur(4px)",
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
          maxWidth: 500,
          width: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 12px 40px rgba(120, 13, 25, 0.2)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#70676A",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: "#F5BD32", textTransform: "uppercase" }}>
              AI PANDAL CURATOR
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              margin: "3px 0 2px",
              color: "#780D19",
              fontSize: 22,
            }}
          >
            Plan Your Pujo with AI
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: "#70676A" }}>
            Grounded in authentic Kolkata pandals, metro lines, and crowd-verified routes.
          </p>
        </div>

        {/* Quick query chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleQuery(p.query)}
              style={{
                background: "#FFF",
                border: "1px solid #E8DCCB",
                borderRadius: 99,
                padding: "6px 11px",
                fontSize: 10,
                fontWeight: 600,
                color: "#191516",
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything, e.g. 'South Kolkata art pandals with food nearby'…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) handleQuery(query);
            }}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 10,
              border: "1px solid #E8DCCB",
              background: "#FFF",
              fontSize: 11,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => query.trim() && handleQuery(query)}
            disabled={loading}
            style={{
              background: "#780D19",
              color: "#FFF",
              border: "none",
              borderRadius: 10,
              padding: "0 14px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "…" : "Curate"}
          </button>
        </div>

        {/* Recommendation result */}
        {loading && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#780D19", fontSize: 12 }}>
            Calculating optimal routes, ratings & walking sequence…
          </div>
        )}

        {!loading && recommendation && (
          <div
            style={{
              background: "#FFF",
              border: "1px solid #E8DCCB",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  margin: 0,
                  color: "#780D19",
                  fontSize: 18,
                }}
              >
                {recommendation.title}
              </h3>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#26734D" }}>
                {recommendation.totalDistanceKm} km · {recommendation.estimatedDuration}
              </span>
            </div>

            <p style={{ margin: "6px 0 12px", fontSize: 11, color: "#70676A", lineHeight: 1.4 }}>
              {recommendation.summary}
            </p>

            {/* Highlights */}
            {recommendation.highlights.length > 0 && (
              <div
                style={{
                  background: "#FFF9F0",
                  border: "1px solid #E8DCCB",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 12,
                }}
              >
                <strong style={{ display: "block", fontSize: 10, color: "#F5BD32", textTransform: "uppercase", marginBottom: 4 }}>
                  Why this plan works
                </strong>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "#333", lineHeight: 1.5 }}>
                  {recommendation.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stops list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {recommendation.stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    background: "#FAFAFA",
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#780D19",
                      color: "#FFF",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: 11, color: "#191516", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {stop.name}
                    </strong>
                    <span style={{ fontSize: 9, color: "#70676A" }}>
                      {stop.locality} {stop.rating ? `· ★ ${stop.rating}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onApplyRoute(recommendation.stops);
                onClose();
              }}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 9,
                background: "#780D19",
                color: "#FFF",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Apply to My Route →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
