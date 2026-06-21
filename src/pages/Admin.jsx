import React, { useEffect, useState } from "react";
import { adminApi } from "../api/api";
import { Users, CalendarDays, Star, Flag, BarChart3, ShieldCheck, ShieldOff, Trash2, RefreshCw, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Admin({ t }) {
  const TABS = [
    { id: "stats",    label: t?.overview || "Overview",  icon: BarChart3 },
    { id: "users",    label: t?.users || "Users",     icon: Users },
    { id: "sessions", label: t?.sessions || "Sessions",  icon: CalendarDays },
    { id: "reviews",  label: t?.reviews || "Reviews",   icon: Star },
    { id: "reports",  label: t?.reports || "Reports",   icon: Flag },
  ];
  const [tab, setTab]         = useState("stats");
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [expandedUser, setExpandedUser] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === "stats") {
        const { data } = await adminApi.getStats();
        setStats(data.data);
      } else if (tab === "users") {
        const { data } = await adminApi.getUsers({ search, limit: 50 });
        setUsers(data.data.users || []);
      } else if (tab === "sessions") {
        const { data } = await adminApi.getSessions();
        setSessions(data.data.sessions || []);
      } else if (tab === "reviews") {
        const { data } = await adminApi.getReviews();
        setReviews(data.data.reviews || []);
      } else if (tab === "reports") {
        const { data } = await adminApi.getReports();
        setReports(data.data.reports || []);
      }
    } catch (err) {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [tab]);

  const handleBlock = async (id, isBlocked) => {
    try {
      if (isBlocked) await adminApi.unblockUser(id);
      else await adminApi.blockUser(id);
      toast.success(isBlocked ? "User unblocked" : "User blocked");
      load();
    } catch { toast.error("Action failed"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await adminApi.deleteUser(id);
      toast.success("User deleted");
      load();
    } catch { toast.error("Delete failed"); }
  };

  const badge = (val, color = "#6366f1") => (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 10px", fontSize: "0.78rem", fontWeight: 600,
    }}>{val}</span>
  );

  const statusColor = (s) =>
    s === "confirmed" ? "#4ade80" : s === "completed" ? "#6366f1" :
    s === "cancelled" ? "#ef4444" : "#f59e0b";

  return (
    <div className="bx-content fade-in">
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 24,
        border: "1px solid #312e81", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#e2e8f0" }}>🛡️ {t?.adminDB || "Admin Panel"}</h2>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.88rem" }}>Database viewer & management</p>
        </div>
        <button
          onClick={load}
          style={{ background: "#6366f1", border: "none", color: "white", borderRadius: 10,
            padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? "#6366f1" : "#1e293b",
            color: tab === id ? "white" : "#94a3b8",
            border: `1px solid ${tab === id ? "#6366f1" : "#334155"}`,
            borderRadius: 10, padding: "8px 18px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: "0.88rem",
            transition: "all 0.2s",
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ color: "#94a3b8", padding: "40px 0", textAlign: "center" }}>Loading…</div>
      )}

      {/* ── STATS ── */}
      {!loading && tab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { label: t?.totalUsers || "Total Users",    value: stats.users?.total,    color: "#6366f1", icon: "👤" },
            { label: "Active (30d)",   value: stats.users?.active,   color: "#4ade80", icon: "🟢" },
            { label: "Verified",       value: stats.users?.verified, color: "#38bdf8", icon: "✅" },
            { label: "Blocked",        value: stats.users?.blocked,  color: "#ef4444", icon: "🚫" },
            { label: t?.activeSessions || "Total Sessions", value: stats.sessions?.total,    color: "#f59e0b", icon: "📅" },
            { label: "Completed",      value: stats.sessions?.completed, color: "#4ade80", icon: "✔️" },
            { label: t?.messages || "Messages",       value: stats.messages?.total, color: "#a78bfa", icon: "💬" },
            { label: t?.reports || "Reports",        value: stats.reports?.total,  color: "#fb7185", icon: "🚩" },
            { label: t?.avgRating || "Avg Rating",     value: stats.avgRating + " ⭐", color: "#fbbf24", icon: "⭐" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="lift-card" style={{
              background: "#0f172a", border: `1px solid ${color}33`,
              borderRadius: 14, padding: "20px 24px",
            }}>
              <div style={{ fontSize: "1.8rem" }}>{icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color, marginTop: 8 }}>{value ?? "—"}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── USERS ── */}
      {!loading && tab === "users" && (
        <>
          <input
            className="browse-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            style={{ marginBottom: 16 }}
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#1e293b", color: "#94a3b8" }}>
                  {["Avatar", "Name", "Email", "Role", "Verified", "Blocked", "Exchanges", "Joined", t?.actions || "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <React.Fragment key={u._id}>
                    <tr style={{ borderBottom: "1px solid #1e293b" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=6366f1&color=fff`}
                          alt={u.fullName}
                          style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
                        />
                      </td>
                      <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{u.fullName}</td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{u.email}</td>
                      <td style={{ padding: "10px 14px" }}>{badge(u.isAdmin ? "admin" : "user", u.isAdmin ? "#f59e0b" : "#6366f1")}</td>
                      <td style={{ padding: "10px 14px" }}>{u.isVerified ? badge("✓ Yes", "#4ade80") : badge("No", "#94a3b8")}</td>
                      <td style={{ padding: "10px 14px" }}>{u.isBlocked ? badge("Blocked", "#ef4444") : badge("Active", "#4ade80")}</td>
                      <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>{u.completedExchanges || 0}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setExpandedUser(expandedUser === u._id ? null : u._id)}
                            title="View Details"
                            style={{ background: "#3b82f622", border: "none", borderRadius: 6,
                              padding: "5px 10px", cursor: "pointer", color: "#3b82f6", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}
                          >
                            <Eye size={15} /> View
                          </button>
                          <button
                            onClick={() => handleBlock(u._id, u.isBlocked)}
                            title={u.isBlocked ? (t?.unblock || "Unblock") : (t?.block || "Block")}
                            style={{ background: u.isBlocked ? "#4ade8022" : "#ef444422", border: "none", borderRadius: 6,
                              padding: "5px 8px", cursor: "pointer", color: u.isBlocked ? "#4ade80" : "#ef4444" }}
                          >
                            {u.isBlocked ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            title="Delete"
                            style={{ background: "#ef444422", border: "none", borderRadius: 6,
                              padding: "5px 8px", cursor: "pointer", color: "#ef4444" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedUser === u._id && (
                      <tr style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
                        <td colSpan="9" style={{ padding: "20px 24px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                            <div>
                              <h4 style={{ color: "#e2e8f0", margin: "0 0 12px", fontSize: "0.95rem" }}>Profile Summary</h4>
                              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 8px" }}><strong>Bio:</strong> {u.bio || "No bio provided."}</p>
                              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 8px" }}><strong>Location:</strong> {u.location || "Unknown"}</p>
                              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 8px" }}><strong>Languages:</strong> {u.languages?.length ? u.languages.join(", ") : "None"}</p>
                            </div>
                            <div>
                              <h4 style={{ color: "#e2e8f0", margin: "0 0 12px", fontSize: "0.95rem" }}>Skills & Ratings</h4>
                              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 8px" }}><strong>Can Teach:</strong> {u.skillsCanTeach?.length ? u.skillsCanTeach.join(", ") : "None"}</p>
                              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 8px" }}><strong>Wants to Learn:</strong> {u.skillsWantToLearn?.length ? u.skillsWantToLearn.join(", ") : "None"}</p>
                              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 8px" }}><strong>Rating:</strong> {u.ratingAverage} ⭐ ({u.ratingCount} reviews)</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p style={{ color: "#94a3b8", padding: "20px 0" }}>{t?.noDataAvailable || "No users found."}</p>}
          </div>
        </>
      )}

      {/* ── SESSIONS ── */}
      {!loading && tab === "sessions" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#1e293b", color: "#94a3b8" }}>
                {["Skill", "Teacher", "Learner", "Status", "Date", "Duration"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{s.skill}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.teacher?.fullName}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.learner?.fullName}</td>
                  <td style={{ padding: "10px 14px" }}>{badge(s.status, statusColor(s.status))}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(s.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.duration} min</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && <p style={{ color: "#94a3b8", padding: "20px 0" }}>No sessions found.</p>}
        </div>
      )}

      {/* ── REVIEWS ── */}
      {!loading && tab === "reviews" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {reviews.map((r) => (
            <div key={r._id} className="lift-card" style={{
              background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 18,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#fbbf24", fontSize: "1.1rem" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p style={{ color: "#e2e8f0", margin: "0 0 12px", fontSize: "0.88rem", lineHeight: 1.5 }}>"{r.comment}"</p>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                <span style={{ color: "#94a3b8" }}>By:</span> {r.reviewer?.fullName || "?"} →{" "}
                <span style={{ color: "#94a3b8" }}>To:</span> {r.reviewedUser?.fullName || "?"}
              </div>
            </div>
          ))}
          {reviews.length === 0 && <p style={{ color: "#94a3b8" }}>No reviews found.</p>}
        </div>
      )}

      {/* ── REPORTS ── */}
      {!loading && tab === "reports" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#1e293b", color: "#94a3b8" }}>
                {["Reporter", "Reported User", "Reason", "Status", "Date"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r._id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{r.reporter?.fullName}</td>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{r.reportedUser?.fullName}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8", maxWidth: 220 }}>{r.reason}</td>
                  <td style={{ padding: "10px 14px" }}>{badge(r.status || "pending", r.status === "resolved" ? "#4ade80" : "#f59e0b")}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && <p style={{ color: "#94a3b8", padding: "20px 0" }}>No reports found.</p>}
        </div>
      )}
    </div>
  );
}
