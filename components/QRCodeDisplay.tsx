"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  text: string;
  size?: number;
  label?: string;
};

export default function QRCodeDisplay({ text, size = 180, label }: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!text) return;
    QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: "#780D19", // Dark maroon Puja26 theme
        light: "#FFFFFF",
      },
    })
      .then(setDataUrl)
      .catch((err) => console.error("QR Code generation error:", err));
  }, [text, size]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div style={{ textAlign: "center", display: "inline-block" }}>
      {dataUrl ? (
        <div
          style={{
            background: "#FFF",
            padding: 10,
            borderRadius: 14,
            border: "1px solid #E8DCCB",
            display: "inline-block",
            boxShadow: "0 4px 14px rgba(120,13,25,0.08)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Puja26 Group Invite QR Code"
            width={size}
            height={size}
            style={{ display: "block", borderRadius: 8 }}
          />
        </div>
      ) : (
        <div
          style={{
            width: size,
            height: size,
            display: "grid",
            placeItems: "center",
            background: "#FFF9F0",
            borderRadius: 12,
            border: "1px dashed #E8DCCB",
            color: "#70676A",
            fontSize: 12,
          }}
        >
          Generating QR code…
        </div>
      )}
      {label && (
        <p style={{ margin: "8px 0 6px", fontSize: 11, color: "#70676A" }}>
          {label}
        </p>
      )}
      <div>
        <button
          onClick={copyText}
          type="button"
          style={{
            border: "1px solid #C62828",
            background: copied ? "#26734D" : "#FFF",
            color: copied ? "#FFF" : "#C62828",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            padding: "6px 12px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {copied ? "✓ Copied to clipboard" : "Copy invite link"}
        </button>
      </div>
    </div>
  );
}
