"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { firebaseConfigured } from "@/lib/firebase";
import { signInUser, signUpUser } from "@/lib/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatAuthError = (err: unknown): string => {
    if (err && typeof err === "object" && "code" in err) {
      const code = String((err as { code: unknown }).code);
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        return "Invalid email or password. Please verify your details.";
      }
      if (code === "auth/email-already-in-use") {
        return "An account with this email already exists. Try signing in instead.";
      }
      if (code === "auth/weak-password") {
        return "Password is too weak. Please use at least 6 characters.";
      }
      if (code === "auth/invalid-email") {
        return "Please enter a valid email address.";
      }
    }
    return err instanceof Error ? err.message : "Authentication failed. Please try again.";
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInUser(email, password);
      router.push("/");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signUpUser(name, email, password);
      router.push("/");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard}>
        <Link className={styles.brand} href="/">
          ✦ puja<span>26</span>
        </Link>

        <div className={styles.tabs} role="tablist" aria-label="Sign in mode">
          <button
            type="button"
            className={`${styles.tab} ${tab === "signin" ? styles.activeTab : ""}`}
            onClick={() => { setTab("signin"); setError(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === "signup" ? styles.activeTab : ""}`}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            Create Account
          </button>
        </div>

        <p className={styles.eyebrow}>
          {tab === "signin" ? "WELCOME BACK" : "JOIN THE CELEBRATION"}
        </p>
        <h1>{tab === "signin" ? "Sign in to Puja26" : "Create your account"}</h1>
        <p className={styles.subtle}>
          {tab === "signin"
            ? "Sync your saved pandals, personal route itineraries, and group check-ins."
            : "Plan your pandal routes, save favourites, and explore Kolkata's pujos."}
        </p>

        {!firebaseConfigured && (
          <p className={styles.warning}>
            Firebase is not configured in this environment. Set up credentials before signing in.
          </p>
        )}

        {tab === "signin" ? (
          <form className={styles.form} onSubmit={handleSignIn}>
            <label>
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.primary} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleSignUp}>
            <label>
              Your Name
              <input
                required
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anindya Mukhopadhyay"
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </label>
            <label>
              Confirm Password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.primary} disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        <div className={styles.footerNote}>
          <span>Organizer / Staff?</span>
          <Link href="/admin/login">Admin Portal →</Link>
        </div>

        <Link className={styles.backHome} href="/">
          ← Back to Map & Pandals
        </Link>
      </section>
    </main>
  );
}
