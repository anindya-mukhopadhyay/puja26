"use client";

import { useMemo, useState } from "react";
import {
  PUJO_AREAS,
  type PujoArea,
  getPandalsInArea,
  optimizeMultiAreaRoute,
} from "@/lib/routeOptimizer";
import type { LocationItem } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  allLocations: LocationItem[];
  userCoords?: { lat: number; lng: number };
  onApplyRoute: (stops: LocationItem[]) => void;
};

export default function AreaPandalSelectorModal({
  isOpen,
  onClose,
  allLocations,
  userCoords,
  onApplyRoute,
}: Props) {
  // Selected areas (e.g. ["North Kolkata", "South Kolkata"])
  const [selectedAreas, setSelectedAreas] = useState<PujoArea[]>([
    "North Kolkata",
    "South Kolkata",
  ]);

  // Specific pandals explicitly checked by the user
  const [selectedPandalIds, setSelectedPandalIds] = useState<string[]>([]);
  const [expandedArea, setExpandedArea] = useState<PujoArea | null>("North Kolkata");

  // Toggle an area on or off
  const toggleArea = (area: PujoArea) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  // Toggle a specific pandal
  const togglePandal = (id: string) => {
    setSelectedPandalIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Compute preview of optimized route in real time
  const preview = useMemo(() => {
    return optimizeMultiAreaRoute({
      selectedAreas,
      selectedPandalIds,
      allLocations,
      startCoords: userCoords,
      travelMode: "walking",
    });
  }, [selectedAreas, selectedPandalIds, allLocations, userCoords]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyRoute(preview.routeStops);
    onClose();
  };

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
          maxWidth: 520,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 22,
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
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: "#F5BD32", textTransform: "uppercase" }}>
            MULTI-AREA SMART TRIP PLANNER
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              margin: "3px 0 2px",
              color: "#780D19",
              fontSize: 22,
            }}
          >
            Select Areas &amp; Pandals
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: "#70676A" }}>
            Pick areas you want to visit. Select specific pandals, or let Puja26 auto-recommend the best from each area!
          </p>
        </div>

        {/* 1. Area Selector Chips */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#191516" }}>
            1. Select Areas to Visit ({selectedAreas.length} selected)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PUJO_AREAS.map((area) => {
              const isSelected = selectedAreas.includes(area.id);
              const pandalsInArea = getPandalsInArea(area.id, allLocations);
              const specificCount = pandalsInArea.filter((p) => selectedPandalIds.includes(p.id)).length;

              return (
                <div
                  key={area.id}
                  onClick={() => toggleArea(area.id)}
                  style={{
                    background: isSelected ? "#FFF" : "#F6EFE5",
                    border: isSelected ? "2px solid #780D19" : "1px solid #E8DCCB",
                    borderRadius: 12,
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 12, color: isSelected ? "#780D19" : "#555" }}>
                      {area.label}
                    </strong>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <span style={{ fontSize: 9, color: "#70676A", marginTop: 4 }}>
                    {specificCount > 0
                      ? `${specificCount} chosen`
                      : isSelected
                      ? "⚡ Auto-picks top 2"
                      : `${pandalsInArea.length} pandals`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Specific Pandal Selection per Area */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#191516" }}>
            2. Choose Specific Pandals (Optional)
          </label>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#70676A" }}>
            Leave blank in an area to automatically include its top-rated pandals.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedAreas.map((area) => {
              const areaPandals = getPandalsInArea(area, allLocations);
              const isExpanded = expandedArea === area;
              const chosenHere = areaPandals.filter((p) => selectedPandalIds.includes(p.id));

              return (
                <div
                  key={area}
                  style={{
                    background: "#FFF",
                    border: "1px solid #E8DCCB",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedArea(isExpanded ? null : area)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "#FFF",
                      border: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#191516",
                    }}
                  >
                    <span>
                      {area}{" "}
                      <small style={{ fontWeight: 400, color: "#70676A" }}>
                        ({chosenHere.length > 0 ? `${chosenHere.length} selected` : "⚡ Auto-suggest active"})
                      </small>
                    </span>
                    <span>{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #F0EAE1", display: "flex", flexDirection: "column", gap: 6 }}>
                      {areaPandals.map((pandal) => {
                        const isChecked = selectedPandalIds.includes(pandal.id);
                        return (
                          <label
                            key={pandal.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 11,
                              cursor: "pointer",
                              padding: "4px 0",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePandal(pandal.id)}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ color: isChecked ? "#780D19" : "#191516" }}>
                                {pandal.name}
                              </strong>
                              <span style={{ fontSize: 9, color: "#70676A", display: "block" }}>
                                {pandal.locality} · ★ {pandal.rating || "4.8"}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Real-Time Recommended Multi-Area Route Preview */}
        <div
          style={{
            background: "#FFF",
            border: "1px solid #E8DCCB",
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", margin: 0, fontSize: 16, color: "#780D19" }}>
              Optimized Tour Sequence
            </h3>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#26734D" }}>
              {preview.routeStops.length} stops · {preview.totalDistanceKm} km
            </span>
          </div>

          <p style={{ margin: "0 0 10px", fontSize: 10, color: "#70676A" }}>
            Sorted in smooth geographical progression without city backtracking.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {preview.routeStops.map((stop, idx) => {
              const isAuto = preview.autoSuggestedIds.includes(stop.id);
              return (
                <div
                  key={stop.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    background: isAuto ? "#FFF9F0" : "#FAFAFA",
                    borderRadius: 8,
                    border: isAuto ? "1px dashed #F5BD32" : "1px solid #EAE2D5",
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
                      {stop.locality}
                    </span>
                  </div>
                  {isAuto && (
                    <span style={{ fontSize: 8, fontWeight: 700, color: "#B58427", background: "#FEF7E6", padding: "2px 5px", borderRadius: 4 }}>
                      Auto-Suggested
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleApply}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            background: "#780D19",
            color: "#FFF",
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Create Multi-Area Route ({preview.routeStops.length} Pandals) →
        </button>
      </div>
    </div>
  );
}
