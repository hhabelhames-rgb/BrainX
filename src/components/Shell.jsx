import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Sidebar from "./Sidebar";
import Dashboard from "../pages/Dashboard";
import BrowseSkills from "../pages/BrowseSkills";
import Messages from "../pages/Messages";
import Sessions from "../pages/Sessions";
import Profile from "../pages/Profile";
import Matches from "../pages/Matches";
import Admin from "../pages/Admin";
import { notificationsApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Shell({ t, lang, setLang, onExit }) {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [page, setPage] = useState(user?.isAdmin ? "admin" : "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationsApi.getAll();
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      } catch (err) {
        console.error("Failed to fetch notifications");
      }
    };
    fetchNotifications();

    if (socket) {
      socket.on("notification", (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((c) => c + 1);
      });
    }

    const closeNotifications = (e) => {
      if (!e.target.closest(".notif-wrap")) setNotifOpen(false);
    };
    document.addEventListener("click", closeNotifications);

    return () => {
      document.removeEventListener("click", closeNotifications);
      if (socket) socket.off("notification");
    };
  }, [socket]);

  const titles = {
    dashboard: t.dashboard,
    browse: t.browse,
    matches: t.matches,
    messages: t.messages,
    sessions: t.sessions,
    profile: t.profile,
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    onExit();
  };

  return (
    <div className="bx-shell fade-in">
      <Sidebar
        t={t}
        page={page}
        setPage={setPage}
        onExit={handleLogout}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="bx-main">
        <div className="bx-topbar">
          {!sidebarOpen && (
            <button
              className="bx-hamburger"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          )}

          <span className="bx-topbar-title">{titles[page]}</span>

          <div className="bx-topbar-actions">
            <div className="notif-wrap">
              <button
                className="bx-icon-btn"
                title={t.notifications}
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifOpen((o) => !o);
                }}
              >
                <Bell size={20} />

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="notif-panel fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="notif-header">
                    <h3>{t.notifications}</h3>

                    <button onClick={markAllRead}>
                      {t.markAllRead}
                    </button>
                  </div>

                  <div className="notif-list">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={"notif-item" + (!n.read ? " unread" : "")}
                      >
                        <span className="notif-status">
                          {!n.read ? "●" : "✓"}
                        </span>

                        <div>
                          <p>{n.message || n.text}</p>
                          <small>{new Date(n.createdAt).toLocaleString()}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <select
              className="bx-lang-icon-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="ar">AR</option>
            </select>

            <button
              className="bx-topbar-avatar profile-photo-mini"
              onClick={() => setPage("profile")}
              title={t.profile}
              style={{ backgroundImage: user?.avatar ? `url(${user.avatar})` : 'none' }}
            >
              {!user?.avatar && user?.fullName?.charAt(0)}
            </button>
          </div>
        </div>

        {page === "dashboard" && <Dashboard t={t} setPage={setPage} />}
        {page === "browse"    && <BrowseSkills t={t} setPage={setPage} />}
        {page === "matches"   && <Matches t={t} />}
        {page === "messages"  && <Messages t={t} />}
        {page === "sessions"  && <Sessions t={t} />}
        {page === "profile"   && <Profile t={t} />}
        {page === "admin"     && <Admin t={t} />}
      </div>
    </div>
  );
}