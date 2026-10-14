import { Component, type ReactNode, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  Activity,
  LayoutDashboard,
  Plus,
  History,
  Timer,
  TrendingUp,
  ChartNoAxesCombined,
  HeartPulse,
  CalendarDays,
  FlaskConical,
  ScanLine,
  Trophy,
  Settings,
  ArrowUpRight,
  ChevronDown,
  Menu,
  Wifi,
  WifiOff,
  X,
  ArrowRight,
  Beaker,
} from "lucide-react";
import { Context, type Filters } from "./components/context";
import { realDB, demoDB, initialize, snapshot } from "./data/db";
import { type Settings as Preference, modalities } from "./domain/model";
import {
  Dashboard,
  DensityLab,
  StrengthAnalytics,
  LoadProfiles,
  Research,
  Records,
} from "./pages/Analytics";
import { WorkoutEditor, History as HistoryPage } from "./pages/Workout";
import {
  Cycles,
  Biomechanics,
  ConditioningPage,
  WellnessPanel,
} from "./pages/Labs";
import { SettingsPage } from "./pages/Settings";
import { Badge } from "./components/ui";
const nav = [
  ["dashboard", "Overview", LayoutDashboard, "Your training, in perspective."],
  ["log", "Log workout", Plus, "Record the work. Keep the context."],
  ["history", "Training history", History, "Every observation, preserved."],
  ["density", "Density Lab", Timer, "More capacity. The same conditions."],
  [
    "strength",
    "Strength analytics",
    TrendingUp,
    "Measured performance. Qualified estimates.",
  ],
  [
    "profiles",
    "Load profiles",
    ChartNoAxesCombined,
    "See where your performance is changing.",
  ],
  [
    "conditioning",
    "Conditioning",
    HeartPulse,
    "Activity-specific work capacity.",
  ],
  [
    "cycles",
    "Training cycles",
    CalendarDays,
    "Give your training a clear direction.",
  ],
  [
    "biomechanics",
    "Biomechanics Lab",
    FlaskConical,
    "Physical calculations with explicit assumptions.",
  ],
  [
    "research",
    "Research analytics",
    ScanLine,
    "Explore the pattern. Respect the uncertainty.",
  ],
  [
    "records",
    "Personal records",
    Trophy,
    "Your best, under comparable conditions.",
  ],
  ["settings", "Settings", Settings, "Your laboratory. Your preferences."],
] as const;
function readRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  return raw || "dashboard";
}
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <div className="fatal">
        <h1>Strength Lab needs to reload</h1>
        <p>{this.state.error}</p>
        <p>Your saved observations remain in this browser.</p>
        <button onClick={() => location.reload()}>Reload application</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const [route, setRoute] = useState(readRoute),
    [demo, setDemoState] = useState(
      () => sessionStorage.getItem("strength-lab-environment") !== "personal",
    ),
    [ready, setReady] = useState(false),
    [initError, setInitError] = useState(""),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState(""),
    [online, setOnline] = useState(navigator.onLine),
    [filters, setFilters] = useState<Filters>({
      exercise: "",
      cycle: "",
      from: "",
      to: "",
    }),
    [showFilters, setShowFilters] = useState(false);
  const db = demo ? demoDB : realDB;
  const {
    needRefresh: [refresh, setRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const listener = () => {
      setRoute(readRoute());
      setMenu(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    initialize(db, demo)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => setInitError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [db, demo]);
  const data = useLiveQuery(
    () => (ready ? snapshot(db) : undefined),
    [db, ready],
  );
  useEffect(() => {
    const yes = () => setOnline(true),
      no = () => setOnline(false);
    window.addEventListener("online", yes);
    window.addEventListener("offline", no);
    return () => {
      window.removeEventListener("online", yes);
      window.removeEventListener("offline", no);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  const settings: Preference = data?.settings[0] || {
    id: "preferences",
    unit: "lb",
    theme: "dark",
    weekStart: "monday",
    lastBackup: null,
  };
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);
  function navigate(value: string) {
    location.hash = "/" + value;
  }
  function setDemo(value: boolean) {
    sessionStorage.setItem(
      "strength-lab-environment",
      value ? "demo" : "personal",
    );
    setFilters({ exercise: "", cycle: "", from: "", to: "" });
    setDemoState(value);
    setToast(
      value
        ? "Demonstration data is isolated from your history."
        : "Your personal training database is active.",
    );
  }
  const page = route.split("?")[0];
  const params = new URLSearchParams(route.split("?")[1]);
  const selected = nav.find((n) => n[0] === page) || nav[0];
  if (initError)
    return (
      <div className="fatal">
        <h1>Storage unavailable</h1>
        <p>{initError}</p>
        <p>
          Enable browser storage and reload. No observations have been
          discarded.
        </p>
      </div>
    );
  if (!data)
    return (
      <div className="loading">
        <Activity />
        <span>Opening your laboratory…</span>
      </div>
    );
  let content: ReactNode;
  switch (page) {
    case "log":
      content = (
        <WorkoutEditor
          key={route + String(demo)}
          sessionId={params.get("id") || ""}
          performanceId={params.get("performance") || ""}
          append={params.get("append") === "1"}
        />
      );
      break;
    case "history":
      content = <HistoryPage />;
      break;
    case "density":
      content = <DensityLab />;
      break;
    case "strength":
      content = <StrengthAnalytics />;
      break;
    case "profiles":
      content = <LoadProfiles />;
      break;
    case "conditioning":
      content = <ConditioningPage />;
      break;
    case "cycles":
      content = <Cycles />;
      break;
    case "biomechanics":
      content = <Biomechanics />;
      break;
    case "research":
      content = <Research />;
      break;
    case "records":
      content = <Records />;
      break;
    case "settings":
      content = <SettingsPage />;
      break;
    default:
      content = (
        <>
          <Dashboard />
          <WellnessPanel />
        </>
      );
  }
  const filterCount = Object.values(filters).filter(Boolean).length;
  return (
    <Context.Provider
      value={{
        db,
        data,
        settings,
        demo,
        setDemo,
        notify: setToast,
        navigate,
        filters,
        setFilters,
      }}
    >
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <div className="app-layout">
        <aside className={"sidebar " + (menu ? "open" : "")}>
          <a className="brand" href="#/dashboard">
            <span className="brand-icon">
              <ChartNoAxesCombined size={21} />
            </span>
            <span>
              STRENGTH<span className="brand-lab">LAB</span>
              <small>PERFORMANCE. MEASURED.</small>
            </span>
          </a>
          <div className="nav-label">WORKSPACE</div>
          <nav aria-label="Main navigation">
            {nav.map(([id, label, Icon], i) => (
              <a
                key={id}
                href={"#/" + id}
                className={page === id ? "active" : ""}
                aria-current={page === id ? "page" : undefined}
              >
                {i === 3 && <span className="nav-divider" />}
                <Icon size={18} />
                <span>{label}</span>
                {id === "density" && <span className="nav-pill">LAB</span>}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="privacy">
              <span className="status-dot" />
              <span>
                Local-first storage<small>Your data stays on this device</small>
              </span>
            </div>
            <div className="profile">
              <span className="avatar">SL</span>
              <span>
                Personal laboratory<small>Independent athlete</small>
              </span>
              <Settings size={15} />
            </div>
          </div>
        </aside>
        {menu && <div className="nav-overlay" onClick={() => setMenu(false)} />}
        <div className="workspace">
          <header className="topbar">
            <div>
              <button
                className="icon-button mobile-menu"
                onClick={() => setMenu((v) => !v)}
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>
              <span className="breadcrumb">
                Workspace <span>/</span> <strong>{selected[1]}</strong>
              </span>
            </div>
            <div className="topbar-right">
              <span className="connection">
                {online ? <Wifi size={13} /> : <WifiOff size={13} />}{" "}
                {online ? "Device storage" : "Offline"}
              </span>
              <button
                disabled={page === "log"}
                className="unit-toggle"
                aria-label="Change display units"
                onClick={() =>
                  db.settings.update("preferences", {
                    unit: settings.unit === "lb" ? "kg" : "lb",
                  })
                }
              >
                {settings.unit.toUpperCase()}
                <ChevronDown size={12} />
              </button>
              <span className="avatar small">SL</span>
            </div>
          </header>
          {demo && (
            <div className="demo-banner">
              <div>
                <Beaker size={15} />
                <strong>Demonstration mode</strong>
                <span>Sample observations · separate from your history</span>
              </div>
              <button onClick={() => setDemo(false)}>
                Start my training history <ArrowRight size={14} />
              </button>
            </div>
          )}
          <main id="main" tabIndex={-1}>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  STRENGTH LAB /{" "}
                  {page === "dashboard"
                    ? "COMMAND CENTER"
                    : "PERFORMANCE WORKSPACE"}
                </div>
                <h1>
                  {selected[1] === "Overview"
                    ? "Performance overview"
                    : selected[1]}
                </h1>
                <p>{selected[3]}</p>
              </div>
              <div className="heading-actions">
                {!["log", "settings", "biomechanics"].includes(page) && (
                  <button
                    className="button"
                    onClick={() => setShowFilters((v) => !v)}
                  >
                    <CalendarDays size={15} />
                    Filters
                    {filterCount > 0 && (
                      <span className="filter-count">{filterCount}</span>
                    )}
                    <ChevronDown size={14} />
                  </button>
                )}
                {page !== "log" && (
                  <button
                    className="button primary"
                    onClick={() => navigate("log")}
                  >
                    <Plus size={17} />
                    Log workout
                  </button>
                )}
              </div>
            </div>
            {showFilters &&
              !["log", "settings", "biomechanics"].includes(page) && (
                <div className="filter-bar">
                  <label>
                    Exercise
                    <select
                      value={filters.exercise}
                      onChange={(e) =>
                        setFilters({ ...filters, exercise: e.target.value })
                      }
                    >
                      <option value="">All exercises</option>
                      {data.exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Cycle
                    <select
                      value={filters.cycle}
                      onChange={(e) =>
                        setFilters({ ...filters, cycle: e.target.value })
                      }
                    >
                      <option value="">All cycles</option>
                      {data.cycles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Modality
                    <select
                      value={filters.modality || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, modality: e.target.value })
                      }
                    >
                      <option value="">All modalities</option>
                      {modalities.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Movement
                    <select
                      value={filters.pattern || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, pattern: e.target.value })
                      }
                    >
                      <option value="">All patterns</option>
                      {Array.from(
                        new Set(data.exercises.map((e) => e.pattern)),
                      ).map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    From
                    <input
                      type="date"
                      value={filters.from}
                      onChange={(e) =>
                        setFilters({ ...filters, from: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Through
                    <input
                      type="date"
                      value={filters.to}
                      onChange={(e) =>
                        setFilters({ ...filters, to: e.target.value })
                      }
                    />
                  </label>
                  <button
                    className="button ghost small"
                    onClick={() =>
                      setFilters({ exercise: "", cycle: "", from: "", to: "" })
                    }
                  >
                    Reset
                  </button>
                </div>
              )}
            <div key={String(demo) + page} className="page-content">
              {content}
            </div>
            <footer className="app-footer">
              <span>
                STRENGTH LAB <span>Performance. Measured.</span>
              </span>
              <span>
                {demo ? "Isolated demonstration" : "Private device storage"} ·
                v1.0
              </span>
            </footer>
          </main>
        </div>
        <nav className="mobile-bottom" aria-label="Mobile navigation">
          {nav
            .filter((n) =>
              ["dashboard", "log", "history", "density"].includes(n[0]),
            )
            .map(([id, label, Icon]) => (
              <a
                key={id}
                className={page === id ? "active" : ""}
                href={"#/" + id}
              >
                <Icon size={20} />
                <span>
                  {id === "dashboard"
                    ? "Overview"
                    : id === "density"
                      ? "Analytics"
                      : label}
                </span>
              </a>
            ))}
          <button onClick={() => setMenu((v) => !v)}>
            <Menu size={20} />
            <span>More</span>
          </button>
        </nav>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {refresh && (
        <div className="update-prompt">
          <strong>New application version ready</strong>
          <p>
            Your draft autosaves. Reload after the save indicator completes.
          </p>
          <button
            className="button small"
            onClick={() => updateServiceWorker(true)}
          >
            Reload application
          </button>
          <button
            className="button ghost small"
            onClick={() => setRefresh(false)}
          >
            Later
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
