import {
  Users,
  BookOpen,
  GraduationCap,
  Star,
  Flame,
  CalendarClock,
  MessageCircle,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { sessionsApi, matchesApi, notificationsApi } from "../api/api";

export default function Dashboard({ t, setPage }) {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);

  useEffect(() => {
    sessionsApi
      .getAll()
      .then(({ data }) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const sorted = (data.data.sessions || [])
          .filter((s) => ["pending", "confirmed"].includes(s.status) && new Date(s.date) >= now)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 2);
        setUpcoming(sorted);
      })
      .catch(console.error);

    // Match count
    matchesApi
      .getAll()
      .then(({ data }) => setMatchCount((data.data.matches || []).length))
      .catch(console.error);

    // Recent notifications (for "Today" activity panel)
    notificationsApi
      .getAll()
      .then(({ data }) => setRecentNotifs((data.data.notifications || []).slice(0, 3)))
      .catch(console.error);
  }, []);

  return (
    <div className="bx-content fade-in">
      <div className="dash-welcome lift-card">
        <div>
          <h2>Hi {user?.fullName ? user.fullName.split(" ")[0] : "User"}! 👋</h2>
          <p>
            You have {upcoming.length} session{upcoming.length !== 1 ? "s" : ""} this week and {matchCount} new match{matchCount !== 1 ? "es" : ""}. Ready to grow?
          </p>
        </div>

        <button className="primary-action-btn" onClick={() => setPage("browse")}>
          <Search size={18} />
          Browse Skills
        </button>
      </div>

      <div className="dash-stats professional-grid">
        <div className="dash-stat lift-card">
          <div className="dash-stat-info">
            <span className="dash-stat-num">{user?.completedExchanges || 0}</span>
            <span className="dash-stat-label">{t.exchanges}</span>
          </div>
          <Users className="dash-stat-svg" size={28} />
        </div>

        <div className="dash-stat lift-card">
          <div className="dash-stat-info">
            <span className="dash-stat-num">{user?.skillsCanTeach?.length || 0}</span>
            <span className="dash-stat-label">{t.skillsTaught}</span>
          </div>
          <GraduationCap className="dash-stat-svg" size={28} />
        </div>

        <div className="dash-stat lift-card">
          <div className="dash-stat-info">
            <span className="dash-stat-num">{user?.skillsWantToLearn?.length || 0}</span>
            <span className="dash-stat-label">{t.skillsLearning}</span>
          </div>
          <BookOpen className="dash-stat-svg" size={28} />
        </div>

        <div className="dash-stat lift-card accent-stat">
          <div className="dash-stat-info">
            <span className="dash-stat-num">{user?.ratingAverage?.toFixed(1) || '0.0'}</span>
            <span className="dash-stat-label">Rating</span>
          </div>
          <Star className="dash-stat-svg" size={28} />
        </div>
      </div>

      <div className="dash-bottom">
        <div className="dash-sessions-card lift-card">
          <div className="card-title-row">
            <h3>{t.upcomingSessions}</h3>
            <CalendarClock size={21} />
          </div>

          {upcoming.length === 0 ? (
            <p style={{ color: "#94a3b8", padding: "10px 0" }}>No upcoming sessions.</p>
          ) : (
            upcoming.map((s) => {
              const otherUser = s.teacher?._id === user?._id ? s.learner : s.teacher;
              return (
                <div key={s._id} className="next-session-card">
                  <div>
                    <strong>{s.skill}</strong>
                    <p>With {otherUser?.fullName || "—"}</p>
                  </div>
                  <span>
                    {new Date(s.date).toLocaleString([], {
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}

          <button className="secondary-action-btn" onClick={() => setPage("sessions")}>
            {t.viewAll}
          </button>
        </div>

        <div className="dash-today-card lift-card">
          <div className="card-title-row">
            <h3>{t.today}</h3>
            <Flame size={21} />
          </div>

          {/* Live notifications replacing hardcoded items */}
          {matchCount > 0 && (
            <div className="today-item" style={{ cursor: "pointer" }} onClick={() => setPage("matches")}>
              <Users size={18} />
              <span>{matchCount} new skill match{matchCount !== 1 ? "es" : ""} available</span>
            </div>
          )}

          {recentNotifs.map((n) => (
            <div key={n._id} className="today-item">
              <MessageCircle size={18} />
              <span>{n.message || n.text}</span>
            </div>
          ))}

          {matchCount === 0 && recentNotifs.length === 0 && (
            <>
              <div className="today-item">
                <Flame size={18} />
                <span>Add skills to your profile to get matches</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}