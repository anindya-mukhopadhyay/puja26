"use client";

import { useEffect, useState } from "react";
import QRCodeDisplay from "./QRCodeDisplay";
import type { Group } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
};

export default function GroupInviteModal({ isOpen, onClose, group }: Props) {
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && group) {
      setShareUrl(`${window.location.origin}/?join=${group.inviteCode}`);
    }
  }, [group]);

  if (!isOpen || !group) return null;

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
          maxWidth: 420,
          width: "100%",
          padding: 24,
          boxShadow: "0 12px 40px rgba(120, 13, 25, 0.2)",
          position: "relative",
          textAlign: "center",
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

        <span style={{ fontSize: 24, color: "#F5BD32" }}>✦</span>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            margin: "4px 0 2px",
            color: "#780D19",
            fontSize: 22,
          }}
        >
          Invite Friends to Group
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 11, color: "#70676A" }}>
          {group.name}
        </p>

        {/* Invite Code badge */}
        <div
          style={{
            display: "inline-block",
            background: "#FFF",
            border: "1px dashed #C62828",
            borderRadius: 12,
            padding: "8px 20px",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 9, color: "#70676A", letterSpacing: 1.2, textTransform: "uppercase", display: "block" }}>
            INVITE CODE
          </span>
          <strong style={{ fontSize: 24, letterSpacing: 4, color: "#780D19", fontFamily: "monospace" }}>
            {group.inviteCode}
          </strong>
        </div>

        {/* QR Code */}
        <div style={{ marginBottom: 14 }}>
          <QRCodeDisplay text={shareUrl || group.inviteCode} size={160} label="Scan with phone camera to join instantly" />
        </div>

        <p style={{ margin: "0 0 14px", fontSize: 10, color: "#70676A", lineHeight: 1.4 }}>
          Members can view the shared itinerary, sync live pandal stops, and optionally share live GPS coordinates with each other.
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 9,
            background: "#780D19",
            color: "#FFF",
            border: "none",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
