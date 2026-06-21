import { useEffect, useState } from "react";
import { MapPin, Star, Heart, Eye, CalendarPlus, X, MessageCircle } from "lucide-react";
import { usersApi, sessionsApi, conversationsApi } from "../api/api";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";

export default function BrowseSkills({ t, setPage }) {
  const FILTERS = [t.all, t.languagesFilter, t.programming, t.design, t.music, t.cooking];

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(t.all);
  const [bookingUser, setBookingUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookingForm, setBookingForm] = useState({ skill: "", date: "", time: "", duration: "60" });
  const { isUserOnline } = useSocket();

  useEffect(() => {
    // paginated() returns: { success, message, data: [...users], pagination: {...} }
    // so response.data = { success, message, data: [...], pagination: {...} }
    usersApi.getAll()
      .then(({ data }) => {
        // Support both paginated shape (data.data = array) and legacy shape (data.data.users)
        const list = Array.isArray(data.data) ? data.data : (data.data?.data || data.data?.users || []);
        setUsers(list);
      })
      .catch(console.error);
  }, []);

  const q = search.toLowerCase();

  const filtered = users.filter((u) => {
    const name = u.fullName || "";
    const bio = u.bio || "";
    const role = u.role || "";
    const loc = u.location || "";
    const textMatch =
      name.toLowerCase().includes(q) ||
      role.toLowerCase().includes(q) ||
      loc.toLowerCase().includes(q) ||
      bio.toLowerCase().includes(q) ||
      (u.skillsCanTeach || []).some((x) => x.toLowerCase().includes(q)) ||
      (u.skillsWantToLearn || []).some((x) => x.toLowerCase().includes(q));

    if (activeFilter === t.all) return textMatch;

    const allSkills = [...(u.skillsCanTeach || []), ...(u.skillsWantToLearn || [])].join(" ").toLowerCase();

    const filterMatch =
      activeFilter === t.languagesFilter
        ? /spanish|english|japanese|language|anglais|français|espagnol/.test(allSkills)
        : activeFilter === t.programming
        ? /javascript|react|python|programming/.test(allSkills)
        : activeFilter === t.design
        ? /design|photoshop|illustration|photography/.test(allSkills)
        : activeFilter === t.music
        ? /guitar|music|piano|musique/.test(allSkills)
        : activeFilter === t.cooking
        ? /cooking|cuisine/.test(allSkills)
        : true;

    return textMatch && filterMatch;
  });

  return (
    <div className="bx-content fade-in">
      <div className="browse-search-wrap">
        <span className="browse-search-icon">🔍</span>
        <input
          className="browse-search"
          placeholder={t.searchSkills}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="browse-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={"filter-pill" + (activeFilter === f ? " active" : "")}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="browse-grid">
        {filtered.map((u) => (
          <div key={u._id} className="skill-card lift-card">
            <div className="skill-card-header">
              <div className="skill-card-online">
                <div
                  className="skill-card-online-dot"
                  style={{ background: isUserOnline(u._id) ? "#4ade80" : "#94a3b8" }}
                />
                {isUserOnline(u._id) ? t.online : t.offline}
              </div>

              <img
                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=6366f1&color=fff`}
                alt={u.fullName}
                className="skill-card-photo"
              />

              <button className="skill-card-heart">
                <Heart size={18} />
              </button>
            </div>

            <div>
              <div className="skill-card-name">
                {u.fullName}
                {u.isVerified && <span className="skill-card-verified">✔</span>}
              </div>
              <div className="skill-card-role">{u.role || t.member}</div>
            </div>

            <div className="skill-card-location">
              <span>
                <MapPin size={14} /> {u.location || t.earth}
              </span>
              <span className="skill-card-rating">
                <Star size={14} /> {u.ratingAverage?.toFixed(1) || "0.0"} ({u.ratingCount || 0})
              </span>
            </div>

            <div className="skill-card-bio">{u.bio || t.noBio}</div>

            <div>
              <div className="skill-tags-label">💬 {t.canTeach}</div>
              <div className="skill-tags">
                {(u.skillsCanTeach || []).map((x) => (
                  <span key={x} className="skill-tag">
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="skill-tags-label">🎯 {t.wantsLearn}</div>
              <div className="skill-tags">
                {(u.skillsWantToLearn || []).map((x) => (
                  <span key={x} className="skill-tag">
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div className="skill-exchanges">
              👥 {u.completedExchanges || 0} {t.exchanges}
            </div>

            <div className="skill-card-actions">
              <button className="btn-outline" onClick={() => setProfileUser(u)}>
                <Eye size={15} />
                {t.viewProfile}
              </button>

              <button className="btn-connect" onClick={() => setBookingUser(u)}>
                <CalendarPlus size={15} />
                {t.book}
              </button>
            </div>
          </div>
        ))}
      </div>

      {profileUser && (
        <div className="modal-backdrop" onClick={() => setProfileUser(null)}>
          <div className="booking-modal fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProfileUser(null)}>
              <X size={20} />
            </button>
            <div className="booking-user" style={{ marginBottom: "20px" }}>
              <img
                src={profileUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.fullName)}&background=6366f1&color=fff`}
                alt={profileUser.fullName}
              />
              <div>
                <h3 style={{ fontSize: "1.2rem" }}>{profileUser.fullName}</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{profileUser.role || t.member} • {profileUser.location || t.earth}</p>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "0.85rem", color: "#e2e8f0" }}>
                  <span><Star size={12} style={{ verticalAlign: "middle", color: "#fbbf24" }}/> {profileUser.ratingAverage?.toFixed(1) || "0.0"} {t.rating}</span>
                  <span>👥 {profileUser.completedExchanges || 0} {t.exchanges}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "6px" }}>{t.about}</h4>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.5" }}>{profileUser.bio || t.noBio}</p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "6px" }}>{t.languagesFilter}</h4>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{profileUser.languages?.join(", ") || t.noneListed}</p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                className="primary-action-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setBookingUser(profileUser);
                  setProfileUser(null);
                }}
              >
                <CalendarPlus size={16} /> {t.book}
              </button>
              <button
                className="btn-connect"
                style={{ flex: 1, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "#4f46e5", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}
                onClick={async () => {
                  try {
                    await conversationsApi.createOrGet(profileUser._id);
                    setProfileUser(null);
                    if (setPage) setPage("messages");
                  } catch (err) {
                    toast.error("Could not start conversation");
                  }
                }}
              >
                <MessageCircle size={16} /> {t.connect}
              </button>
            </div>
          </div>
        </div>
      )}

      {bookingUser && (
        <div className="modal-backdrop" onClick={() => setBookingUser(null)}>
          <div
            className="booking-modal fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setBookingUser(null)}>
              <X size={20} />
            </button>

            <div className="booking-user">
              <img
                src={bookingUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(bookingUser.fullName)}&background=6366f1&color=fff`}
                alt={bookingUser.fullName}
              />
              <div>
                <h3>{t.bookSession}</h3>
                <p>{t.with} {bookingUser.fullName}</p>
              </div>
            </div>

            <label>{t.selectSkill}</label>
            <select
              value={bookingForm.skill}
              onChange={(e) => setBookingForm({ ...bookingForm, skill: e.target.value })}
            >
              <option value="">{t.selectSkill}</option>
              {(bookingUser.skillsCanTeach || []).map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>

            <label>{t.date}</label>
            <input
              type="date"
              value={bookingForm.date}
              onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
            />

            <label>{t.time}</label>
            <input
              type="time"
              value={bookingForm.time}
              onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
            />

            <label>{t.duration}</label>
            <select
              value={bookingForm.duration}
              onChange={(e) => setBookingForm({ ...bookingForm, duration: e.target.value })}
            >
              <option value="30">{t.minutes30}</option>
              <option value="45">{t.minutes45}</option>
              <option value="60">{t.minutes60}</option>
            </select>

            <button
              className="confirm-booking-btn"
              onClick={async () => {
                if (!bookingForm.skill || !bookingForm.date || !bookingForm.time) {
                  return toast.error("Please fill all fields");
                }
                try {
                  const dt = new Date(`${bookingForm.date}T${bookingForm.time}`);
                  await sessionsApi.create({
                    teacherId: bookingUser._id,
                    skill: bookingForm.skill,
                    date: dt.toISOString(),
                    duration: parseInt(bookingForm.duration),
                  });
                  toast.success("Session requested!");
                  setBookingUser(null);
                } catch (err) {
                  toast.error(err.response?.data?.message || "Booking failed");
                }
              }}
            >
              {t.confirmBooking}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}