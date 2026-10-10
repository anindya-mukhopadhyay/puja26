"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type Category = "Pandal" | "Metro" | "Food" | "Toilet" | "Medical" | "Parking";
type Place = { id: number; name: string; locality: string; category: Category; rating?: string; reviews?: number; distance: string; color: string; x: number; y: number; facilities: string[]; description: string };

const places: Place[] = [
  { id: 1, name: "Sreebhumi Sporting Club", locality: "Lake Town, Kolkata", category: "Pandal", rating: "4.8", reviews: 248, distance: "1.2 km", color: "#C62828", x: 50, y: 31, facilities: ["Accessible entry", "Drinking water", "First aid"], description: "A celebrated neighbourhood pujo with verified visitor facilities." },
  { id: 2, name: "Mohammad Ali Park", locality: "Central Kolkata", category: "Pandal", rating: "4.7", reviews: 186, distance: "2.6 km", color: "#C62828", x: 22, y: 57, facilities: ["Food nearby", "Rest area"], description: "Festival location added by a verified Puja26 admin." },
  { id: 3, name: "Sovabazar Rajbari", locality: "North Kolkata", category: "Pandal", rating: "4.9", reviews: 319, distance: "3.4 km", color: "#C62828", x: 69, y: 16, facilities: ["Wheelchair access", "Toilets nearby"], description: "Historic pujo with an accessible entrance noted by organisers." },
  { id: 4, name: "Belgachia Metro", locality: "Belgachia", category: "Metro", distance: "0.8 km", color: "#26734D", x: 42, y: 68, facilities: ["Metro", "Auto stand"], description: "Nearest transit connection." },
  { id: 5, name: "Public Drinking Water", locality: "Lake Town", category: "Food", distance: "0.4 km", color: "#F5BD32", x: 77, y: 50, facilities: ["Drinking water"], description: "Public drinking-water point." },
  { id: 6, name: "Public Convenience", locality: "Hatibagan", category: "Toilet", distance: "1.1 km", color: "#5D75A6", x: 35, y: 25, facilities: ["Accessible toilet"], description: "Public facility, hours pending verification." },
];

const nav = [
  ["map", "⌖", "Map"], ["routes", "⌁", "Routes"], ["connect", "◎", "Connect"], ["groups", "♧", "Groups"], ["profile", "◉", "Profile"],
] as const;

function Icon({ children }: { children: React.ReactNode }) { return <span aria-hidden="true" className={styles.icon}>{children}</span>; }

