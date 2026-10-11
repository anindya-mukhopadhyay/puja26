"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import styles from "./admin.module.css";

const emptyForm: PandalInput = {
  name: "",
  address: "",
  locality: "",
  latitude: 22.5726,
  longitude: 88.3639,
  description: "",
  photoURL: "",
  status: "published",
};

type DuplicateInfo = {
  reason: string;
  matchedNames: string[];
};

function normalizePandalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDuplicateMap(list: Pandal[]): Map<string, DuplicateInfo> {
  const map = new Map<string, DuplicateInfo>();

  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    const normA = normalizePandalName(a.name);

    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      const normB = normalizePandalName(b.name);

      const isNameDup =
        normA.length >= 3 &&
        (normA === normB || normA.includes(normB) || normB.includes(normA));

      const hasCoords =
        Number.isFinite(a.latitude) &&
        Number.isFinite(a.longitude) &&
        Number.isFinite(b.latitude) &&
        Number.isFinite(b.longitude);

      const isCoordDup =
        hasCoords &&
        Math.abs(a.latitude - b.latitude) < 0.0008 &&
        Math.abs(a.longitude - b.longitude) < 0.0008;

      if (isNameDup || isCoordDup) {
        const reason =
          isNameDup && isCoordDup
            ? "Duplicate name & location"
            : isNameDup
            ? "Matching name"
            : "Same GPS coordinates";

        const aEntry = map.get(a.id) || { reason, matchedNames: [] };
        if (!aEntry.matchedNames.includes(b.name)) aEntry.matchedNames.push(b.name);
        map.set(a.id, aEntry);

        const bEntry = map.get(b.id) || { reason, matchedNames: [] };
        if (!bEntry.matchedNames.includes(a.name)) bEntry.matchedNames.push(a.name);
        map.set(b.id, bEntry);
      }
    }
  }

  return map;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<"loading" | "allowed" | "denied">("loading");
  const [form, setForm] = useState<PandalInput>(emptyForm);
  const [pandals, setPandals] = useState<Pandal[]>([]);
  const [editing, setEditing] = useState<Pandal | null>(null);
  const [confirmedPin, setConfirmedPin] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "duplicates" | "published" | "draft">("all");
  const [sortOrder, setSortOrder] = useState<"alpha-asc" | "alpha-desc" | "newest" | "duplicates">("alpha-asc");

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

  const setField = <K extends keyof PandalInput>(key: K, value: PandalInput[K]) =>
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
      description: "",
      photoURL: pandal.photoURL || "",
      status: pandal.status === "archived" ? "draft" : pandal.status,
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
      if (editing) await updatePandal(editing.id, form);
      else await publishPandal(form, user.uid);
      setEditing(null);
      setConfirmedPin(false);
      setForm(emptyForm);
      setMessage(
        wasEditing
          ? "Pandal updated. Connected maps will refresh automatically."
          : "Pandal published. It is now available to connected public maps."
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The pandal could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    router.replace("/admin/login");
  };

  // Duplicates mapping
  const duplicateMap = useMemo(() => getDuplicateMap(pandals), [pandals]);
  const duplicateCount = duplicateMap.size;

  // Filtered & Sorted Pandals (A-Z serial wise up to down)
  const filteredPandals = useMemo(() => {
    let result = [...pandals];

    // 1. Tab filter
    if (filterTab === "duplicates") {
      result = result.filter((p) => duplicateMap.has(p.id));
    } else if (filterTab === "published") {
      result = result.filter((p) => p.status === "published");
    } else if (filterTab === "draft") {
      result = result.filter((p) => p.status === "draft");
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.locality && p.locality.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q))
      );
    }

    // 3. Serial Alphabetical Sorting (Up to Down)
    if (sortOrder === "alpha-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    } else if (sortOrder === "alpha-desc") {
      result.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
    } else if (sortOrder === "duplicates") {
      result.sort((a, b) => {
        const aDup = duplicateMap.has(a.id) ? 1 : 0;
        const bDup = duplicateMap.has(b.id) ? 1 : 0;
        if (aDup !== bDup) return bDup - aDup;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [pandals, filterTab, searchQuery, sortOrder, duplicateMap]);

  if (access === "loading") return <main className={styles.loading}>Checking administrator access…</main>;

  if (access === "denied") {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <a className={styles.brand} href="/">✦ puja<span>26</span></a>
          <h1>Admin access required</h1>
          <p className={styles.subtle}>
            {firebaseConfigured
              ? "Your account does not have an administrator custom claim. Ask a project owner to grant it through a trusted Admin SDK process."
              : "Firebase is not configured in this environment."}
          </p>
          <button className={styles.primary} onClick={logout}>Back to sign in</button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.adminPage}>
      <header className={styles.header}>
        <a className={styles.brand} href="/">✦ puja<span>26</span></a>
        <div>
          <span>{user?.email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>ADMINISTRATION</p>
        <h1>Pandal Management</h1>
        <p>Search a place, confirm its position, then publish a festival-specific record.</p>
      </section>

      <div className={styles.dashboard}>
        {/* Editor Form on Left */}
        <section className={styles.editor}>
          <PandalSearch onPlaceSelected={choosePlace} />
          <div className={styles.mapFrame}>
            <PujaMap
              pandals={pandals}
              selectedId={editing?.id}
              onSelect={(p) => beginEdit(p)}
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
              : "No pin confirmed yet — choose a Google Place or click the map."}
          </p>

          <div className={styles.formGrid}>
            <label>
              Pandal name
              <input
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Ekdalia Evergreen Club"
              />
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
                placeholder="e.g. Ballygunge"
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
          </div>

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.editorActions}>
            <button className={styles.secondary} onClick={reset}>
              Clear
            </button>
            <button className={styles.primary} onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Publish Pandal"}
            </button>
          </div>
        </section>

        {/* Existing Pandals List on Right with Duplicate & Alphabetical Serial Search */}
        <section className={styles.list}>
          <div className={styles.listHeader}>
            <div>
              <p className={styles.eyebrow}>LIVE RECORDS</p>
              <h2>Existing pandals</h2>
            </div>
            <span>{filteredPandals.length}</span>
          </div>

          {/* Search Bar */}
          <div className={styles.searchBar}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search by pandal name, locality..."
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${filterTab === "all" ? styles.filterTabActive : ""}`}
              onClick={() => setFilterTab("all")}
            >
              All ({pandals.length})
            </button>
            <button
              className={`${styles.filterTab} ${filterTab === "duplicates" ? styles.filterTabActive : ""} ${duplicateCount > 0 ? styles.filterTabDupAlert : ""}`}
              onClick={() => setFilterTab("duplicates")}
              title="Show duplicate pandals"
            >
              ⚠️ Duplicates ({duplicateCount})
            </button>
            <button
              className={`${styles.filterTab} ${filterTab === "published" ? styles.filterTabActive : ""}`}
              onClick={() => setFilterTab("published")}
            >
              Published ({pandals.filter((p) => p.status === "published").length})
            </button>
            <button
              className={`${styles.filterTab} ${filterTab === "draft" ? styles.filterTabActive : ""}`}
              onClick={() => setFilterTab("draft")}
            >
              Draft ({pandals.filter((p) => p.status === "draft").length})
            </button>
          </div>

          {/* Sort Controls (Alphabetical Serial Wise Up-to-Down) */}
          <div className={styles.sortControls}>
            <span className={styles.sortLabel}>Alphabetical &amp; Serial:</span>
            <div className={styles.sortButtons}>
              <button
                className={`${styles.sortBtn} ${sortOrder === "alpha-asc" ? styles.sortBtnActive : ""}`}
                onClick={() => setSortOrder("alpha-asc")}
                title="Alphabetical order A to Z"
              >
                🔤 A → Z
              </button>
              <button
                className={`${styles.sortBtn} ${sortOrder === "alpha-desc" ? styles.sortBtnActive : ""}`}
                onClick={() => setSortOrder("alpha-desc")}
                title="Alphabetical order Z to A"
              >
                🔤 Z → A
              </button>
              <button
                className={`${styles.sortBtn} ${sortOrder === "duplicates" ? styles.sortBtnActive : ""}`}
                onClick={() => setSortOrder("duplicates")}
                title="Put duplicate entries at the top"
              >
                ⚠️ Duplicates First
              </button>
            </div>
          </div>

          {/* List items */}
          {filteredPandals.length === 0 && (
            <div className={styles.empty}>
              {filterTab === "duplicates"
                ? "🎉 No duplicate pandals found! All entries are unique."
                : searchQuery
                ? `No pandals found matching "${searchQuery}".`
                : "No pandals in this category."}
            </div>
          )}

          <div className={styles.recordsList}>
            {filteredPandals.map((pandal, idx) => {
              const dup = duplicateMap.get(pandal.id);

              return (
                <article
                  className={`${styles.row} ${dup ? styles.rowDuplicate : ""}`}
                  key={pandal.id}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <span className={styles.serialBadge}>#{idx + 1}</span>
                      <span
                        className={`${styles.status} ${pandal.status === "published" ? styles.published : ""}`}
                      >
                        {pandal.status}
                      </span>
                      {dup && (
                        <span className={styles.duplicateTag}>
                          ⚠️ {dup.reason} ({dup.matchedNames.join(", ")})
                        </span>
                      )}
                    </div>

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
                        if (window.confirm(`Delete ${pandal.name}? This cannot be undone.`))
                          removePandal(pandal.id).catch(() =>
                            setError("Could not delete this pandal.")
                          );
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
