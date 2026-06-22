import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { GoogleLogin } from '@react-oauth/google';

export default function AuthPage({ t, onLogin, onBack }) {
  const { login, register, googleLogin } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    skills: "",
  });

  const ch = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    try {
      if (tab === "login") {
        await login(form.email, form.password);
        toast.success("Logged in successfully!");
      } else {
        const skillsArray = form.skills.split(',').map(s => s.trim()).filter(Boolean);
        await register({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          skillsCanTeach: skillsArray,
        });
        toast.success("Account created! Check email to verify if required, or you may be logged in.");
      }
      onLogin(); // App.js will also auto-redirect because user state updates
    } catch (err) {
      const data = err.response?.data;
      const errorMsg = data?.errors?.[0]?.msg || data?.errors?.[0]?.message || data?.message || "Authentication failed";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card lift-card">
        <button onClick={onBack} className="auth-back">
          ← {t.back}
        </button>

        <div className="auth-tabs">
          <button
            className={"auth-tab" + (tab === "login" ? " active" : "")}
            onClick={() => setTab("login")}
          >
            {t.login}
          </button>

          <button
            className={"auth-tab" + (tab === "signup" ? " active" : "")}
            onClick={() => setTab("signup")}
          >
            {t.signup}
          </button>
        </div>

        <div className="auth-google">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await googleLogin(credentialResponse.credential);
                toast.success("Logged in with Google!");
                onLogin();
              } catch (err) {
                toast.error("Google authentication failed");
              }
            }}
            onError={() => {
              toast.error("Google Login Failed");
            }}
            theme="outline"
            size="large"
            width="100%"
            text={tab === "login" ? "signin_with" : "signup_with"}
          />
        </div>
        
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <div className="auth-fields">
          {tab === "signup" && (
            <div>
              <label className="auth-label">{t.fullName}</label>
              <input
                className="auth-input"
                name="fullName"
                placeholder={t.fullNamePlaceholder}
                value={form.fullName}
                onChange={ch}
              />
            </div>
          )}

          <div>
            <label className="auth-label">{t.email}</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder={t.emailPlaceholder}
              value={form.email}
              onChange={ch}
            />
          </div>

          <div>
            <label className="auth-label">{t.password}</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder={t.passwordPlaceholder}
              value={form.password}
              onChange={ch}
            />
          </div>

          {tab === "signup" && (
            <div>
              <label className="auth-label">{t.skills}</label>
              <textarea
                className="auth-textarea"
                name="skills"
                placeholder={t.skillsPlaceholder}
                value={form.skills}
                onChange={ch}
              />
            </div>
          )}
        </div>

        <button className="auth-submit" onClick={handleSubmit}>
          {tab === "login" ? t.login : t.signup}
        </button>
      </div>
    </div>
  );
}