export default function Home() {
  const [active, setActive] = useState("map");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Category | "All">("All");
  const [selected, setSelected] = useState<Place>(places[0]);
  const [saved, setSaved] = useState<number[]>([3]);
  const [route, setRoute] = useState<Place[]>([places[0], places[2]]);
  const [locationNotice, setLocationNotice] = useState(false);
  const [sharing, setSharing] = useState(false);

  const visible = useMemo(() => places.filter((p) => (filter === "All" || p.category === filter) && `${p.name} ${p.locality} ${p.category}`.toLowerCase().includes(query.toLowerCase())), [filter, query]);
  const toggleSaved = (id: number) => setSaved((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);
  const addToRoute = (place: Place) => setRoute((old) => old.some((p) => p.id === place.id) ? old : [...old, place]);

  return <main className={styles.app}>
    <section className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span className={styles.motif}>✦</span><span>puja<span>26</span></span></div>
        <button className={styles.avatar} aria-label="Open profile">AM</button>
      </header>

      {active === "map" && <>
        <div className={styles.hero}><div><p className={styles.kicker}>SHUBHO MAHALAYA</p><h1>Find your <em>pujo.</em></h1><p>Discover pandals, plan your route, and celebrate together.</p></div><div className={styles.diya}>🪔</div></div>
        <div className={styles.searchWrap}>
          <Icon>⌕</Icon><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pandals, metro, toilets, food..." aria-label="Search places" />
          <button onClick={() => setQuery("")} aria-label="Clear search">×</button>
        </div>
        <div className={styles.chips} role="tablist" aria-label="Place categories">
          {(["All", "Pandal", "Metro", "Food", "Toilet", "Medical", "Parking"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? styles.chipActive : ""}>{item === "All" ? "All places" : item === "Pandal" ? "Puja pandals" : item}</button>)}
        </div>
        <div className={styles.mapCard}>
          <div className={styles.mapTexture}></div><span className={`${styles.road} ${styles.roadOne}`}></span><span className={`${styles.road} ${styles.roadTwo}`}></span><span className={`${styles.road} ${styles.roadThree}`}></span>
          <div className={styles.mapLegend}><span><i className={styles.redDot}></i> Pandals</span><span><i className={styles.greenDot}></i> Facilities</span></div>
          {visible.map((place) => <button key={place.id} className={`${styles.pin} ${selected.id === place.id ? styles.selectedPin : ""}`} onClick={() => setSelected(place)} style={{ left: `${place.x}%`, top: `${place.y}%`, background: place.color }} aria-label={`Show ${place.name}`}><span>{place.category === "Pandal" ? "♜" : place.category === "Metro" ? "M" : "●"}</span></button>)}
          <button className={styles.locate} onClick={() => setLocationNotice(true)} aria-label="Use current location">⌖</button>
          <div className={styles.mapLabel}>KOLKATA</div>
          {locationNotice && <div className={styles.toast}>Location access is requested only when you choose it. <button onClick={() => setLocationNotice(false)}>Got it</button></div>}
        </div>
        <article className={styles.placeCard}>
          <div className={styles.placePhoto}><span>দুর্গা</span></div>
          <div className={styles.placeInfo}><div className={styles.placeTop}><div><p className={styles.type}>{selected.category}</p><h2>{selected.name}</h2></div><button className={saved.includes(selected.id) ? styles.saved : ""} onClick={() => toggleSaved(selected.id)} aria-label="Save location">{saved.includes(selected.id) ? "★" : "☆"}</button></div>
          <p className={styles.muted}>{selected.locality} · {selected.distance} away</p>{selected.rating && <p className={styles.rating}>★ {selected.rating} <span>({selected.reviews} reviews)</span></p>}
          <div className={styles.actions}><button className={styles.secondary} onClick={() => addToRoute(selected)}>＋ Add to plan</button><button className={styles.primary} onClick={() => setActive("routes")}>Directions →</button></div></div>
        </article>
        <div className={styles.nearbyHeading}><div><p className={styles.kicker}>EXPLORE NEARBY</p><h2>Worth a visit</h2></div><button>See all</button></div>
        <div className={styles.nearby}>{places.filter((p) => p.category === "Pandal").map((p) => <button key={p.id} className={styles.nearbyCard} onClick={() => setSelected(p)}><div className={styles.tinyPhoto}>✦</div><strong>{p.name}</strong><span>★ {p.rating} · {p.distance}</span></button>)}</div>
      </>}

      {active === "routes" && <section className={styles.screen}><p className={styles.kicker}>YOUR DAY, BEAUTIFULLY PACED</p><h1>Your pujo <em>route</em></h1><p className={styles.intro}>Thursday, 23 October · 2 stops · 4.8 km</p>
        <div className={styles.routeSummary}><span>🚶</span><div><strong>1 hr 18 min</strong><small>Walking estimate · routes need Google setup</small></div><button>⋮</button></div>
        <div className={styles.timeline}>{route.map((p, index) => <div className={styles.stop} key={p.id}><i>{index + 1}</i><div><strong>{p.name}</strong><span>{p.locality}</span><small>{index === 0 ? "Start at 5:30 PM" : "Arrive about 6:10 PM"}</small></div><button onClick={() => setRoute((r) => r.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.name}`}>×</button></div>)}</div>
        <button className={styles.addStop} onClick={() => setActive("map")}>＋ Add another stop</button>
        <div className={styles.weather}><span>☂</span><div><strong>Rain may arrive after 8 PM</strong><p>Forecast will appear once a weather provider is configured.</p></div></div>
        <button className={styles.primaryWide}>Open in Google Maps ↗</button>
      </section>}

      {active === "connect" && <section className={styles.screen}><p className={styles.kicker}>EXPLORE TOGETHER, ON YOUR TERMS</p><h1>Stay in <em>sync.</em></h1><div className={styles.connectCard}><span className={styles.bigIcon}>⌖</span><h2>Share live location</h2><p>Only people in your group can see your location, and only while you choose to share it.</p><button className={sharing ? styles.stopShare : styles.primaryWide} onClick={() => setSharing(!sharing)}>{sharing ? "Stop sharing" : "Start sharing"}</button>{sharing && <small className={styles.live}>● Sharing is on — accuracy and last update will show here.</small>}</div><h2 className={styles.sectionTitle}>With your group</h2><div className={styles.member}><span>SR</span><div><strong>Riya Sen</strong><small>Last seen 4 min ago</small></div><button>Message</button></div></section>}

      {active === "groups" && <section className={styles.screen}><p className={styles.kicker}>MAKE A PLAN TOGETHER</p><h1>Your <em>groups</em></h1><div className={styles.groupCard}><div className={styles.groupArt}>✦</div><div><span>4 MEMBERS</span><h2>Pujo 2026</h2><p>Tonight · 2 planned stops</p></div><button>›</button></div><button className={styles.addStop}>＋ Create a group</button><div className={styles.invite}><strong>Invite friends with a link or QR</strong><p>Links can be revoked at any time. Personal details remain private.</p><button className={styles.secondary}>Create invite</button></div></section>}

      {active === "profile" && <section className={styles.screen}><div className={styles.profileHead}><div className={styles.profileAvatar}>AM</div><div><p className={styles.kicker}>WELCOME BACK</p><h1>Anindya</h1><span>Guest-ready profile</span></div></div><div className={styles.stats}><div><strong>{saved.length}</strong><span>Saved</span></div><div><strong>0</strong><span>Visited</span></div><div><strong>1</strong><span>Groups</span></div></div><div className={styles.settings}><button>♡ Saved pandals <span>›</span></button><button>◷ Visit history <span>›</span></button><button>⚙ Account & privacy <span>›</span></button><button>↪ Sign in to sync <span>›</span></button></div></section>}

      <nav className={styles.nav} aria-label="Main navigation">{nav.map(([id, glyph, label]) => <button key={id} onClick={() => setActive(id)} className={active === id ? styles.activeNav : ""}><Icon>{glyph}</Icon><span>{label}</span></button>)}</nav>
    </section>
  </main>;
}
