import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import type { UserAccount } from "./types";

export const DEFAULT_ADMIN_PASSCODE = "PUJA26_SECRET_ADMIN_2026";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: "user" | "admin";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function checkIsAdmin(user: User): Promise<boolean> {
  try {
    const token = await user.getIdTokenResult();
    if (token.claims.admin === true) return true;
    if (db) {
      const snap = await getDoc(doc(db, "admins", user.uid));
      return snap.exists();
    }
    return false;
  } catch (error) {
    console.error("Failed to check admin status:", error);
    return false;
  }
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "").trim();
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("0")) return `+91${cleaned.slice(1)}`;
  return cleaned.startsWith("+") ? cleaned : `+91${cleaned}`;
}

export async function signUpUser(
  dataOrName:
    | {
        fullName: string;
        email: string;
        password: string;
        phoneNumber?: string;
        whatsappNumber?: string;
        homeLocality?: string;
      }
    | string,
  emailArg?: string,
  passArg?: string
): Promise<User> {
  if (!auth) throw new Error("Firebase Authentication is not configured.");

  let fullName = "";
  let email = "";
  let password = "";
  let phoneNumber = "";
  let whatsappNumber: string | undefined;
  let homeLocality = "Kolkata";

  if (typeof dataOrName === "object") {
    fullName = dataOrName.fullName;
    email = dataOrName.email;
    password = dataOrName.password;
    phoneNumber = dataOrName.phoneNumber || "";
    whatsappNumber = dataOrName.whatsappNumber;
    homeLocality = dataOrName.homeLocality || "Kolkata";
  } else {
    fullName = dataOrName;
    email = emailArg || "";
    password = passArg || "";
  }

  if (!fullName.trim()) throw new Error("Full name is required.");
  if (!email.trim() || !email.includes("@")) throw new Error("A valid email address is required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = cred.user;

  try {
    await updateProfile(user, { displayName: fullName.trim() });
  } catch {
    // Non-fatal
  }

  if (db) {
    const profile: UserAccount = {
      uid: user.uid,
      displayName: fullName.trim(),
      email: user.email || email.trim(),
      phoneNumber: phoneNumber ? normalizePhoneNumber(phoneNumber) : undefined,
      whatsappNumber: whatsappNumber?.trim() ? normalizePhoneNumber(whatsappNumber) : undefined,
      homeLocality: homeLocality.trim(),
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(db, "users", user.uid), profile, { merge: true });
    } catch (e) {
      console.warn("Could not save user profile record:", e);
    }
  }

  return user;
}

export async function signInUser(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not configured.");
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export const loginUser = signInUser;

export async function signUpAdmin(
  name: string,
  email: string,
  pass: string,
  passcode: string
): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not configured.");
  if (passcode.trim() !== DEFAULT_ADMIN_PASSCODE) {
    throw new Error(
      "Invalid admin authorization passcode. Contact the project owner or use the designated admin key."
    );
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name.trim()) {
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch {
      // Non-fatal
    }
  }
  if (db) {
    await setDoc(doc(db, "admins", cred.user.uid), {
      uid: cred.user.uid,
      displayName: name.trim() || email.split("@")[0],
      email: email.trim(),
      role: "admin",
      passcode: DEFAULT_ADMIN_PASSCODE,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, "users", cred.user.uid),
      {
        uid: cred.user.uid,
        displayName: name.trim() || email.split("@")[0],
        email: email.trim(),
        role: "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export const logoutUser = signOutUser;

export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error("Firebase Authentication is not configured.");
  if (!email.trim() || !email.includes("@")) throw new Error("Enter a valid email address.");
  await sendPasswordResetEmail(auth, email.trim());
}

export async function fetchUserProfile(uid: string): Promise<UserAccount | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
  } catch (err) {
    console.warn("Failed to fetch user profile:", err);
  }
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (current) => {
      setUser(current);
      if (current) {
        const p = await fetchUserProfile(current.uid);
        setProfile(
          p || {
            uid: current.uid,
            displayName: current.displayName || current.email?.split("@")[0] || "User",
            email: current.email || "",
          }
        );
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { user, profile, loading };
}
