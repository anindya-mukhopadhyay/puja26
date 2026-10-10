"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import type { Pandal } from "@/lib/pandals";
import {
  type GroupMember,
  type GroupStop,
  type PujaGroup,
  generateInviteCode,
  getStoredGroups,
  saveStoredGroups,
  syncGroupToFirestore,
} from "@/lib/groups";
import styles from "./GroupsManager.module.css";

type PlaceLike = {
  id: string;
  name: string;
  locality: string;
  address?: string;
  category: "Pandal" | "Metro" | "Food" | "Toilet" | "Medical" | "Parking";
  latitude?: number;
  longitude?: number;
};

type Props = {
  publishedPandals: Pandal[];
  user: User | null;
  onViewRoute?: (stops: PlaceLike[]) => void;
  onNavigateTab?: (tab: string) => void;
};

export default function GroupsManager({ publishedPandals, user, onViewRoute, onNavigateTab }: Props) {
  const [groups, setGroups] = useState<PujaGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PujaGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteModalGroup, setInviteModalGroup] = useState<PujaGroup | null>(null);

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDate, setNewGroupDate] = useState("Tonight");
  const [selectedInitialPandalId, setSelectedInitialPandalId] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [selectedAddPandalId, setSelectedAddPandalId] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loaded = getStoredGroups();
    setGroups(loaded);
  }, []);

  const persistGroups = (updated: PujaGroup[]) => {
    setGroups(updated);
    saveStoredGroups(updated);
  };

  const handleSelectGroup = (g: PujaGroup) => {
    setSelectedGroup(g);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!newGroupName.trim()) {
      setErrorMsg("Please enter a group name.");
      return;
    }

    const code = generateInviteCode(newGroupName);
    const initialStops: GroupStop[] = [];
    if (selectedInitialPandalId) {
      const match = publishedPandals.find((p) => p.id === selectedInitialPandalId);
      if (match) {
        initialStops.push({
          id: match.id,
          name: match.name,
          locality: match.locality || match.address || "Kolkata",
          latitude: match.latitude,
          longitude: match.longitude,
        });
      }
    }

    const currentUserName = user?.displayName || user?.email?.split("@")[0] || "You";
    const userInitials = (
      (user?.displayName?.split(" ") || []).map((n) => n[0]).join("") ||
      (currentUserName.slice(0, 2) || "ME")
    ).toUpperCase();

    const newGroup: PujaGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      tagline: `${newGroupDate || "Tonight"} · ${initialStops.length} planned stop${initialStops.length === 1 ? "" : "s"}`,
      date: newGroupDate || "Tonight",
      inviteCode: code,
      ownerId: user?.uid,
      members: [
        {
          id: user?.uid || `usr-${Date.now()}`,
          name: currentUserName,
          role: "organizer",
          initials: userInitials,
          lastActive: "Just now",
        },
      ],
      stops: initialStops,
      createdAt: Date.now(),
    };

    const updated = [newGroup, ...groups];
    persistGroups(updated);
    if (user?.uid) syncGroupToFirestore(newGroup, user.uid);

    setSelectedGroup(newGroup);
    setShowCreateModal(false);
    setNewGroupName("");
    setNewGroupDate("Tonight");
    setSelectedInitialPandalId("");
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg("Please enter a valid invite code.");
      return;
    }

    const existing = groups.find((g) => g.inviteCode === cleanCode);
    if (existing) {
      setSelectedGroup(existing);
      setShowJoinModal(false);
      setJoinCodeInput("");
      return;
    }

    // If joining a new group by code
    const currentUserName = user?.displayName || user?.email?.split("@")[0] || "Explorer";
    const joinedGroup: PujaGroup = {
      id: `group-joined-${Date.now()}`,
      name: `Joined Plan (${cleanCode})`,
      tagline: "Tonight · 1 planned stop",
      date: "Tonight",
      inviteCode: cleanCode,
      members: [
        { id: `org-${Date.now()}`, name: "Group Organizer", role: "organizer", initials: "GO", lastActive: "15 min ago" },
        { id: user?.uid || `mem-${Date.now()}`, name: currentUserName, role: "member", initials: "ME", lastActive: "Just now" },
      ],
      stops: [
        {
          id: "pandal-1",
          name: publishedPandals[0]?.name || "Dum Dum Park Sarbojanin Durga Puja Samity",
          locality: publishedPandals[0]?.locality || "Dum Dum Park",
          latitude: publishedPandals[0]?.latitude,
          longitude: publishedPandals[0]?.longitude,
        },
      ],
      createdAt: Date.now(),
    };

    const updated = [joinedGroup, ...groups];
    persistGroups(updated);
    setSelectedGroup(joinedGroup);
    setShowJoinModal(false);
    setJoinCodeInput("");
  };

  const handleAddStopToGroup = () => {
    if (!selectedGroup || !selectedAddPandalId) return;
    const match = publishedPandals.find((p) => p.id === selectedAddPandalId);
    if (!match) return;

    if (selectedGroup.stops.some((s) => s.id === match.id)) {
      alert("This pandal is already in your group plan.");
      return;
    }

    const updatedStops: GroupStop[] = [
      ...selectedGroup.stops,
      {
        id: match.id,
        name: match.name,
        locality: match.locality || match.address || "Kolkata",
        latitude: match.latitude,
        longitude: match.longitude,
      },
    ];

    const updatedGroup: PujaGroup = {
      ...selectedGroup,
      stops: updatedStops,
      tagline: `${selectedGroup.date || "Tonight"} · ${updatedStops.length} planned stop${updatedStops.length === 1 ? "" : "s"}`,
    };

    const updatedList = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    persistGroups(updatedList);
    setSelectedGroup(updatedGroup);
    setSelectedAddPandalId("");
    if (user?.uid) syncGroupToFirestore(updatedGroup, user.uid);
  };

  const handleRemoveStop = (stopId: string) => {
    if (!selectedGroup) return;
    const updatedStops = selectedGroup.stops.filter((s) => s.id !== stopId);
    const updatedGroup: PujaGroup = {
      ...selectedGroup,
      stops: updatedStops,
      tagline: `${selectedGroup.date || "Tonight"} · ${updatedStops.length} planned stop${updatedStops.length === 1 ? "" : "s"}`,
    };
    const updatedList = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    persistGroups(updatedList);
    setSelectedGroup(updatedGroup);
    if (user?.uid) syncGroupToFirestore(updatedGroup, user.uid);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm("Are you sure you want to remove this group plan?")) return;
    const remaining = groups.filter((g) => g.id !== groupId);
    persistGroups(remaining);
    setSelectedGroup(null);
  };

  const handleCopyInviteLink = (group: PujaGroup) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://puja26.com";
    const link = `${origin}?join=${group.inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }).catch(() => {
      prompt("Copy your invite link:", link);
    });
  };

  const handleShareWhatsApp = (group: PujaGroup) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://puja26.com";
    const link = `${origin}?join=${group.inviteCode}`;
    const text = encodeURIComponent(
      `Join our Durga Puja group "${group.name}" on Puja26!\nGroup code: ${group.inviteCode}\nPlan & navigate pandals together:\n${link}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleOpenInRoutes = (group: PujaGroup) => {
    if (!group.stops.length) {
      alert("Please add at least one pandal stop before viewing routes.");
      return;
    }
    const placesToRoute: PlaceLike[] = group.stops.map((s) => ({
      id: s.id,
      name: s.name,
      locality: s.locality,
      category: "Pandal",
      latitude: s.latitude,
      longitude: s.longitude,
    }));
    onViewRoute?.(placesToRoute);
  };

  // If a group is currently selected for details
  if (selectedGroup) {
    return (
      <section className={styles.detailView}>
        <button className={styles.backBtn} onClick={() => setSelectedGroup(null)}>
          ← Back to your groups
        </button>

        <div className={styles.detailHeaderCard}>
          <div className={styles.detailTop}>
            <div>
              <p className={styles.kicker}>GROUP PLAN</p>
              <h2 className={styles.detailTitle}>{selectedGroup.name}</h2>
              <span className={styles.detailCode}>CODE: {selectedGroup.inviteCode}</span>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.secondaryPill}
                onClick={() => setInviteModalGroup(selectedGroup)}
              >
                ⌕ Invite QR
              </button>
              <button
                className={styles.primaryPill}
                onClick={() => handleOpenInRoutes(selectedGroup)}
              >
                Explore Route →
              </button>
            </div>
          </div>
          <p className={styles.groupMeta}>
            {selectedGroup.date} · {selectedGroup.members.length} members · {selectedGroup.stops.length} planned stops
          </p>
        </div>

        {/* Planned Pandal Stops Section */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3>Planned Pandal Stops ({selectedGroup.stops.length})</h3>
            {selectedGroup.stops.length > 0 && (
              <button className={styles.smallAction} onClick={() => handleOpenInRoutes(selectedGroup)}>
                View on Map ↗
              </button>
            )}
          </div>

          <div className={styles.stopsList}>
            {selectedGroup.stops.length === 0 && (
              <p className={styles.groupMeta}>No pandal stops added yet. Choose from published pandals below.</p>
            )}
            {selectedGroup.stops.map((stop, idx) => (
              <div className={styles.stopItem} key={stop.id}>
                <span className={styles.stopIndex}>{idx + 1}</span>
                <div className={styles.stopContent}>
                  <strong>{stop.name}</strong>
                  <span>{stop.locality}</span>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemoveStop(stop.id)}
                  aria-label={`Remove ${stop.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className={styles.addStopBox}>
            <select
              className={styles.selectPandal}
              value={selectedAddPandalId}
              onChange={(e) => setSelectedAddPandalId(e.target.value)}
            >
              <option value="">Choose a live pandal to add...</option>
              {publishedPandals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.locality || "Kolkata"})
                </option>
              ))}
            </select>
            <button
              className={styles.primaryPill}
              onClick={handleAddStopToGroup}
              disabled={!selectedAddPandalId}
            >
              ＋ Add stop
            </button>
          </div>
        </div>

        {/* Members Section */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3>Group Members ({selectedGroup.members.length})</h3>
            <button
              className={styles.smallAction}
              onClick={() => setInviteModalGroup(selectedGroup)}
            >
              ＋ Invite friend
            </button>
          </div>

          <div className={styles.membersList}>
            {selectedGroup.members.map((member) => (
              <div className={styles.memberRow} key={member.id}>
                <div className={styles.memberAvatar}>{member.initials}</div>
                <div className={styles.memberMeta}>
                  <p className={styles.memberName}>{member.name}</p>
                  <p className={styles.memberStatus}>Active {member.lastActive || "Recently"}</p>
                </div>
                {member.role === "organizer" && (
                  <span className={styles.organizerBadge}>Organizer</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delete / Exit */}
        <button
          className={styles.dangerBtn}
          onClick={() => handleDeleteGroup(selectedGroup.id)}
        >
          Remove Group Plan
        </button>

        {/* Invite QR / Link Modal */}
        {inviteModalGroup && renderInviteModal(inviteModalGroup)}
      </section>
    );
  }

  // Helper renderer for invite modal
  function renderInviteModal(group: PujaGroup) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://puja26.com";
    const shareUrl = `${origin}?join=${group.inviteCode}`;

    return (
      <div className={styles.modalBackdrop} onClick={() => setInviteModalGroup(null)}>
        <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <h2>Invite to {group.name}</h2>
          <p>Friends who scan this QR or click your link will instantly join this group plan.</p>

          <div className={styles.qrContainer}>
            <svg
              className={styles.qrSvg}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Group Invite QR Code"
            >
              {/* QR Code Graphic Elements */}
              <rect width="100" height="100" rx="10" fill="#FFF9F0" />
              {/* Top-left marker */}
              <rect x="12" y="12" width="22" height="22" rx="4" fill="#780D19" />
              <rect x="16" y="16" width="14" height="14" rx="2" fill="#FFF9F0" />
              <rect x="20" y="20" width="6" height="6" fill="#780D19" />
              {/* Top-right marker */}
              <rect x="66" y="12" width="22" height="22" rx="4" fill="#780D19" />
              <rect x="70" y="16" width="14" height="14" rx="2" fill="#FFF9F0" />
              <rect x="74" y="20" width="6" height="6" fill="#780D19" />
              {/* Bottom-left marker */}
              <rect x="12" y="66" width="22" height="22" rx="4" fill="#780D19" />
              <rect x="16" y="70" width="14" height="14" rx="2" fill="#FFF9F0" />
              <rect x="20" y="74" width="6" height="6" fill="#780D19" />
              {/* Data blocks */}
              <rect x="42" y="14" width="8" height="8" rx="2" fill="#F5BD32" />
              <rect x="52" y="24" width="8" height="8" rx="2" fill="#780D19" />
              <rect x="42" y="34" width="8" height="8" rx="2" fill="#780D19" />
              <rect x="52" y="44" width="8" height="8" rx="2" fill="#F5BD32" />
              <rect x="22" y="46" width="8" height="8" rx="2" fill="#780D19" />
              <rect x="34" y="56" width="8" height="8" rx="2" fill="#780D19" />
              <rect x="46" y="66" width="8" height="8" rx="2" fill="#F5BD32" />
              <rect x="66" y="46" width="8" height="8" rx="2" fill="#780D19" />
              <rect x="78" y="56" width="8" height="8" rx="2" fill="#F5BD32" />
              <rect x="66" y="76" width="8" height="8" rx="2" fill="#780D19" />
              <rect x="76" y="80" width="8" height="8" rx="2" fill="#780D19" />
              {/* Center festival star motif */}
              <circle cx="50" cy="50" r="10" fill="#780D19" />
              <circle cx="50" cy="50" r="4" fill="#F5BD32" />
            </svg>

            <span className={styles.codeBadgeBig}>{group.inviteCode}</span>
          </div>

          <div className={styles.shareUrlBox}>
            <input className={styles.shareUrlInput} readOnly value={shareUrl} />
            <button className={styles.copyBtn} onClick={() => handleCopyInviteLink(group)}>
              {copyFeedback ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>

          <button className={styles.whatsappBtn} onClick={() => handleShareWhatsApp(group)}>
            <span>💬</span> Share via WhatsApp
          </button>

          <div className={styles.modalButtons}>
            <button className={styles.cancelBtn} onClick={() => setInviteModalGroup(null)}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Groups Listing View
  return (
    <section className={styles.container}>
      <p className={styles.kicker}>MAKE A PLAN TOGETHER</p>
      <h1 className={styles.title}>
        Your <em>groups</em>
      </h1>

      <div className={styles.actionRow}>
        <button className={styles.createButton} onClick={() => setShowCreateModal(true)}>
          <span>＋</span> Create a group
        </button>
        <button className={styles.joinButton} onClick={() => setShowJoinModal(true)}>
          Join with code
        </button>
      </div>

      <div className={styles.groupList}>
        {groups.map((group) => (
          <article
            className={styles.groupCard}
            key={group.id}
            onClick={() => handleSelectGroup(group)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSelectGroup(group);
            }}
          >
            <div className={styles.groupArt}>✦</div>
            <div className={styles.groupInfo}>
              <span className={styles.groupBadge}>
                {group.members.length} MEMBER{group.members.length === 1 ? "" : "S"}
              </span>
              <h2 className={styles.groupName}>{group.name}</h2>
              <p className={styles.groupMeta}>{group.tagline || `${group.date} · ${group.stops.length} stops`}</p>
            </div>
            <span className={styles.arrowIcon}>›</span>
          </article>
        ))}
      </div>

      {/* Invite Friends Banner */}
      <div className={styles.inviteSection}>
        <strong>Invite friends with a link or QR</strong>
        <p>Links can be shared across WhatsApp or scanned directly. Group members can sync locations and pandal stops.</p>
        <button
          className={styles.inviteActionBtn}
          onClick={() => {
            if (groups.length > 0) setInviteModalGroup(groups[0]);
            else setShowCreateModal(true);
          }}
        >
          Create invite
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2>Create New Group Plan</h2>
            <p>Coordinate pandal visits and share routes with friends and family.</p>

            <form onSubmit={handleCreateGroup}>
              <div className={styles.field}>
                <label>Group Name *</label>
                <input
                  required
                  placeholder="e.g. North Kolkata Pandal Hoppers"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label>When are you going?</label>
                <input
                  placeholder="e.g. Tonight, Saptami Night, Ashtami Morning"
                  value={newGroupDate}
                  onChange={(e) => setNewGroupDate(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>First Pandal Stop (Optional)</label>
                <select
                  value={selectedInitialPandalId}
                  onChange={(e) => setSelectedInitialPandalId(e.target.value)}
                >
                  <option value="">Select a published pandal...</option>
                  {publishedPandals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.locality || "Kolkata"})
                    </option>
                  ))}
                </select>
              </div>

              {errorMsg && <p style={{ color: "#a81c1c", fontSize: "11px", margin: "6px 0" }}>{errorMsg}</p>}

              <div className={styles.modalButtons}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group with Code Modal */}
      {showJoinModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowJoinModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2>Join a Group</h2>
            <p>Enter the invite code shared by your friend (e.g. PUJA26-KOL78).</p>

            <form onSubmit={handleJoinGroup}>
              <div className={styles.field}>
                <label>Invite Code</label>
                <input
                  required
                  placeholder="e.g. PUJA26-KOL78"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  style={{ textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700" }}
                  autoFocus
                />
              </div>

              {errorMsg && <p style={{ color: "#a81c1c", fontSize: "11px", margin: "6px 0" }}>{errorMsg}</p>}

              <div className={styles.modalButtons}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite QR / Link Modal */}
      {inviteModalGroup && renderInviteModal(inviteModalGroup)}
    </section>
  );
}
