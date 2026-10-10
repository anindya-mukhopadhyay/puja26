"use client";

import { useState } from "react";
import { loginUser, sendPasswordReset, signUpUser } from "@/lib/auth";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await loginUser(email, password);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Check email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signUpUser({
        fullName,
        email,
        password,
        phoneNumber,
        whatsappNumber: whatsappNumber || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email address above to receive a password reset link.");
      return;
    }
    try {
      await sendPasswordReset(email);
      setInfo("Password reset link sent to your email.");
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
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
          borderRadius: 20,
          maxWidth: 440,
          width: "100%",
          padding: 24,
          boxShadow: "0 12px 40px rgba(120, 13, 25, 0.2)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close auth dialog"
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

        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <span style={{ color: "#F5BD32", fontSize: 24 }}>✦</span>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              margin: "4px 0 2px",
              color: "#780D19",
              fontSize: 22,
            }}
          >
            {tab === "login" ? "Sign in to Puja26" : "Create your Puja26 Account"}
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: "#70676A" }}>
            Save favourites, plan group itineraries, and share live location.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "#FFF",
            border: "1px solid #E8DCCB",
            borderRadius: 10,
            padding: 3,
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError("");
              setInfo("");
            }}
            style={{
              flex: 1,
              padding: "7px 0",
              border: "none",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              background: tab === "login" ? "#780D19" : "transparent",
              color: tab === "login" ? "#FFF" : "#70676A",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setError("");
              setInfo("");
            }}
            style={{
              flex: 1,
              padding: "7px 0",
              border: "none",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              background: tab === "signup" ? "#780D19" : "transparent",
              color: tab === "signup" ? "#FFF" : "#70676A",
              cursor: "pointer",
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#FFF0F0",
              border: "1px solid #F5C2C7",
              color: "#C62828",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 11,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {info && (
          <div
            style={{
              background: "#F0FFF4",
              border: "1px solid #C3E6CB",
              color: "#26734D",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 11,
              marginBottom: 12,
            }}
          >
            {info}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#191516", marginBottom: 4 }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 9,
                  border: "1px solid #E8DCCB",
                  background: "#FFF",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#191516", marginBottom: 4 }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 9,
                  border: "1px solid #E8DCCB",
                  background: "#FFF",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 11,
                  color: "#C62828",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: 11,
                borderRadius: 9,
                background: "#780D19",
                color: "#FFF",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#191516", marginBottom: 4 }}>
                Full name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Anindya Mukhopadhyay"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 9,
                  border: "1px solid #E8DCCB",
                  background: "#FFF",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#191516", marginBottom: 4 }}>
                  Phone number *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9830123456"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "1px solid #E8DCCB",
                    background: "#FFF",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#191516", marginBottom: 4 }}>
                  WhatsApp (optional)
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Same or other"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "1px solid #E8DCCB",
                    background: "#FFF",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#191516", marginBottom: 4 }}>
                Email address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 9,
                  border: "1px solid #E8DCCB",
                  background: "#FFF",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#191516", marginBottom: 4 }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "1px solid #E8DCCB",
                    background: "#FFF",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#191516", marginBottom: 4 }}>
                  Confirm *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat pass"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "1px solid #E8DCCB",
                    background: "#FFF",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: 11,
                borderRadius: 9,
                background: "#780D19",
                color: "#FFF",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
