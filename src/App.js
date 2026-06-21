import { useEffect, useState } from "react";
import BrainXLanding from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Shell from "./components/Shell";
import { translations } from "./i18n";
import { useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./styles.css";

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("landing");
  const [lang, setLang] = useState(() => localStorage.getItem("brainx-lang") || "en");

  useEffect(() => {
    if (user) setPage("app");
    else if (page === "app") setPage("landing");
  }, [user]);

  const t = translations[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("brainx-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  if (loading) {
    return <div className="app-root fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white' }}>Loading...</div>;
  }

  return (
    <div className="app-root" lang={lang} dir={dir}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      {page === "landing" && (
        <BrainXLanding
          t={t}
          lang={lang}
          setLang={setLang}
          onGetStarted={() => setPage("auth")}
        />
      )}

      {page === "auth" && (
        <AuthPage
          t={t}
          onLogin={() => setPage("app")}
          onBack={() => setPage("landing")}
        />
      )}

      {page === "app" && (
        <Shell
          t={t}
          lang={lang}
          setLang={setLang}
          onExit={() => setPage("landing")}
        />
      )}
    </div>
  );
}