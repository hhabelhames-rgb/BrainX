import { useEffect, useState } from "react";
import { languages } from "../i18n";

const heroImg = "/skill.png";
const logoImg = "/logo.png";

export default function BrainXLanding({ t, lang, setLang, onGetStarted }) {
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".lp-lang-wrap")) setLangOpen(false);
    };

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lp-page fade-in">
      <nav className="lp-nav">
        <img src={logoImg} alt="BrainX" className="lp-nav-logo" />

        <div className="lp-nav-links">
          <button className="lp-nav-link" onClick={() => scrollTo("lp-hero")}>
            {t.home}
          </button>
          <button className="lp-nav-link" onClick={() => scrollTo("lp-about")}>
            {t.about}
          </button>
          <button className="lp-nav-link" onClick={() => scrollTo("lp-contact")}>
            {t.contact}
          </button>
        </div>

        <div className="lp-nav-right">
          <div className="lp-lang-wrap">
            <button
              className="lp-lang-btn"
              onClick={() => setLangOpen((o) => !o)}
            >
              🌐 {languages[lang]} ▾
            </button>

            {langOpen && (
              <div className="lp-lang-dropdown">
                {Object.entries(languages).map(([code, label]) => (
                  <button
                    key={code}
                    className={"lp-lang-opt" + (lang === code ? " sel" : "")}
                    onClick={() => {
                      setLang(code);
                      setLangOpen(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="lp-get-started" onClick={onGetStarted}>
            {t.getStarted}
          </button>
        </div>
      </nav>

      <section id="lp-hero" className="lp-hero fade-in">
        <img src={heroImg} alt="Skills Exchange" className="lp-hero-img" />
      </section>

      <section id="lp-about" className="lp-about fade-in">
        <div className="lp-section-pill">{t.aboutTitle}</div>
        <div className="lp-about-card lift-card">{t.aboutText}</div>
      </section>

      <section id="lp-contact" className="lp-contact fade-in">
        <h2 className="lp-contact-title">{t.contactTitle}</h2>

        <div className="lp-contact-list">
          <div className="lp-contact-item">
            <div className="lp-c-icon gmail">✉️</div>
            <a href="mailto:contact@brainx.com" className="lp-c-link">
              contact@brainx.com
            </a>
          </div>

          <div className="lp-contact-item">
            <div className="lp-c-icon fb">f</div>
            <a
              href="https://www.facebook.com/share/1J5Rudra9P/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-c-link"
            >
              Facebook
            </a>
          </div>

          <div className="lp-contact-item">
            <div className="lp-c-icon ig">◎</div>
            <span className="lp-c-link">{t.instagram}</span>
          </div>
        </div>
      </section>
    </div>
  );
}