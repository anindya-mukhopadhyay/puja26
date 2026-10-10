"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PandalSearch, { type PlaceChoice } from "@/components/PandalSearch";
import PujaMap from "@/components/PujaMap";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { checkIsAdmin } from "@/lib/auth";
import {
  archivePandal,
  type Pandal,
  type PandalInput,
  publishPandal,
  removePandal,
  subscribeToAdminPandals,
  updatePandal,
} from "@/lib/pandals";
import { seedLocationsToFirestore } from "@/lib/locations";
import type { Category, LocationItem } from "@/lib/types";
import styles from "./admin.module.css";

interface AdminFormState extends PandalInput {
  category?: Category;
  facilitiesText?: string;
}

const emptyForm: AdminFormState = {
  name: "",
  address: "",
  locality: "",
  latitude: 22.5726,
  longitude: 88.3639,
  description: "",
  photoURL: "",
  status: "published",
  category: "Pandal",
  facilitiesText: "Drinking water, First aid",
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<"loading" | "allowed" | "denied">("loading");
  const [form, setForm] = useState<AdminFormState>(emptyForm);
  const [pandals, setPandals] = useState<Pandal[]>([]);
  const [editing, setEditing] = useState<Pandal | null>(null);
  const [confirmedPin, setConfirmedPin] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAccess("denied");
      return;
    }
    return onAuthStateChanged(auth, async (current) => {
      if (!current) {
        router.replace("/admin/login");
        return;
      }
      setUser(current);
      const isAuthorized = await checkIsAdmin(current);
      setAccess(isAuthorized ? "allowed" : "denied");
    });
  }, [router]);

  useEffect(() => {
    if (access !== "allowed") return;
    return subscribeToAdminPandals(setPandals, (reason) =>
      setError(`Could not load pandals: ${reason}`)
    );
  }, [access]);

  const choosePlace = useCallback((place: PlaceChoice) => {
    setForm((old) => ({
      ...old,
      name: place.name || old.name,
      address: place.address,
      locality: place.locality,
      latitude: place.lat,
      longitude: place.lng,
    }));
    setConfirmedPin(true);
    setMessage("Candidate location selected. Confirm or adjust the gold map pin, then publish.");
  }, []);

  const setField = <K extends keyof AdminFormState>(key: K, value: AdminFormState[K]) =>
    setForm((old) => ({ ...old, [key]: value }));

  const beginEdit = (pandal: Pandal) => {
    setEditing(pandal);
    setConfirmedPin(true);
    setForm({
      name: pandal.name,
      address: pandal.address,
      locality: pandal.locality,
      latitude: pandal.latitude,
      longitude: pandal.longitude,
      description: pandal.description || "",
      photoURL: pandal.photoURL || "",
      status: pandal.status === "archived" ? "draft" : pandal.status,
      category: "Pandal",
      facilitiesText: "",
    });
    setMessage(`Editing ${pandal.name}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setEditing(null);
    setConfirmedPin(false);
    setForm(emptyForm);
    setMessage("");
    setError("");
  };

  const submit = async () => {
    setError("");
    setMessage("");
    if (!user) return;
    if (!confirmedPin) {
      setError("Confirm a map pin by selecting a Google Place or clicking the map before publishing.");
      return;
    }
    setSaving(true);
    try {
      const wasEditing = Boolean(editing);
      const pandalData: PandalInput = {
        name: form.name,
        address: form.address,
        locality: form.locality,
        latitude: form.latitude,
        longitude: form.longitude,
        description: form.description,
        photoURL: form.photoURL,
        status: form.status,
      };

      if (editing) {
        await updatePandal(editing.id, pandalData);
      } else {
        await publishPandal(pandalData, user.uid);
      }

      setEditing(null);
      setConfirmedPin(false);
      setForm(emptyForm);
      setMessage(
        wasEditing
          ? "Location updated. Connected maps will refresh automatically."
          : "Location published. It is now available to connected public maps."
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The location could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedLocations = async () => {
    if (!user) return;
    if (!window.confirm("Seed 24 verified Kolkata Durga Puja pandals, Metro stations, and facilities into Cloud Firestore?")) {
      return;
    }
    setSeeding(true);
    setError("");
    setMessage("");
    try {
      const count = await seedLocationsToFirestore(user.uid);
      setMessage(`Successfully seeded ${count} verified Kolkata locations into Cloud Firestore!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to seed locations.");
    } finally {
      setSeeding(false);
    }
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    router.replace("/admin/login");
  };

  if (access === "loading") {
    return <main className={styles.loading}>Checking administrator access…</main>;
  }

  if (access === "denied") {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <a className={styles.brand} href="/">
            ✦ puja<span>26</span>
          </a>
          <h1>Admin access required</h1>
          <p className={styles.subtle}>
            {firebaseConfigured
              ? "Your account does not have administrator privileges. Use an authorized admin account or register using the organizer passcode."
              : "Firebase is not configured in this environment."}
          </p>
          <button className={styles.primary} onClick={logout}>
            Back to sign in
          </button>
        </section>
      </main>
    );
  }

  // Convert pandals for PujaMap prop
  const mapPandals: LocationItem[] = pandals.map((p) => ({
    id: p.id,
    name: p.name,
    category: "Pandal",
    address: p.address,
    locality: p.locality,
    latitude: p.latitude,
    longitude: p.longitude,
    description: p.description,
    photoURL: p.photoURL,
    facilities: [],
    status: p.status,
    createdBy: p.createdBy,
  }));

  return (
    <main className={styles.adminPage}>
      <header className={styles.header}>
        <a className={styles.brand} href="/">
          ✦ puja<span>26</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>{user?.email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <section className={styles.intro}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRATION</p>
            <h1>Location &amp; Pandal Management</h1>
            <p>Search a place with Google Places, confirm its exact position, and publish.</p>
          </div>
          <button
            onClick={handleSeedLocations}
            disabled={seeding}
            style={{
              background: "#26734D",
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {seeding ? "Seeding…" : "🌱 Seed Verified Kolkata Data"}
          </button>
        </div>
      </section>

      <div className={styles.dashboard}>
        <section className={styles.editor}>
          <PandalSearch onPlaceSelected={choosePlace} />

          <div className={styles.mapFrame}>
            <PujaMap
              pandals={mapPandals}
              selectedId={editing?.id}
              onSelect={(p) => {
                const found = pandals.find((item) => item.id === p.id);
                if (found) beginEdit(found);
              }}
              editable
              pin={confirmedPin ? { lat: form.latitude, lng: form.longitude } : null}
              onPinChange={({ lat, lng }) => {
                setField("latitude", lat);
                setField("longitude", lng);
                setConfirmedPin(true);
              }}
            />
          </div>

          <p className={styles.coords}>
            {confirmedPin
              ? `Confirmed coordinates: ${form.latitude.toFixed(6)}, ${form.longitude.toFixed(6)}`
              : "No pin confirmed yet — search Google Places or click the map."}
          </p>

          <div className={styles.formGrid}>
            <label>
              Pandal / Place name
              <input
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Ekdalia Evergreen Club"
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value as Category)}
              >
                <option value="Pandal">Durga Puja Pandal</option>
                <option value="Metro">Metro Station</option>
                <option value="Toilet">Public Toilet</option>
                <option value="Food">Food &amp; Water</option>
                <option value="Medical">Medical / First Aid</option>
                <option value="Parking">Parking Zone</option>
                <option value="Other">Other Amenity</option>
              </select>
            </label>

            <label>
              Address
              <input
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Address or landmark"
              />
            </label>

            <label>
              Locality
              <input
                value={form.locality}
                onChange={(e) => setField("locality", e.target.value)}
                placeholder="e.g. Ballygunge, South Kolkata"
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value as PandalInput["status"])}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>

            <label className={styles.full}>
              Facilities (comma separated)
              <input
                value={form.facilitiesText}
                onChange={(e) => setField("facilitiesText", e.target.value)}
                placeholder="Wheelchair ramp, Drinking water, First aid booth, Civic toilet"
              />
            </label>

            <label className={styles.full}>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Festival history, theme, lighting, or visitor guidance"
                rows={3}
              />
            </label>
          </div>

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.editorActions}>
            <button className={styles.secondary} onClick={reset}>
              Clear
            </button>
            <button className={styles.primary} onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Publish Location"}
            </button>
          </div>
        </section>

        <section className={styles.list}>
          <div className={styles.listHeader}>
            <div>
              <p className={styles.eyebrow}>LIVE RECORDS</p>
              <h2>Published locations</h2>
            </div>
            <span>{pandals.length}</span>
          </div>

          {pandals.length === 0 && (
            <div className={styles.empty}>
              No Firestore pandals published yet. Click &quot;Seed Verified Kolkata Data&quot; above to populate immediately.
            </div>
          )}

          {pandals.map((pandal) => (
            <article className={styles.row} key={pandal.id}>
              <div>
                <span
                  className={`${styles.status} ${
                    pandal.status === "published" ? styles.published : ""
                  }`}
                >
                  {pandal.status}
                </span>
                <h3>{pandal.name}</h3>
                <p>{pandal.locality || pandal.address || "No address entered"}</p>
              </div>
              <div className={styles.rowActions}>
                <button onClick={() => beginEdit(pandal)}>Edit</button>
                {pandal.status !== "archived" && (
                  <button
                    onClick={() =>
                      archivePandal(pandal.id).catch(() =>
                        setError("Could not archive this pandal.")
                      )
                    }
                  >
                    Archive
                  </button>
                )}
                <button
                  className={styles.delete}
                  onClick={() => {
                    if (window.confirm(`Delete ${pandal.name}? This cannot be undone.`)) {
                      removePandal(pandal.id).catch(() =>
                        setError("Could not delete this pandal.")
                      );
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
