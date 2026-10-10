import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

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

export async function signUpUser(name: string, email: string, pass: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not configured. Check NEXT_PUBLIC_FIREBASE_API_KEY.");
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name.trim()) {
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch {
      // Non-fatal if profile update fails
    }
  }
  if (db) {
    try {
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName: name.trim() || email.split("@")[0],
        email: email.trim(),
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn("Could not save user profile record:", e);
    }
  }
  return cred.user;
}

export async function signInUser(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not configured. Check NEXT_PUBLIC_FIREBASE_API_KEY.");
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function signUpAdmin(name: string, email: string, pass: string, passcode: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not configured.");
  if (passcode.trim() !== DEFAULT_ADMIN_PASSCODE) {
    throw new Error("Invalid admin authorization passcode. Contact the project owner or use the designated admin key.");
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
    // Also save in users collection
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      displayName: name.trim() || email.split("@")[0],
      email: email.trim(),
      role: "admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}
