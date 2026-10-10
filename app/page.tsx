"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import styles from "./page.module.css";
import PujaMap from "@/components/PujaMap";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { signOutUser } from "@/lib/auth";
import { type Pandal, subscribeToPublishedPandals } from "@/lib/pandals";
import GroupsManager from "@/components/GroupsManager";

type Category = "Pandal" | "Metro" | "Food" | "Toilet" | "Medical" | "Parking";
type Place = {
  id: string;
  name: string;
  locality: string;
  address?: string;
  category: Category;
  rating?: string;
  reviews?: number;
  distance: string;
  color: string;
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
  facilities: string[];
  description: string;
};

const samplePlaces: Place[] = [
  { id: "sample-1", name: "Sreebhumi Sporting Club", locality: "Lake Town, Kolkata", category: "Pandal", rating: "4.8", reviews: 248, distance: "1.2 km", color: "#C62828", x: 50, y: 31, facilities: ["Accessible entry", "Drinking water", "First aid"], description: "A celebrated neighbourhood pujo with verified visitor facilities." },
  { id: "sample-2", name: "Mohammad Ali Park", locality: "Central Kolkata", category: "Pandal", rating: "4.7", reviews: 186, distance: "2.6 km", color: "#C62828", x: 22, y: 57, facilities: ["Food nearby", "Rest area"], description: "Festival location added by a verified Puja26 admin." },
  { id: "sample-3", name: "Sovabazar Rajbari", locality: "North Kolkata", category: "Pandal", rating: "4.9", reviews: 319, distance: "3.4 km", color: "#C62828", x: 69, y: 16, facilities: ["Wheelchair access", "Toilets nearby"], description: "Historic pujo with an accessible entrance noted by organisers." },
  { id: "sample-4", name: "Belgachia Metro", locality: "Belgachia", category: "Metro", distance: "0.8 km", color: "#26734D", x: 42, y: 68, facilities: ["Metro", "Auto stand"], description: "Nearest transit connection." },
  { id: "sample-5", name: "Public Drinking Water", locality: "Lake Town", category: "Food", distance: "0.4 km", color: "#F5BD32", x: 77, y: 50, facilities: ["Drinking water"], description: "Public drinking-water point." },
  { id: "sample-6", name: "Public Convenience", locality: "Hatibagan", category: "Toilet", distance: "1.1 km", color: "#5D75A6", x: 35, y: 25, facilities: ["Accessible toilet"], description: "Public facility, hours pending verification." },
];

const fallbackPandal = (place: Place): Pandal => ({ id: place.id, name: place.name, address: place.locality, locality: place.locality, latitude: 22.5726 + (place.y - 50) / 300, longitude: 88.3639 + (place.x - 50) / 300, status: "published", createdBy: "sample" });

const placeFromPandal = (pandal: Pandal): Place => ({
  id: pandal.id,
  name: pandal.name,
  locality: pandal.locality || pandal.address || "Kolkata",
  address: pandal.address,
  category: "Pandal",
  rating: "4.8",
  reviews: 180,
  distance: "Published Pandal",
  color: "#C62828",
  x: 50,
  y: 50,
  latitude: pandal.latitude,
  longitude: pandal.longitude,
  facilities: ["Verified Pandal", "Confirmed Location"],
  description: pandal.description || (pandal.address ? `Address: ${pandal.address}` : "Published by a verified Puja26 administrator.")
});

const nav = [
  ["map", "⌖", "Map"], ["routes", "⌁", "Routes"], ["connect", "◎", "Connect"], ["groups", "♧", "Groups"], ["profile", "◉", "Profile"],
] as const;

