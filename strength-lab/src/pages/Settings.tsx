import { useState, useRef } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  Database,
  Plus,
  Check,
  AlertCircle,
} from "lucide-react";
import { useLab, number } from "../components/context";
import {
  Badge,
  Card,
  Field,
  SectionTitle,
  Methodology,
  Help,
} from "../components/ui";
import { type Dataset, type Exercise, today } from "../domain/model";
import {
  backup,
  parseBackup,
  restore,
  download,
  csv,
  addExercise,
} from "../data/db";
import { WellnessPanel } from "./Labs";
import { fromKg } from "../domain/metrics";
export function SettingsPage() {
  const { db, data, settings, demo, setDemo, notify } = useLab();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<Dataset | null>(null),
    [mode, setMode] = useState<"merge" | "replace">("merge"),
    [storage, setStorage] = useState(""),
    [method, setMethod] = useState("density");
  const [zones, setZones] = useState(
    (settings.zones || [60, 70, 80, 90]).join(","),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [exercise, setExercise] = useState({
    name: "",
    pattern: "Horizontal push",
    convention: "total" as Exercise["convention"],
    implements: "1",
    standard: "Full range of motion · no assistance",
  });
  async function exportBackup() {
    setBusy(true);
    try {
      download(
        `strength-lab-${demo ? "DEMO-" : ""}${today()}.json`,
        JSON.stringify(await backup(db), null, 2),
      );
      await db.settings.update("preferences", {
        lastBackup: new Date().toISOString(),
      });
      notify("Complete JSON backup downloaded. Keep it somewhere safe.");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function loadFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      if (file.size > 32 * 1024 * 1024)
        throw new Error("Backup exceeds 32 MB.");
      setPending(await parseBackup(await file.text()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid backup.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function applyRestore() {
    if (!pending) return;
    setError("");
    setBusy(true);
    try {
      if (mode === "replace") {
        if (
          !confirm(
            "Replace this database with the validated backup? A pre-restore backup will download first.",
          )
        )
          return;
        download(
          `strength-lab-pre-restore-${Date.now()}.json`,
          JSON.stringify(await backup(db), null, 2),
        );
      }
      await restore(db, pending, mode);
      setPending(null);
      notify("Backup restored. Derived analytics recalculated.");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (
        !exercise.name.trim() ||
        !exercise.standard.trim() ||
        Number(exercise.implements) < 1
      )
        throw new Error(
          "Name, repetition standard and positive implement count are required.",
        );
      await addExercise(
        db,
        exercise.name,
        exercise.convention,
        exercise.pattern,
        Number(exercise.implements),
        exercise.standard,
      );
      setExercise((v) => ({ ...v, name: "" }));
      notify("Exercise variation added. Existing standards remain unchanged.");
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      <div className="grid-two">
        <Card>
          <SectionTitle
            title="Your preferences"
            subtitle="Display units change; recorded SI quantities stay stable"
          />
          <div className="form-grid">
            <Field label="Display units">
              <select
                value={settings.unit}
                onChange={(e) =>
                  db.settings.update("preferences", {
                    unit: e.target.value as "lb" | "kg",
                  })
                }
              >
                <option value="lb">Pounds (lb)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </Field>
            <Field label="Appearance">
              <select
                value={settings.theme}
                onChange={(e) =>
                  db.settings.update("preferences", {
                    theme: e.target.value as "dark" | "light",
                  })
                }
              >
                <option value="dark">Laboratory dark</option>
                <option value="light">Laboratory light</option>
              </select>
            </Field>
            <Field label="Week starts">
              <select
                value={settings.weekStart}
                onChange={(e) =>
                  db.settings.update("preferences", {
                    weekStart: e.target.value as "monday" | "sunday",
                  })
                }
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </Field>
            <Field label="Hard-set maximum RIR">
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                value={settings.hardSetRir ?? 3}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 0 && v <= 10)
                    db.settings.update("preferences", { hardSetRir: v });
                }}
              />
            </Field>
            <Field label="Intensity-zone boundaries (%)">
              <input
                value={zones}
                onChange={(e) => setZones(e.target.value)}
                placeholder="60,70,80,90"
              />
              <button
                className="button small"
                onClick={async () => {
                  const z = zones.split(",").map(Number);
                  if (
                    z.length !== 4 ||
                    z.some(
                      (v, i) =>
                        !Number.isFinite(v) ||
                        v <= 0 ||
                        v > 150 ||
                        (i > 0 && v <= z[i - 1]),
                    )
                  ) {
                    setError(
                      "Enter four increasing positive intensity-zone boundaries.",
                    );
                    return;
                  }
                  await db.settings.update("preferences", { zones: z });
                  notify("Custom intensity zones saved.");
                }}
              >
                Save zone boundaries
              </button>
            </Field>
            <Field label="Active data environment">
              <select
                value={demo ? "demo" : "personal"}
                onChange={(e) => setDemo(e.target.value === "demo")}
              >
                <option value="personal">My training history</option>
                <option value="demo">Isolated demonstration</option>
              </select>
            </Field>
          </div>
          <p className="muted">
            Training timestamps retain their entry time zone. Current device
            zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}.
          </p>
        </Card>
        <Card>
          <SectionTitle
            title="Local-first. Yours."
            subtitle="No account, telemetry, or cloud synchronization"
            action={<ShieldCheck size={23} />}
          />
          <p>
            Your records live in this browser on this device. Clearing browser
            data, changing browsers or storage eviction can remove them.
          </p>
          <p className="muted">
            Backups are plaintext. Anyone with a backup can read its contents.
            Export regularly and restore on another device when needed.
          </p>
          <button
            className="button small"
            onClick={async () => {
              const persisted = await navigator.storage?.persist?.();
              const estimate = await navigator.storage?.estimate?.();
              setStorage(
                `${persisted ? "Persistent storage granted" : "Persistent storage not granted"} · ${number((estimate?.usage ?? 0) / 1048576, 2)} MB used`,
              );
            }}
          >
            Request persistent storage
          </button>
          <small className="storage-note">{storage}</small>
        </Card>
      </div>
      <Card>
        <SectionTitle
          title="Backup and restoration"
          subtitle="Versioned, validated JSON · referential integrity · corruption checks"
          action={
            <Badge tone="teal">
              {demo ? "DEMO DATABASE" : "PERSONAL DATABASE"}
            </Badge>
          }
        />
        <div className="backup-actions">
          <button
            className="button primary"
            disabled={busy}
            onClick={exportBackup}
          >
            <Download size={16} />
            Download full backup
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} />
            Restore JSON backup
          </button>
          <button
            className="button ghost"
            onClick={() =>
              download(
                `strength-lab-${demo ? "DEMO-" : ""}sets.csv`,
                csv(
                  data.sets.map((s) => ({
                    id: s.id,
                    performance_id: s.performanceId,
                    order: s.order,
                    load: fromKg(s.loadKg, settings.unit),
                    unit: settings.unit,
                    reps: s.reps,
                    side: s.side,
                    rir: s.rir,
                    rpe: s.rpe,
                    rest_sec: s.restSec,
                    movement_sec: s.movementSec,
                    displacement_m: s.displacementM,
                  })),
                ),
                "text/csv",
              )
            }
          >
            <Download size={16} />
            Export sets CSV
          </button>
          <input
            hidden
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => loadFile(e.target.files?.[0])}
          />
        </div>
        <p className="muted">
          Last backup:{" "}
          {settings.lastBackup
            ? new Date(settings.lastBackup).toLocaleString()
            : "Not yet exported"}
          . CSV is for analysis and cannot restore the complete database.
        </p>
        {pending && (
          <div className="restore-preview">
            <h3>Validated backup preview</h3>
            <p>
              {pending.sessions.length} sessions · {pending.performances.length}{" "}
              performances · {pending.sets.length} sets ·{" "}
              {pending.cycles.length} cycles
            </p>
            <Field label="Restoration mode">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "merge" | "replace")}
              >
                <option value="merge">
                  Merge — identical IDs deduplicated; conflicts rejected
                </option>
                <option value="replace">
                  Replace — create pre-restore backup first
                </option>
              </select>
            </Field>
            <div className="backup-actions">
              <button
                className="button primary"
                disabled={busy}
                onClick={applyRestore}
              >
                Restore validated data
              </button>
              <button className="button ghost" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </Card>
      <div className="grid-two">
        <Card>
          <SectionTitle
            title="Exercise and protocol library"
            subtitle="New variations preserve existing historical standards"
          />
          <form onSubmit={add}>
            <div className="form-grid">
              <Field label="Variation name">
                <input
                  required
                  value={exercise.name}
                  onChange={(e) =>
                    setExercise((v) => ({ ...v, name: e.target.value }))
                  }
                  placeholder="Paused barbell bench press"
                />
              </Field>
              <Field label="Movement pattern">
                <select
                  value={exercise.pattern}
                  onChange={(e) =>
                    setExercise((v) => ({ ...v, pattern: e.target.value }))
                  }
                >
                  {[
                    "Horizontal push",
                    "Horizontal pull",
                    "Vertical push",
                    "Vertical pull",
                    "Squat",
                    "Hinge",
                    "Carry",
                    "Core",
                    "Other",
                  ].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Load convention">
                <select
                  value={exercise.convention}
                  onChange={(e) =>
                    setExercise((v) => ({
                      ...v,
                      convention: e.target.value as Exercise["convention"],
                    }))
                  }
                >
                  <option value="total">Total external mass</option>
                  <option value="per-implement">Per implement</option>
                  <option value="added">Added load only</option>
                  <option value="bodyweight">Bodyweight</option>
                  <option value="assisted">Assistance amount</option>
                  <option value="machine">Machine stack label</option>
                </select>
              </Field>
              <Field label="Implements in bilateral rep">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={exercise.implements}
                  onChange={(e) =>
                    setExercise((v) => ({ ...v, implements: e.target.value }))
                  }
                />
              </Field>
              <Field label="Repetition standard">
                <textarea
                  required
                  value={exercise.standard}
                  onChange={(e) =>
                    setExercise((v) => ({ ...v, standard: e.target.value }))
                  }
                />
              </Field>
            </div>
            <button className="button small" type="submit">
              <Plus size={15} />
              Add variation
            </button>
          </form>
        </Card>
        <WellnessPanel />
      </div>
      <Card>
        <SectionTitle
          title="Scientific methodology library"
          subtitle="Formulas, inputs, assumptions, interpretation and limitations"
        />
        <div className="segmented wrap">
          {[
            "density",
            "strength",
            "biomechanics",
            "research",
            "recovery",
            "conditioning",
          ].map((t) => (
            <button
              className={method === t ? "active" : ""}
              key={t}
              onClick={() => setMethod(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <Methodology topic={method} />
      </Card>
      <Card>
        <SectionTitle title="Installation and calculation policies" />
        <p>
          Install from your browser’s menu (or Share → Add to Home Screen on
          iOS). The first load requires network; the cached production
          application works offline afterward.
        </p>
        <div className="detail-grid">
          <span>Hard sets</span>
          <strong>
            Working sets with RIR ≤{settings.hardSetRir ?? 3}; unknown effort
            excluded
          </strong>
          <span>Primary estimated 1RM</span>
          <strong>2–10 reps; RIR ≤1 or RPE ≥9</strong>
          <span>Density protocol</span>
          <strong>
            Strict duration, variation and repetition-standard matching
          </strong>
          <span>Trend sufficiency</span>
          <strong>n≥4 across ≥14 days; exploratory</strong>
          <span>Cloud synchronization</span>
          <strong>Deferred</strong>
        </div>
        <p className="muted">
          Version 1 policies are fixed and documented. Encrypted backups and
          dependence-aware statistical inference remain deferred. Custom
          intensity zones and the hard-set threshold are available above.
        </p>
      </Card>
    </>
  );
}
