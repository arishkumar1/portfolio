import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import AssetImage from "../components/AssetImage";
import { downloadAssetUrl, staticAssetFallback } from "../utils/assetUrl";
import RevealCard from "../components/RevealCard";

const sections = [
  "about",
  "skills",
  "projects",
  "experience",
  "education",
  "certificates",
];
const HOME_CACHE_KEY = "portfolio-home-v1";
function readHomeCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || "null");
    return cached?.data && Date.now() - cached.savedAt < 24 * 60 * 60 * 1000
      ? cached.data
      : null;
  } catch {
    return null;
  }
}
function writeHomeCache(data) {
  try {
    localStorage.setItem(
      HOME_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
  } catch {}
}
const externalUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`,
    );
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
};
export default function Home() {
  const [data, setData] = useState(() => readHomeCache()),
    [error, setError] = useState(""),
    [resumeError, setResumeError] = useState(""),
    projectsRef = useRef(null);
  useEffect(() => {
    let active = true,
      idleId = null,
      timerId = null;
    const controller = new AbortController();
    const loadSections = () =>
      sections.forEach((key) => {
        api
          .get("/" + key, { signal: controller.signal })
          .then(({ data: sectionData }) => {
            if (!active) return;
            setData((current) => {
              if (!current) return current;
              const next = {
                ...current,
                sections: { ...current.sections, [key]: sectionData },
              };
              writeHomeCache(next);
              return next;
            });
          })
          .catch(() => {});
      });
    api
      .get("/profile", { signal: controller.signal })
      .then(({ data: profile }) => {
        if (!active) return;
        setError("");
        setData((current) => {
          const next = { profile, sections: current?.sections || {} };
          writeHomeCache(next);
          return next;
        });
        if ("requestIdleCallback" in window)
          idleId = window.requestIdleCallback(loadSections, { timeout: 700 });
        else timerId = window.setTimeout(loadSections, 80);
      })
      .catch((err) => {
        if (active && !readHomeCache())
          setError(
            `Unable to load portfolio: ${
              err.response?.data?.message ||
              `Cannot reach the API at ${api.defaults.baseURL}. Start the server and confirm its database connection.`
            }`,
          );
      });
    return () => {
      active = false;
      controller.abort();
      if (idleId !== null && "cancelIdleCallback" in window)
        window.cancelIdleCallback(idleId);
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, []);
  useEffect(() => {
    if (!data) return;
    const node = projectsRef.current;
    if (!node) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect(),
          vh = window.innerHeight,
          progress = Math.max(
            0,
            Math.min(1, (vh - rect.top) / (vh + rect.height)),
          );
        node.style.setProperty("--infinity-x", `${(progress - 0.5) * 140}px`);
        node.style.setProperty(
          "--infinity-y",
          `${Math.sin(progress * Math.PI * 2) * 26}px`,
        );
        node.style.setProperty(
          "--infinity-rotate",
          `${(progress - 0.5) * 34}deg`,
        );
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [data]);
  if (error)
    return (
      <div className="portfolio-home">
        <main className="wrap portfolio-error" role="alert">
          <p className="section-kicker">PORTFOLIO</p>
          <h1>Unable to load the portfolio</h1>
          <p>{error}</p>
        </main>
      </div>
    );
  if (!data)
    return (
      <div className="portfolio-home loading-home">
        <header className="nav">
          <span className="loading-brand" />
          <nav>
            <i />
            <i />
            <i />
            <i />
          </nav>
        </header>
        <main id="top">
          <section
            className="hero wrap loading-hero"
            aria-label="Loading portfolio"
          >
            <div className="hero-orbit" aria-hidden="true">
              <span />
              <i />
              <b />
            </div>
            <span className="loading-avatar" />
            <i className="loading-bar loading-kicker" />
            <i className="loading-bar loading-title" />
            <i className="loading-bar loading-copy" />
            <i className="loading-bar loading-action" />
            <span className="scroll-cue">
              <i /> LOADING PORTFOLIO
            </span>
          </section>
          <section className="wrap portfolio-section">
            <p className="section-kicker">A MOMENT PLEASE</p>
            <div className="grid skeleton-grid" aria-hidden="true">
              {[0, 1].map((i) => (
                <div className="skeleton-card" key={i}>
                  <i />
                  <b />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  const p = data.profile,
    items = data.sections,
    title = (s) => s[0].toUpperCase() + s.slice(1);
  async function downloadResume(event) {
    event.preventDefault();
    setResumeError("");
    const primary = downloadAssetUrl(p?.resume),
      fallback = staticAssetFallback(p?.resume);
    let destination = "";
    if (primary) {
      try {
        const response = await fetch(primary, { method: "HEAD" });
        if (response.ok) destination = primary;
      } catch {}
    }
    if (!destination && fallback) {
      try {
        const response = await fetch(fallback, { method: "HEAD" });
        if (response.ok) destination = fallback;
      } catch {}
    }
    if (!destination && !fallback && primary) destination = primary;
    if (!destination) {
      setResumeError(
        "The resume file could not be found. Please contact the site owner.",
      );
      return;
    }
    const filename = decodeURIComponent(
      new URL(destination, window.location.origin).pathname.split("/").pop() ||
        "resume.pdf",
    );
    const link = document.createElement("a");
    link.href = destination;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  return (
    <div className="portfolio-home">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />
      <header className="nav">
        <a href="#top">{p?.name || "Portfolio"}</a>
        <nav>
          {[
            "about",
            "skills",
            "projects",
            "experience",
            "education",
            "certificates",
            "contact",
          ].map((s) => (
            <a key={s} href={"#" + s}>
              {title(s)}
            </a>
          ))}
          <a href="/admin/login">Admin</a>
        </nav>
      </header>
      <main id="top">
        <section className="hero wrap">
          <div className="hero-orbit" aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
          {p?.photo && (
            <AssetImage
              className="avatar"
              value={p.photo}
              alt={p.name || "Profile"}
              fallbackLabel="PROFILE PHOTO UNAVAILABLE"
              width="168"
              height="168"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          )}
          <p className="eyebrow">
            <i /> {p?.title || "PERSONAL PORTFOLIO"}
          </p>
          <h1>{p?.name || "Nothing added yet"}</h1>
          <p className="hero-intro">{p?.intro || ""}</p>
          {p?.resume && (
            <>
              <a
                className="button"
                href={downloadAssetUrl(p.resume)}
                onClick={downloadResume}
              >
                Download resume <span>↓</span>
              </a>
              {resumeError && (
                <p className="resume-error" role="alert">
                  {resumeError}
                </p>
              )}
            </>
          )}
          <p className="hero-socials">
            {(p?.socialLinks || []).map((x) => {
              const href = externalUrl(x.url);
              return href ? (
                <a
                  className="social"
                  key={x.label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {x.label} ↗
                </a>
              ) : null;
            })}
          </p>
          <a className="scroll-cue" href="#projects">
            <span /> SCROLL TO EXPLORE
          </a>
        </section>
        <div className="portfolio-marquee" aria-hidden="true">
          <div>
            {[
              "BUILD WITH PURPOSE",
              "DESIGN FOR PEOPLE",
              "AUTOMATE THE BORING",
              "BUILD WITH PURPOSE",
              "DESIGN FOR PEOPLE",
              "AUTOMATE THE BORING",
            ].map((x, i) => (
              <span key={i}>
                {x}
                <i>✳</i>
              </span>
            ))}
          </div>
        </div>
        <section id="about" className="wrap portfolio-section about-section">
          <p className="section-kicker">01 / A LITTLE ABOUT ME</p>
          <h2>
            Thoughtful work.
            <br />
            <em>Lasting impact.</em>
          </h2>
          <p className="section-lede">
            {items.about
              ? items.about.content || "Nothing added yet"
              : "Loading about…"}
          </p>
        </section>
        {sections.slice(1).map((s) => (
          <section
            id={s}
            className={`wrap portfolio-section${
              s === "projects" ? " projects-section" : ""
            }`}
            key={s}
            ref={s === "projects" ? projectsRef : null}
          >
            <div className="section-heading">
              <div>
                <p className="section-kicker">
                  {s === "projects"
                    ? "02 / SELECTED WORK"
                    : `/ ${title(s).toUpperCase()}`}
                </p>
                <h2>
                  {s === "projects" ? (
                    <>
                      Things I’ve <em>built.</em>
                    </>
                  ) : (
                    title(s)
                  )}
                </h2>
              </div>
              {s === "projects" && (
                <p className="section-lede">
                  A few projects shaped by curiosity, engineering, and a love of
                  solving real problems.
                </p>
              )}
            </div>
            {s === "projects" && (
              <>
                <svg
                  className="infinity-mark"
                  viewBox="0 0 500 230"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M250 115C215 75 180 28 127 28 72 28 30 66 30 115s42 87 97 87c53 0 88-47 123-87Zm0 0c35 40 70 87 123 87 55 0 97-38 97-87s-42-87-97-87c-53 0-88 47-123 87Z" />
                  <circle cx="30" cy="115" r="7" />
                  <circle cx="470" cy="115" r="7" />
                </svg>
                <span className="devops-stamp">
                  <i /> DEVOPS · BUILD · SHIP · REPEAT
                </span>
              </>
            )}
            {Array.isArray(items[s]) && items[s].length ? (
              <div
                className={`grid${s === "projects" ? " projects-grid" : ""}`}
              >
                {items[s].map((x, i) => {
                  const image = x.image || x.photo;
                  return (
                    <RevealCard
                      className={`card portfolio-card${
                        s === "projects" ? " project-card" : ""
                      }`}
                      direction={
                        s === "projects" ? (i % 2 === 0 ? "left" : "right") : ""
                      }
                      key={x._id}
                    >
                      {(image || s === "projects") && (
                        <div className="project-image-wrap">
                          {image ? (
                            <AssetImage
                              value={image}
                              alt={x.title || "Project image"}
                              fallbackLabel="PROJECT IMAGE UNAVAILABLE"
                              loading="lazy"
                              decoding="async"
                              fallback={
                                <div
                                  className="project-placeholder"
                                  aria-hidden="true"
                                >
                                  <span>
                                    {(x.techStack || [])
                                      .slice(0, 3)
                                      .join(" / ") || "FULL STACK · DEVOPS"}
                                  </span>
                                  <i>∞</i>
                                  <b>IMAGE UNAVAILABLE</b>
                                </div>
                              }
                            />
                          ) : (
                            <div
                              className="project-placeholder"
                              aria-hidden="true"
                            >
                              <span>
                                {(x.techStack || []).slice(0, 3).join(" / ") ||
                                  "FULL STACK · DEVOPS"}
                              </span>
                              <i>∞</i>
                              <b>ENGINEERED TO EVOLVE</b>
                            </div>
                          )}
                          {s === "projects" && (
                            <span className="image-index">0{i + 1}</span>
                          )}
                        </div>
                      )}
                      <div className="portfolio-card-copy">
                        <p className="card-overline">
                          {s === "projects"
                            ? "PROJECT / " + String(i + 1).padStart(2, "0")
                            : title(s)}
                        </p>
                        <h3>{x.title || x.name || x.category}</h3>
                        <p className="preline">
                          {s === "skills"
                            ? x.category
                            : x.description ||
                              x.institution ||
                              x.organization ||
                              ""}
                        </p>
                        {s === "skills" && <p>{x.level}</p>}
                        {x.techStack?.length > 0 && (
                          <p className="tech-stack">
                            {x.techStack.join(" · ")}
                          </p>
                        )}
                        <div className="links">
                          {externalUrl(x.github) && (
                            <a
                              href={externalUrl(x.github)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              GitHub <span>↗</span>
                            </a>
                          )}
                          {externalUrl(x.live) && (
                            <a
                              href={externalUrl(x.live)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Live project <span>↗</span>
                            </a>
                          )}
                          {externalUrl(x.url) && (
                            <a
                              href={externalUrl(x.url)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Certificate <span>↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </RevealCard>
                  );
                })}
              </div>
            ) : Array.isArray(items[s]) ? (
              <p className="muted">Nothing added yet</p>
            ) : (
              <div
                className={`grid section-skeleton${
                  s === "projects" ? " projects-grid" : ""
                }`}
                aria-label={`Loading ${s}`}
              >
                {[0, 1].map((i) => (
                  <div className="skeleton-card" key={i}>
                    <i />
                    <b />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        <section
          id="contact"
          className="wrap portfolio-section contact-section"
        >
          <p className="section-kicker">LET’S CONNECT</p>
          <h2>
            Have a good one
            <br />
            <em>in mind?</em>
          </h2>
          <p>
            {p?.email || ""} {p?.location || ""}
          </p>
          <Contact />
        </section>
      </main>
      <footer className="wrap portfolio-footer">
        © {new Date().getFullYear()} {p?.name || ""}
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </div>
  );
}

function Contact() {
  const [status, setStatus] = useState("");
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await api.post("/messages", Object.fromEntries(new FormData(form)));
      setStatus("Message sent.");
      form.reset();
    } catch (err) {
      setStatus(err.response?.data?.message || "Unable to send message.");
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <input name="name" placeholder="Your name" required maxLength="100" />
      <input
        name="email"
        type="email"
        placeholder="Your email"
        required
        maxLength="200"
      />
      <textarea
        name="content"
        placeholder="Your message"
        required
        maxLength="5000"
      />
      <button>Send message</button>
      <p>{status}</p>
    </form>
  );
}
