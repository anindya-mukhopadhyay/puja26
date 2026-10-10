"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { checkIsAdmin, DEFAULT_ADMIN_PASSCODE, signInUser, signUpAdmin } from "@/lib/auth";
import styles from "../admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatAuthError = (err: unknown): string => {
    if (err && typeof err === "object" && "code" in err) {
      const code = String((err as { code: unknown }).code);
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        return "Invalid email or password. Verify your admin credentials.";
      }
      if (code === "auth/email-already-in-use") {
        return "An account with this email already exists. Switch to Sign In or use another email.";
      }
      if (code === "auth/weak-password") {
        return "Password is too weak. Please use at least 6 characters.";
      }
    }
    return err instanceof Error ? err.message : "Authentication error occurred.";
  };

  const submitSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!auth) {
      setError("Firebase is not configured in this environment.");
      return;
    }
    setLoading(true);
    try {
      const user = await signInUser(email, password);
      const isAuthorized = await checkIsAdmin(user);
      if (!isAuthorized) {
        setError("This account is signed in but does not have administrator privileges. Use an account with admin rights or register as admin using the passcode.");
        return;
      }
      router.replace("/admin");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please provide your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUpAdmin(name, email, password, adminPasscode);
      router.replace("/admin");
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

        <div className={styles.tabs} role="tablist" aria-label="Admin authentication mode">
          <button
            type="button"
            className={`${styles.tab} ${tab === "signin" ? styles.activeTab : ""}`}
            onClick={() => { setTab("signin"); setError(""); }}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === "signup" ? styles.activeTab : ""}`}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            Admin Registration
          </button>
        </div>

        <p className={styles.eyebrow}>RESTRICTED ACCESS</p>
        <h1>{tab === "signin" ? "Admin portal" : "Register Admin"}</h1>
        <p className={styles.subtle}>
          {tab === "signin"
            ? "Sign in with an account having administrator permissions to publish and edit pandals."
            : "Authorized organizer onboarding. Requires the designated admin authorization passcode."}
        </p>

        {!firebaseConfigured && (
          <p className={styles.warning}>
            Firebase configuration is missing. See the project README before continuing.
          </p>
        )}

        {tab === "signin" ? (
          <form onSubmit={submitSignIn}>
            <label>
              Admin Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
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
              {loading ? "Signing in…" : "Sign In to Admin Portal"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitSignUp}>
            <label>
              Organizer Name
              <input
                required
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Festival Coordinator"
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
                placeholder="admin@example.com"
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
              Admin Passcode
              <input
                required
                type="password"
                autoComplete="off"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder={DEFAULT_ADMIN_PASSCODE}
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.primary} disabled={loading}>
              {loading ? "Registering Admin…" : "Register as Administrator"}
            </button>
          </form>
        )}

        <div className={styles.footerLinks}>
          <Link href="/login">User Login →</Link>
          <Link href="/">Back to Map</Link>
        </div>
      </section>
    </main>
  );
}
