import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Cloud,
  Container,
  GitBranch,
  Server,
  Activity,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AssetImage from "../../components/AssetImage";
import RevealCard from "../../components/RevealCard";

const fields = {
  profile: [
    "name",
    "title",
    "intro",
    "email",
    "location",
    "photo",
    "resume",
    "socialLinks",
  ],
  about: ["content"],
  skills: ["name", "category", "level"],
  projects: ["title", "description", "techStack", "image", "github", "live"],
  experience: ["title", "organization", "description", "startDate", "endDate"],
  education: ["title", "institution", "description", "startDate", "endDate"],
  certificates: [
    "title",
    "organization",
    "description",
    "image",
    "url",
    "date",
  ],
  messages: [],
};
const labels = {
  profile: "Profile / Hero",
  about: "About",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  certificates: "Certificates",
  messages: "Messages",
};

export default function Dashboard() {
  const [counts, setCounts] = useState({}),
    { logout, user } = useAuth(),
    go = useNavigate(),
    loc = useLocation(),
    section = loc.pathname.split("/")[2] || "";
  useEffect(() => {
    Promise.all(
      ["projects", "skills", "messages"].map((x) => api.get("/admin/" + x)),
    )
      .then((rs) =>
        setCounts({
          projects: rs[0].data.length,
          skills: rs[1].data.length,
          unread: rs[2].data.filter((m) => !m.read).length,
        }),
      )
      .catch(() => {});
  }, [section]);
  return (
    <main className="admin">
      <aside>
        <h2>
          PORTFOLIO <span>ADMIN</span>
        </h2>
        <NavLink end to="/admin">
          Dashboard
        </NavLink>
        {Object.keys(fields).map((x) => (
          <NavLink key={x} to={"/admin/" + x}>
            {labels[x]}
          </NavLink>
        ))}
        <NavLink to="/admin/settings">Settings</NavLink>
        <button
          onClick={async () => {
            await logout();
            go("/");
          }}
        >
          Log out
        </button>
      </aside>
      <section>
        {fields[section] ? (
          <Manage section={section} />
        ) : section === "settings" ? (
          <PasswordForm />
        ) : (
          <>
            <div className="dashboard-heading">
              <div>
                <p className="deployment-kicker">
                  <i /> ADMIN WORKSPACE
                </p>
                <h1>Dashboard</h1>
              </div>
              <p>
                Signed in as <strong>{user?.username}</strong>
              </p>
            </div>
            <DeploymentPanel />
            <div className="grid dashboard-counts">
              {Object.entries(counts).map(([k, v]) => (
                <RevealCard className="card count-card" key={k}>
                  <span>
                    {k === "unread" ? "UNREAD MESSAGES" : k.toUpperCase()}
                  </span>
                  <h2>
                    <CountUp value={v} />
                  </h2>
                  <small>
                    <Activity size={14} /> Portfolio data
                  </small>
                </RevealCard>
              ))}
            </div>
            <p className="dashboard-hint">
              Manage portfolio content from the sections in the sidebar.
            </p>
            <PasswordForm />
          </>
        )}
      </section>
    </main>
  );
}
function CountUp({ value }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    if (!target) {
      setCount(0);
      return;
    }
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 18));
    const timer = window.setInterval(() => {
      current = Math.min(target, current + step);
      setCount(current);
      if (current === target) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [value]);
  return count;
}
function DeploymentPanel() {
  const steps = [
    ["01", "Code", "Source control"],
    ["02", "Build", "CI pipeline"],
    ["03", "Test", "Quality checks"],
    ["04", "Deploy", "Release stage"],
  ];
  const envs = [
    ["Production", "v1.0.0", "main"],
    ["Staging", "v1.0.0-rc", "release"],
    ["Development", "next build", "develop"],
  ];
  return (
    <>
      <article className="deployment-panel">
        <div className="deployment-copy">
          <span className="deployment-kicker">
            <i /> DEVOPS & DEPLOYMENT
          </span>
          <h2>Ship with confidence</h2>
          <p>
            A visual overview of the delivery stages and hosting environments.
          </p>
          <div className="deployment-status">
            <span className="status-pulse" /> Pipeline preview{" "}
            <span className="status-branch">Code → production</span>
          </div>
          <div className="stack-icons">
            <span>
              <GitBranch /> Git
            </span>
            <span>
              <Container /> Docker
            </span>
            <span>
              <Cloud /> Cloud
            </span>
            <span>
              <Server /> Server
            </span>
          </div>
        </div>
        <div className="pipeline" aria-label="Code, build, test, deploy">
          <div className="pipeline-track">
            <span className="pipeline-packet" />
          </div>
          {steps.map(([n, name, sub], i) => (
            <div className={`pipeline-step step-${i + 1}`} key={name}>
              <span className="pipeline-icon">{["⌘", "⚙", "✓", "↗"][i]}</span>
              <b>{name}</b>
              <small>{sub}</small>
              <em>{n}</em>
            </div>
          ))}
        </div>
        <div className="deployment-orbit orbit-one" />
        <div className="deployment-orbit orbit-two" />
      </article>
      <div className="deployment-subheading">
        <div>
          <h2>Environments</h2>
          <p>
            Illustrative status cards · connect a deployment provider for live
            data
          </p>
        </div>
        <span>
          <ShieldCheck size={16} /> STATUS PREVIEW
        </span>
      </div>
      <div className="grid environment-grid">
        {envs.map(([name, version, branch], i) => (
          <RevealCard className="card environment-card" key={name}>
            <div className="environment-top">
              <span className={`environment-dot env-${i}`} />
              <span>{name}</span>
              <small>{i === 2 ? "IN DEVELOPMENT" : "READY"}</small>
            </div>
            <p className="environment-version">{version}</p>
            <div className="environment-meta">
              <GitBranch size={14} />
              {branch}
              <span>·</span>
              {i === 0 ? "Latest release" : "Preview build"}
            </div>
            <div className="mini-metrics">
              <div>
                <span>CPU</span>
                <i style={{ "--meter": `${[34, 48, 21][i]}%` }} />
              </div>
              <div>
                <span>MEMORY</span>
                <i style={{ "--meter": `${[58, 42, 31][i]}%` }} />
              </div>
              <div>
                <span>TRAFFIC</span>
                <i style={{ "--meter": `${[76, 38, 24][i]}%` }} />
              </div>
            </div>
            <div
              className="traffic-chart"
              aria-label="Illustrative service activity"
            >
              {[
                28, 44, 34, 62, 48, 75, 56, 84, 64, 92, 58, 76, 66, 100, 70, 88,
              ].map((height, j) => (
                <i key={j} style={{ "--bar": `${height}%` }} />
              ))}
            </div>
          </RevealCard>
        ))}
      </div>
      <div className="terminal-card">
        <div className="terminal-title">
          <span>
            <i />
            <i />
            <i />
          </span>
          <b>
            <Server size={14} /> deployment-log
          </b>
          <small>PREVIEW</small>
        </div>
        <div className="terminal-lines">
          <p>
            <i>›</i> git checkout main <b>✓</b>
          </p>
          <p>
            <i>›</i> docker build -t portfolio:latest . <b>✓</b>
          </p>
          <p>
            <i>›</i> running quality checks… <b>✓</b>
          </p>
          <p>
            <i>›</i> release ready for deployment{" "}
            <span className="terminal-cursor" />
          </p>
        </div>
      </div>
    </>
  );
}
function Manage({ section }) {
  const [rows, setRows] = useState([]),
    [edit, setEdit] = useState(null),
    [status, setStatus] = useState(""),
    endpoint = "/admin/" + section;
  async function load() {
    try {
      const { data } = await api.get(endpoint);
      setRows(Array.isArray(data) ? data : data ? [data] : []);
    } catch (e) {
      setStatus(e.response?.data?.message || "Could not load records");
    }
  }
  useEffect(() => {
    load();
  }, [section]);
  async function save(e) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      data = {};
    for (const key of fields[section]) {
      const v = f.get(key);
      data[key] =
        key === "techStack"
          ? String(v || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : key === "socialLinks"
            ? String(v || "")
                .split(/\r?\n/)
                .filter(Boolean)
                .map((x) => {
                  const [label, url] = x.split("|");
                  return { label: label?.trim(), url: url?.trim() };
                })
            : v;
    }
    try {
      if (edit) await api.put(`${endpoint}/${edit._id}`, data);
      else await api.post(endpoint, data);
      setEdit(null);
      setStatus("Saved successfully");
      form.reset();
      await load();
    } catch (x) {
      setStatus(x.response?.data?.message || "Unable to save");
    }
  }
  async function remove(row) {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    try {
      await api.delete(`${endpoint}/${row._id}`);
      setStatus("Deleted");
      await load();
    } catch (e) {
      setStatus(e.response?.data?.message || "Could not delete");
    }
  }
  async function markRead(row) {
    try {
      await api.patch(`${endpoint}/${row._id}`, { read: !row.read });
      await load();
    } catch (e) {
      setStatus(e.response?.data?.message || "Could not update message");
    }
  }
  return (
    <>
      <h1>{labels[section]}</h1>
      {section !== "messages" && (
        <form className="form panel" onSubmit={save}>
          <h2>
            {edit ? "Edit" : "Add"} {labels[section]}
          </h2>
          {fields[section].map((k) => (
            <label key={k}>
              {k}
              <Field name={k} value={edit?.[k]} />
            </label>
          ))}
          <button>{edit ? "Update" : "Add"}</button>
          {edit && (
            <button type="button" onClick={() => setEdit(null)}>
              Cancel
            </button>
          )}
        </form>
      )}
      <p role="status">{status}</p>
      <div className="grid">
        {rows.map((row) => (
          <RevealCard className="card" key={row._id}>
            {section === "messages" ? (
              <>
                <h3>
                  {row.name} {row.read ? "(read)" : "(unread)"}
                </h3>
                <p>{row.email}</p>
                <p>{row.content}</p>
                <button onClick={() => markRead(row)}>
                  {row.read ? "Mark unread" : "Mark read"}
                </button>
              </>
            ) : (
              <>
                <h3>
                  {row.title ||
                    row.name ||
                    row.content?.slice(0, 60) ||
                    row.category}
                </h3>
                <p>
                  {row.description || row.intro || row.content || row.category}
                </p>
                {(row.image || row.photo) && (
                  <AssetImage
                    className="admin-record-image"
                    value={row.image || row.photo}
                    alt={row.title || row.name || "Portfolio image"}
                    fallbackLabel="IMAGE UNAVAILABLE"
                    fallback={
                      <div
                        className="admin-image-placeholder"
                        aria-hidden="true"
                      >
                        <span>IMAGE UNAVAILABLE</span>
                      </div>
                    }
                  />
                )}
                <button onClick={() => setEdit(row)}>Edit</button>
              </>
            )}
            <button className="danger" onClick={() => remove(row)}>
              Delete
            </button>
          </RevealCard>
        ))}
      </div>
      {!rows.length && <p>Nothing added yet.</p>}
    </>
  );
}
function Field({ name, value }) {
  if (["intro", "description", "content"].includes(name))
    return (
      <textarea name={name} defaultValue={value || ""} maxLength={10000} />
    );
  if (name === "socialLinks")
    return (
      <textarea
        name={name}
        defaultValue={(value || [])
          .map((x) => x.label + "|" + x.url)
          .join("\n")}
        placeholder={"One link per line: Label|https://…"}
      />
    );
  if (name === "level")
    return (
      <select name={name} defaultValue={value || "Intermediate"}>
        {["Beginner", "Intermediate", "Advanced", "Expert"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    );
  if (["photo", "resume", "image"].includes(name))
    return (
      <>
        <input
          name={name}
          defaultValue={value || ""}
          placeholder="Uploaded file URL"
        />
        <input
          type="file"
          accept={name === "resume" ? ".pdf" : "image/*"}
          onChange={async (e) => {
            if (!e.target.files[0]) return;
            const d = new FormData();
            d.append("file", e.target.files[0]);
            try {
              const { data } = await api.post("/admin/upload", d);
              e.target.previousSibling.value = data.url;
            } catch {
              alert("Upload failed");
            }
          }}
        />
      </>
    );
  return (
    <input
      name={name}
      defaultValue={Array.isArray(value) ? value.join(", ") : value || ""}
      required={["name", "title", "category"].includes(name)}
      placeholder={name === "techStack" ? "Comma-separated technologies" : ""}
      maxLength="10000"
    />
  );
}
function PasswordForm() {
  const [msg, setMsg] = useState("");
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.put("/auth/password", Object.fromEntries(f));
      setMsg("Password changed. Please sign in again.");
    } catch (x) {
      setMsg(x.response?.data?.message || "Could not change password");
    }
  }
  return (
    <form className="form panel" onSubmit={submit}>
      <h2>Change password</h2>
      <input
        name="currentPassword"
        type="password"
        placeholder="Current password"
        required
      />
      <input
        name="newPassword"
        type="password"
        placeholder="New password (12+ characters)"
        minLength="12"
        required
      />
      <button>Update password</button>
      <p>{msg}</p>
    </form>
  );
}
