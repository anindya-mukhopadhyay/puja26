"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, firebaseConfigured } from "@/lib/firebase";
import styles from "../admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (!auth) { setError("Firebase is not configured in this environment. Add the public Firebase API key before using admin sign-in."); return; }
    setLoading(true);
    try { const credential = await signInWithEmailAndPassword(auth, email, password); const token = await credential.user.getIdTokenResult(true); if (token.claims.admin !== true) { setError("This account is signed in but does not have the Puja26 administrator role."); return; } router.replace("/admin"); }
    catch { setError("We couldn’t sign you in. Check the email, password, and Firebase Authentication setup."); }
    finally { setLoading(false); }
  };
  return <main className={styles.loginPage}><section className={styles.loginCard}><a className={styles.brand} href="/">✦ puja<span>26</span></a><p className={styles.eyebrow}>RESTRICTED ACCESS</p><h1>Admin sign in</h1><p className={styles.subtle}>Use an account whose Firebase custom claims include <code>admin: true</code>. There is no public admin registration.</p>{!firebaseConfigured && <p className={styles.warning}>Firebase configuration is missing. See the project README before continuing.</p>}<form onSubmit={submit}><label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" /></label><label>Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>{error && <p className={styles.error}>{error}</p>}<button className={styles.primary} disabled={loading}>{loading ? "Signing in…" : "Sign in securely"}</button></form></section></main>;
}
