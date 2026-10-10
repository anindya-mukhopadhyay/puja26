"use client";

import { useState } from "react";
import { recordVisit } from "@/lib/social";
import type { LocationItem } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  location: LocationItem;
  userId: string;
  onSuccess?: () => void;
};

export default function VisitModal({ isOpen, onClose, location, userId, onSuccess }: Props) {
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await recordVisit(userId, location, visitedAt, notes);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not record visit.");
    } finally {
      setSaving(false);
    }
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
          borderRadius: 18,
          maxWidth: 400,
          width: "100%",
          padding: 22,
          boxShadow: "0 12px 35px rgba(120, 13, 25, 0.2)",
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

        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            margin: "0 0 4px",
            color: "#780D19",
            fontSize: 20,
          }}
        >
          Mark as Visited ✓
        </h3>
        <p style={{ margin: "0 0 14px", fontSize: 11, color: "#70676A" }}>
          {location.name} · {location.locality}
        </p>

        {error && (
          <div style={{ color: "#C62828", fontSize: 11, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              Visit Date
            </label>
            <input
              type="date"
              required
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #E8DCCB",
                background: "#FFF",
                fontSize: 12,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              Personal notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visited during evening aarti. Amazing light work, line was fast."
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #E8DCCB",
                background: "#FFF",
                fontSize: 12,
                resize: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #E8DCCB",
                background: "#FFF",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: "none",
                background: "#26734D",
                color: "#FFF",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {saving ? "Saving…" : "Save Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
