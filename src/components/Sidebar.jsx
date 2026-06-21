import {
  LayoutDashboard,
  Search,
  Users,
  MessageCircle,
  CalendarDays,
  User,
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";

import LOGO from "../assets/logo.js";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ t, page, setPage, onExit, open, onToggle }) {
  const { user } = useAuth();
  const nav = user?.isAdmin
    ? [
        { id: "admin", label: t.adminDB || "Admin DB", icon: ShieldCheck },
        { id: "messages", label: t.messages, icon: MessageCircle },
      ]
    : [
        { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
        { id: "browse",    label: t.browse,    icon: Search },
        { id: "matches",   label: t.matches,   icon: Users },
        { id: "messages",  label: t.messages,  icon: MessageCircle },
        { id: "sessions",  label: t.sessions,  icon: CalendarDays },
        { id: "profile",   label: t.profile,   icon: User },
      ];

  return (
    <aside className={"bx-sidebar-clean" + (open ? "" : " closed")}>
      <div className="bx-sidebar-top">
        {open && (
          <button className="bx-sidebar-toggle" onClick={onToggle}>
            <X size={22} />
          </button>
        )}

        <img src={LOGO} alt="BrainX" className="bx-sidebar-clean-logo" />

        {open && (
          <div className="bx-sidebar-clean-brand">
            Brain<span>X</span>
          </div>
        )}
      </div>

      <nav className="bx-sidebar-clean-nav">
        {nav.map((n) => {
          const Icon = n.icon;

          return (
            <button
              key={n.id}
              className={"bx-sidebar-clean-item" + (page === n.id ? " active" : "")}
              onClick={() => setPage(n.id)}
              title={n.label}
            >
              <Icon size={21} />
              {open && <span>{n.label}</span>}
            </button>
          );
        })}
      </nav>

      <button className="bx-sidebar-clean-exit" onClick={onExit} title={t.exit}>
        <LogOut size={21} />
        {open && <span>{t.exit}</span>}
      </button>
    </aside>
  );
}