import { Star, MapPin, Clock, MessageCircle, UserCheck, CalendarPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { matchesApi, conversationsApi, sessionsApi } from "../api/api";

import { toast } from "react-hot-toast";

export default function Matches({ t }) {
  
  const [matches, setMatches] = useState([]);
  const [bookingUser, setBookingUser] = useState(null);
  const [bookingForm, setBookingForm] = useState({ skill: "", date: "", time: "", duration: "60" });

  useEffect(() => {
    // API returns: { matches: [{ matchId, user, compatibilityScore, matchingSkills, status }] }
    matchesApi.getAll()
      .then(({ data }) => setMatches(data.data.matches || []))
      .catch(console.error);
  }, []);

  const handleConnect = async (otherUserId) => {
    try {
      await conversationsApi.createOrGet(otherUserId);
      toast.success("Conversation created! Check your Messages.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to connect");
    }
  };

  return (
    <div className="bx-content fade-in">
      <div className="matches-header lift-card">
        <div>
          <h2>{t.matches}</h2>
          <p>{t.recommendedMatches}</p>
        </div>
        <UserCheck size={34} />
      </div>

      <div className="matches-grid">
        {matches.length === 0 && (
          <p style={{ color: "#94a3b8" }}>
            {t.noMatchesYet}
          </p>
        )}

        {matches.map((m) => {
          // API shape: { matchId, user (the other person), compatibilityScore, matchingSkills }
          const otherUser = m.user;
          if (!otherUser) return null;

          // Build match reasons from matchingSkills array
          const matchReasons = (m.matchingSkills || [])
            .map((s) => {
              const iTeach = s.direction === "user1_teaches";
              return `${s.skill} (${iTeach ? t.youTeach : t.theyTeach})`;
            })
            .join(", ");

          return (
            <div className="match-card lift-card" key={m.matchId}>
              <div className="match-top">
                <div className="match-avatar" style={{ overflow: "hidden" }}>
                  {otherUser.avatar ? (
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.fullName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    otherUser.fullName?.charAt(0) || "?"
                  )}
                </div>

                <div>
                  <h3>{otherUser.fullName}</h3>
                  <p>{otherUser.role || t.member}</p>
                </div>

                <div className="match-score">{m.compatibilityScore}%</div>
              </div>

              <div className="match-meta">
                <span>
                  <MapPin size={15} /> {otherUser.location || t.earth}
                </span>
                <span>
                  <Star size={15} /> {otherUser.ratingAverage?.toFixed(1) || "0.0"}
                </span>
                <span>
                  <Clock size={15} /> {t.sameTimezone}
                </span>
              </div>

              {matchReasons && (
                <p className="match-reason">{t.matchingSkills} {matchReasons}</p>
              )}

              <div className="match-tags-block">
                <strong>{t.canTeach}</strong>
                <div className="skill-tags">
                  {(otherUser.skillsCanTeach || []).map((x) => (
                    <span className="skill-tag" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              </div>

              <div className="match-tags-block">
                <strong>{t.wantsLearn}</strong>
                <div className="skill-tags">
                  {(otherUser.skillsWantToLearn || []).map((x) => (
                    <span className="skill-tag" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  className="match-connect-btn"
                  style={{ flex: 1 }}
                  onClick={() => handleConnect(otherUser._id)}
                >
                  <MessageCircle size={17} />
                  {t.connect}
                </button>
                <button
                  className="primary-action-btn"
                  style={{ flex: 1, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", borderRadius: "8px", border: "none", cursor: "pointer" }}
                  onClick={() => setBookingUser(otherUser)}
                >
                  <CalendarPlus size={16} /> {t.book}
                </button>
              </div>
            </div>
          );
        })}
      </div>

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