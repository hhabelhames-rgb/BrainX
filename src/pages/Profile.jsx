import { useState, useEffect } from "react";
import { Star, MapPin, Languages, BadgeCheck, MessageCircle, Edit2, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { reviewsApi, usersApi } from "../api/api";
import { toast } from "react-hot-toast";

export default function Profile({ t }) {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState("about");
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    location: "",
    languages: "",
    skillsCanTeach: "",
    skillsWantToLearn: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && tab === "reviews") {
      reviewsApi.getByUser(user._id).then(({ data }) => setReviews(data.data.reviews || [])).catch(console.error);
    }
  }, [user, tab]);

  const startEditing = () => {
    setForm({
      fullName: user.fullName || "",
      bio: user.bio || "",
      location: user.location || "",
      languages: (user.languages || []).join(", "),
      skillsCanTeach: (user.skillsCanTeach || []).join(", "),
      skillsWantToLearn: (user.skillsWantToLearn || []).join(", "),
    });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        languages: form.languages.split(",").map(s => s.trim()).filter(Boolean),
        skillsCanTeach: form.skillsCanTeach.split(",").map(s => s.trim()).filter(Boolean),
        skillsWantToLearn: form.skillsWantToLearn.split(",").map(s => s.trim()).filter(Boolean),
      };
      const { data } = await usersApi.updateProfile(payload);
      updateUser(data.data.user);
      setTab("about");
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const { data } = await usersApi.uploadAvatar(formData);
      updateUser({ avatar: data.data.avatarUrl });
      toast.success("Profile photo updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await usersApi.removeAvatar();
      updateUser({ avatar: null });
      toast.success("Profile photo removed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove photo");
    }
  };

  if (!user) return null;

  return (
    <div className="bx-content fade-in">
      <div className="profile-header-card profile-pro-card lift-card">
        {user.avatar ? (
          <img className="profile-avatar-photo real-photo" src={user.avatar} alt={user.fullName} />
        ) : (
          <div className="profile-avatar-photo real-photo" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", background: "#334155" }}>
            {user.fullName.charAt(0)}
          </div>
        )}

        <div className="profile-main-info">
          <div className="profile-name-row">
            <div className="profile-name">{user.fullName}</div>
            {user.isVerified && <BadgeCheck size={21} />}
          </div>

          <p className="profile-role">{user.role || "Member"}</p>

          <div className="profile-meta-row">
            <span>
              <MapPin size={15} /> {user.location || "Earth"}
            </span>

            <span>
              <Star size={15} /> {user.ratingAverage?.toFixed(1) || "0.0"} rating
            </span>

            {user.languages?.length > 0 && (
              <span>
                <Languages size={15} /> {user.languages.join(" · ")}
              </span>
            )}
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={"profile-tab" + (tab === "about" ? " active" : "")}
            onClick={() => setTab("about")}
          >
            {t.about}
          </button>

          <button
            className={"profile-tab" + (tab === "skills" ? " active" : "")}
            onClick={() => setTab("skills")}
          >
            {t.skills}
          </button>

          <button
            className={"profile-tab" + (tab === "reviews" ? " active" : "")}
            onClick={() => setTab("reviews")}
          >
            Reviews
          </button>

          <button
            className={"profile-tab" + (tab === "edit" ? " active" : "")}
            onClick={() => { setTab("edit"); startEditing(); }}
          >
            <Edit2 size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Edit
          </button>
        </div>
      </div>

      {tab === "about" && (
        <div className="profile-about-card lift-card">
          <h3>{t.about}</h3>
          <p>{user.bio || "No bio added yet."}</p>

          <div className="profile-badges">
            {user.completedExchanges >= 5 && <span>Top Exchanger</span>}
            {user.ratingAverage >= 4.8 && <span>Highly Rated</span>}
            <span>{user.completedExchanges || 0} Completed Exchanges</span>
          </div>
        </div>
      )}

      {tab === "skills" && (
        <div className="profile-skills-row">
          <div className="profile-skill-card lift-card">
            <h4>{t.whatTeach}</h4>
            <div className="skill-tags">
              {user.skillsCanTeach.map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
              {user.skillsCanTeach.length === 0 && <span style={{ color: "#94a3b8" }}>None listed</span>}
            </div>
          </div>

          <div className="profile-skill-card selected lift-card">
            <h4>{t.whatLearn}</h4>
            <div className="skill-tags">
              {user.skillsWantToLearn.map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
              {user.skillsWantToLearn.length === 0 && <span style={{ color: "#94a3b8" }}>None listed</span>}
            </div>
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <div className="reviews-grid">
          {reviews.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="review-card lift-card">
                <div className="review-top">
                  <div className="review-stars">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                  <span>{r.rating.toFixed(1)}</span>
                </div>

                <p>{r.comment}</p>

                <div className="review-author">
                  <MessageCircle size={15} />
                  {r.reviewer?.fullName || "Anonymous"}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "edit" && (
        <div className="profile-about-card lift-card">
          <h3>Edit Profile</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "0.82rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Profile Photo</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ color: "#cbd5e1" }}
                />
                {user.avatar && (
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ color: "#ef4444", borderColor: "#ef4444", padding: "4px 8px", fontSize: "0.8rem" }}
                    onClick={handleRemoveAvatar}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Full Name</label>
              <input
                className="browse-search"
                style={{ width: "100%", boxSizing: "border-box" }}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Bio</label>
              <textarea
                className="browse-search"
                style={{ width: "100%", boxSizing: "border-box", minHeight: "80px", resize: "vertical" }}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Location</label>
              <input
                className="browse-search"
                style={{ width: "100%", boxSizing: "border-box" }}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Languages <span style={{ opacity: 0.6 }}>(comma-separated)</span>
              </label>
              <input
                className="browse-search"
                placeholder="English, French, Spanish"
                style={{ width: "100%", boxSizing: "border-box" }}
                value={form.languages}
                onChange={(e) => setForm({ ...form, languages: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Skills I Can Teach <span style={{ opacity: 0.6 }}>(comma-separated)</span>
              </label>
              <input
                className="browse-search"
                placeholder="Guitar, Python, Photography"
                style={{ width: "100%", boxSizing: "border-box" }}
                value={form.skillsCanTeach}
                onChange={(e) => setForm({ ...form, skillsCanTeach: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Skills I Want to Learn <span style={{ opacity: 0.6 }}>(comma-separated)</span>
              </label>
              <input
                className="browse-search"
                placeholder="React, French, Cooking"
                style={{ width: "100%", boxSizing: "border-box" }}
                value={form.skillsWantToLearn}
                onChange={(e) => setForm({ ...form, skillsWantToLearn: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                className="primary-action-btn"
                onClick={saveProfile}
                disabled={saving}
              >
                <Check size={16} />
                {saving ? "Saving…" : "Save Changes"}
              </button>

              <button
                className="secondary-action-btn"
                onClick={() => setTab("about")}
                disabled={saving}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}