function Icon({ children }: { children: React.ReactNode }) { return <span aria-hidden="true" className={styles.icon}>{children}</span>; }

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState("map");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Category | "All">("All");
  const [saved, setSaved] = useState<string[]>([]);
  const [route, setRoute] = useState<Place[]>([]);
  const [sharing, setSharing] = useState(false);
  const [livePandals, setLivePandals] = useState<Pandal[]>([]);
  const [mapDataError, setMapDataError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (current) => setUser(current));
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return subscribeToPublishedPandals(
      (pandals) => {
        setLivePandals(pandals);
        setMapDataError("");
      },
      (err) => setMapDataError(`Pandal updates: ${err}`)
    );
  }, []);

  const livePlaces = useMemo<Place[]>(() => {
    return livePandals.map((pandal, idx) => ({
      id: pandal.id,
      name: pandal.name,
      locality: pandal.locality || pandal.address || "Kolkata",
      address: pandal.address,
      category: "Pandal",
      rating: (4.7 + ((idx % 3) * 0.1)).toFixed(1),
      reviews: 140 + idx * 35,
      distance: "Live location",
      color: "#C62828",
      x: 50,
      y: 50,
      latitude: pandal.latitude,
      longitude: pandal.longitude,
      facilities: ["Verified Pandal", "Confirmed Coordinates"],
      description: pandal.description || (pandal.address ? `Address: ${pandal.address}` : "Official published festival pandal.")
    }));
  }, [livePandals]);

  const allPlaces = useMemo<Place[]>(() => {
    if (livePlaces.length > 0) {
      const nonPandalUtilities = samplePlaces.filter((p) => p.category !== "Pandal");
      return [...livePlaces, ...nonPandalUtilities];
    }
    return samplePlaces;
  }, [livePlaces]);

  const [selected, setSelected] = useState<Place>(samplePlaces[0]);

  useEffect(() => {
    if (livePlaces.length > 0) {
      setSelected((prev) => {
        if (!livePlaces.some((p) => p.id === prev.id)) {
          return livePlaces[0];
        }
        return prev;
      });
    }
  }, [livePlaces]);

  const userInitials = useMemo(() => {
    if (!user) return "AM";
    const name = user.displayName || user.email || "";
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || "AM").toUpperCase();
  }, [user]);

  const visible = useMemo(() => allPlaces.filter((p) => (filter === "All" || p.category === filter) && `${p.name} ${p.locality} ${p.category}`.toLowerCase().includes(query.toLowerCase())), [allPlaces, filter, query]);
  const toggleSaved = (id: string) => setSaved((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);
  const addToRoute = (place: Place) => setRoute((old) => old.some((p) => p.id === place.id) ? old : [...old, place]);

  return <main className={styles.app}>
    <section className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span className={styles.motif}>✦</span><span>puja<span>26</span></span></div>
        <button className={styles.avatar} onClick={() => setActive("profile")} aria-label="Open profile">{userInitials}</button>
      </header>

      {active === "map" && <>
        <div className={styles.hero}><div><p className={styles.kicker}>SHUBHO MAHALAYA</p><h1>Find your <em>pujo.</em></h1><p>Discover pandals, plan your route, and celebrate together.</p></div><div className={styles.diya}>🪔</div></div>
        <div className={styles.searchWrap}>
          <Icon>⌕</Icon><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pandals, metro, toilets, food..." aria-label="Search places" />
          <button onClick={() => setQuery("")} aria-label="Clear search">×</button>
        </div>
        <div className={styles.chips} role="tablist" aria-label="Place categories">
          {(["All", "Pandal", "Metro", "Food", "Toilet", "Medical", "Parking"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? styles.chipActive : ""}>{item === "All" ? "All places" : item === "Pandal" ? `Puja pandals (${livePandals.length || "Live"})` : item}</button>)}
        </div>
        <div className={styles.mapCard}>
          <PujaMap
            pandals={livePandals.length > 0 ? livePandals : visible.map(fallbackPandal)}
            selectedId={selected.id}
            onSelect={(pandal) => {
              const matched = allPlaces.find((p) => p.id === pandal.id);
              setSelected(matched || placeFromPandal(pandal));
            }}
          />
          <div className={styles.mapLegend}><span><i className={styles.redDot}></i> Published pandals ({livePandals.length})</span><span><i className={styles.greenDot}></i> Live updates</span></div>
          {mapDataError && <div className={styles.toast}>{mapDataError}<button onClick={() => setMapDataError("")}>Dismiss</button></div>}
        </div>
        <article className={styles.placeCard}>
          <div className={styles.placePhoto}><span>দুর্গা</span></div>
          <div className={styles.placeInfo}><div className={styles.placeTop}><div><p className={styles.type}>{selected.category}</p><h2>{selected.name}</h2></div><button className={saved.includes(selected.id) ? styles.saved : ""} onClick={() => toggleSaved(selected.id)} aria-label="Save location">{saved.includes(selected.id) ? "★" : "☆"}</button></div>
          <p className={styles.muted}>{selected.locality} · {selected.distance}</p>{selected.rating && <p className={styles.rating}>★ {selected.rating} <span>({selected.reviews} reviews)</span></p>}
          <div className={styles.actions}><button className={styles.secondary} onClick={() => addToRoute(selected)}>＋ Add to plan</button><button className={styles.primary} onClick={() => setActive("routes")}>Directions →</button></div></div>
        </article>
        <div className={styles.nearbyHeading}><div><p className={styles.kicker}>EXPLORE PUJOS</p><h2>Published Pandals</h2></div><button onClick={() => setFilter("Pandal")}>See all</button></div>
        <div className={styles.nearby}>{allPlaces.filter((p) => p.category === "Pandal").map((p) => <button key={p.id} className={styles.nearbyCard} onClick={() => setSelected(p)}><div className={styles.tinyPhoto}>✦</div><strong>{p.name}</strong><span>★ {p.rating} · {p.locality}</span></button>)}</div>
      </>}

      {active === "routes" && <section className={styles.screen}><p className={styles.kicker}>YOUR DAY, BEAUTIFULLY PACED</p><h1>Your pujo <em>route</em></h1><p className={styles.intro}>Thursday, 23 October · 2 stops · 4.8 km</p>
        <div className={styles.routeSummary}><span>🚶</span><div><strong>1 hr 18 min</strong><small>Walking estimate · routes need Google setup</small></div><button>⋮</button></div>
        <div className={styles.timeline}>{route.map((p, index) => <div className={styles.stop} key={p.id}><i>{index + 1}</i><div><strong>{p.name}</strong><span>{p.locality}</span><small>{index === 0 ? "Start at 5:30 PM" : "Arrive about 6:10 PM"}</small></div><button onClick={() => setRoute((r) => r.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.name}`}>×</button></div>)}</div>
        <button className={styles.addStop} onClick={() => setActive("map")}>＋ Add another stop</button>
        <div className={styles.weather}><span>☂</span><div><strong>Rain may arrive after 8 PM</strong><p>Forecast will appear once a weather provider is configured.</p></div></div>
        <button className={styles.primaryWide} onClick={() => {
          if (route.length === 0) {
            alert("Please add at least one pandal stop to your route first.");
            return;
          }
          const destination = encodeURIComponent(route[route.length - 1].name + ", " + (route[route.length - 1].locality || "Kolkata"));
          const waypoints = route.slice(0, -1).map(r => encodeURIComponent(r.name + ", " + (r.locality || "Kolkata"))).join("|");
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}`, "_blank");
        }}>Open in Google Maps ↗</button>
      </section>}

      {active === "connect" && <section className={styles.screen}>
        <p className={styles.kicker}>EXPLORE TOGETHER, ON YOUR TERMS</p>
        <h1>Stay in <em>sync.</em></h1>
        <div className={styles.connectCard}>
          <span className={styles.bigIcon}>⌖</span>
          <h2>Share live location</h2>
          <p>Only people in your group can see your location, and only while you choose to share it.</p>
          <button
            className={sharing ? styles.stopShare : styles.primaryWide}
            onClick={() => {
              if (!sharing) {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    () => setSharing(true),
                    () => setSharing(true)
                  );
                } else {
                  setSharing(true);
                }
              } else {
                setSharing(false);
              }
            }}
          >
            {sharing ? "Stop sharing" : "Start sharing"}
          </button>
          {sharing && <small className={styles.live}>● Live location sharing active — visible to your Pujo 2026 group members.</small>}
        </div>
        <h2 className={styles.sectionTitle}>With your group</h2>
        <div className={styles.member}>
          <span>RS</span>
          <div>
            <strong>Riya Sen</strong>
            <small>Active 4 min ago · Lake Town</small>
          </div>
          <button onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent("Hey! Where are you at for Pujo hopping?"), "_blank")}>
            Message
          </button>
        </div>
        <button className={styles.secondary} style={{ width: "100%", marginTop: "10px" }} onClick={() => setActive("groups")}>
          Manage Groups & Members →
        </button>
      </section>}

      {active === "groups" && (
        <GroupsManager
          publishedPandals={livePandals}
          user={user}
          onViewRoute={(stops) => {
            setRoute(stops as Place[]);
            setActive("routes");
          }}
          onNavigateTab={setActive}
        />
      )}

      {active === "profile" && <section className={styles.screen}>
        <div className={styles.profileHead}>
          <div className={styles.profileAvatar}>{userInitials}</div>
          <div>
            <p className={styles.kicker}>{user ? "SIGNED IN USER" : "GUEST EXPLORER"}</p>
            <h1>{user ? (user.displayName || user.email?.split("@")[0] || "Explorer") : "Guest User"}</h1>
            <span>{user ? `● ${user.email}` : "Local visitor mode"}</span>
          </div>
        </div>
        <div className={styles.stats}>
          <div><strong>{saved.length}</strong><span>Saved</span></div>
          <div><strong>0</strong><span>Visited</span></div>
          <div><strong>1</strong><span>Groups</span></div>
        </div>
        <div className={styles.settings}>
          <button>♡ Saved pandals <span>›</span></button>
          <button>◷ Visit history <span>›</span></button>
          <button>⚙ Account & privacy <span>›</span></button>
          {user ? (
            <button onClick={async () => { await signOutUser(); }} style={{ color: "#a22525", fontWeight: 700 }}>
              ↪ Sign out <span>›</span>
            </button>
          ) : (
            <button onClick={() => router.push("/login")} style={{ fontWeight: 700, color: "#780d19" }}>
              ↪ Sign in or Create Account to sync <span>›</span>
            </button>
          )}
          <button onClick={() => router.push("/admin/login")}>
            ✦ Organizer & Admin Portal <span>›</span>
          </button>
        </div>
      </section>}

      <nav className={styles.nav} aria-label="Main navigation">{nav.map(([id, glyph, label]) => <button key={id} onClick={() => setActive(id)} className={active === id ? styles.activeNav : ""}><Icon>{glyph}</Icon><span>{label}</span></button>)}</nav>
    </section>
  </main>;
}
