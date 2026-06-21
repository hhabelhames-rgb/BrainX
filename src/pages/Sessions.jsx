import { useState, useEffect } from "react";
import { sessionsApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { X, Check, XCircle, Video } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Sessions({ t }) {
  const { user } = useAuth();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
  });

  const pad = (n) => String(n).padStart(2, "0");

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchSessions = () => {
    sessionsApi.getAll().then(({ data }) => setSessions(data.data.sessions)).catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const eventsMap = {};
  sessions.forEach((s) => {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!eventsMap[key]) eventsMap[key] = [];
    eventsMap[key].push(s);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  return (
    <div className="bx-content fade-in">
      <div className="cal-card lift-card">
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
          <span className="cal-month">{monthName} {year}</span>
          <button className="cal-nav-btn" onClick={goToday}>↺</button>
        </div>

        <div className="cal-grid">
          {DAYS.map((d) => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}

          {cells.map((d, i) => {
            const key = d ? `${year}-${pad(month + 1)}-${pad(d)}` : null;
            const evs = key && eventsMap[key];

            return (
              <div key={i} className="cal-cell">
                {d && <div className="cal-day-num">{d}</div>}

                {evs &&
                  evs.map((s) => (
                    <div
                      key={s._id}
                      className={`cal-event ${s.status === "confirmed" ? "confirmed" : ""}`}
                      onClick={() => setSelectedSession(s)}
                    >
                      {new Date(s.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <br />
                      {s.skill}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {selectedSession && (
        <div className="modal-backdrop" onClick={() => setSelectedSession(null)}>
          <div className="booking-modal fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSession(null)}>
              <X size={20} />
            </button>
            <h3>{t.sessionDetails}</h3>
            <div style={{ margin: "20px 0" }}>
              <p><strong>{t.skillLabel}</strong> {selectedSession.skill}</p>
              <p><strong>{t.statusLabel}</strong> {selectedSession.status.toUpperCase()}</p>
              <p>
                <strong>{t.with} </strong>{" "}
                {selectedSession.teacher._id === user._id
                  ? selectedSession.learner.fullName
                  : selectedSession.teacher.fullName}
              </p>
              <p>
                <strong>{t.dateTime}</strong>{" "}
                {new Date(selectedSession.date).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p><strong>{t.durationLabel}</strong> {selectedSession.duration} {t.mins}</p>
            </div>

            {selectedSession.status === "confirmed" && selectedSession.meetingLink && (
              <a
                href={selectedSession.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="primary-action-btn"
                style={{ display: "flex", justifyContent: "center", textDecoration: "none" }}
              >
                <Video size={18} /> {t.joinMeeting}
              </a>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              {selectedSession.status === "pending" && selectedSession.teacher._id?.toString() === user._id?.toString() && (
                <button
                  className="confirm-booking-btn"
                  style={{ background: "#4ade80", color: "#000" }}
                  onClick={async () => {
                    try {
                      await sessionsApi.accept(selectedSession._id);
                      toast.success("Session accepted!");
                      setSelectedSession(null);
                      fetchSessions();
                    } catch (err) {
                      toast.error("Failed to accept");
                    }
                  }}
                >
                  <Check size={18} /> {t.accept}
                </button>
              )}

              {["pending", "confirmed"].includes(selectedSession.status) && (
                <button
                  className="confirm-booking-btn"
                  style={{ background: "#ef4444" }}
                  onClick={async () => {
                    const isRefusing = selectedSession.status === "pending" && selectedSession.teacher._id === user._id;
                    if (!window.confirm(`Are you sure you want to ${isRefusing ? 'refuse' : 'cancel'}?`)) return;
                    try {
                      await sessionsApi.cancel(selectedSession._id, isRefusing ? "Refused by teacher" : "Cancelled by user");
                      toast.success(`Session ${isRefusing ? 'refused' : 'cancelled'}!`);
                      setSelectedSession(null);
                      fetchSessions();
                    } catch (err) {
                      toast.error(`Failed to ${isRefusing ? 'refuse' : 'cancel'}`);
                    }
                  }}
                >
                  <XCircle size={18} /> {selectedSession.status === "pending" && selectedSession.teacher._id === user._id ? t.refuse : t.cancel}
                </button>
              )}
              
              {selectedSession.status === "confirmed" && selectedSession.teacher._id?.toString() === user._id?.toString() && (
                <button
                  className="confirm-booking-btn"
                  style={{ background: "#3b82f6" }}
                  onClick={async () => {
                    try {
                      await sessionsApi.complete(selectedSession._id);
                      toast.success("Session marked as complete!");
                      setSelectedSession(null);
                      fetchSessions();
                    } catch (err) {
                      toast.error("Failed to mark complete");
                    }
                  }}
                >
                  <Check size={18} /> {t.markComplete}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}