"use client";

import { useEffect, useState } from "react";
import { submitReview, subscribeToLocationReviews } from "@/lib/social";
import type { LocationItem, ReviewItem } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  location: LocationItem;
  user: { uid: string; displayName: string } | null;
  onRequestLogin: () => void;
};

export default function ReviewsDrawer({
  isOpen,
  onClose,
  location,
  user,
  onRequestLogin,
}: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen || !location.id) return;
    return subscribeToLocationReviews(location.id, setReviews);
  }, [isOpen, location.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequestLogin();
      return;
    }
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await submitReview(location.id, user, rating, comment);
      setComment("");
      setSuccess("Your review has been submitted! Thank you.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not post review.");
    } finally {
      setSubmitting(false);
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
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#FFF9F0",
          borderTop: "1px solid #E8DCCB",
          borderRadius: "20px 20px 0 0",
          maxWidth: 520,
          width: "100%",
          maxHeight: "85vh",
          padding: 20,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                margin: 0,
                color: "#780D19",
                fontSize: 20,
              }}
            >
              Reviews & Ratings
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#70676A" }}>
              {location.name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              color: "#70676A",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Write review section */}
        <div
          style={{
            background: "#FFF",
            border: "1px solid #E8DCCB",
            borderRadius: 14,
            padding: 14,
          }}
        >
          {user ? (
            <form onSubmit={handleSubmit}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#191516" }}>
                Write your review
              </p>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 22,
                      color: star <= rating ? "#F5BD32" : "#E8DCCB",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ★
                  </button>
                ))}
                <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 6, alignSelf: "center", color: "#780D19" }}>
                  {rating} / 5
                </span>
              </div>
              <textarea
                rows={2}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (decor, lighting, crowd management, facilities)..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #E8DCCB",
                  fontSize: 11,
                  resize: "none",
                  outline: "none",
                }}
              />
              {error && <p style={{ margin: "6px 0 0", fontSize: 10, color: "#C62828" }}>{error}</p>}
              {success && <p style={{ margin: "6px 0 0", fontSize: 10, color: "#26734D" }}>{success}</p>}
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "#780D19",
                    color: "#FFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Posting…" : "Submit Review"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "#70676A" }}>
                Sign in to share your rating and experience with fellow devotees.
              </p>
              <button
                type="button"
                onClick={onRequestLogin}
                style={{
                  background: "#780D19",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign in to Review
              </button>
            </div>
          )}
        </div>

        {/* Existing reviews */}
        <div>
          <h4
            style={{
              fontFamily: "'Playfair Display', serif",
              margin: "6px 0 10px",
              fontSize: 15,
              color: "#191516",
            }}
          >
            Community Feedback ({reviews.length})
          </h4>
          {reviews.length === 0 ? (
            <div
              style={{
                background: "#FFF",
                border: "1px dashed #E8DCCB",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
                color: "#70676A",
                fontSize: 11,
              }}
            >
              No reviews yet. Be the first devotee to review {location.name}!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "#FFF",
                    border: "1px solid #E8DCCB",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 12, color: "#191516" }}>{r.userName}</strong>
                    <span style={{ color: "#F5BD32", fontSize: 11, fontWeight: 700 }}>
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 4px", fontSize: 11, color: "#333", lineHeight: 1.4 }}>
                    {r.comment}
                  </p>
                  <small style={{ fontSize: 9, color: "#92888A" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
