import { sessionDisplayName } from "../domain/scope";
import { fixedLoadKey } from "../domain/metrics";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { dateLabel, number, useLab, useScope } from "../components/context";
import { Badge, Card, Empty, Field, SectionTitle } from "../components/ui";
import { csv, deleteSession, download, saveSession } from "../data/db";
import { fromKg, points, toKg } from "../domain/metrics";
import {
  type Modality,
  type SetRecord,
  conditioningSchema,
  modalities,
  performanceSchema,
  sessionSchema,
  setSchema,
  stamp,
  today,
} from "../domain/model";

type SetInput = {
  load: string;
  reps: string;
  rir: string;
  rpe: string;
  rest: string;
  end: string;
  seconds: string;
  displacement: string;
  side: SetRecord["side"];
  block: string;
  warmup: boolean;
  testedMax: boolean;
};
type Draft = {
  unit: "lb" | "kg";
  exercise: string;
  date: string;
  cycle: string;
  modality: Modality;
  mode: "summary" | "detailed";
  load: string;
  reps: string;
  window: string;
  sessionMinutes: string;
  sessionRpe: string;
  bodyMass: string;
  notes: string;
  sets: SetInput[];
  kind: "resistance" | "conditioning";
  activity:
    | "Running"
    | "Cycling"
    | "Rowing"
    | "Sled push"
    | "Loaded carry"
    | "Circuit"
    | "Bodyweight";
  distance: string;
  hr: string;
  intervals: { work: string; rest: string; distance: string }[];
};
function setInput(load = "185"): SetInput {
  return {
    load,
    reps: "10",
    rir: "",
    rpe: "",
    rest: "",
    end: "",
    seconds: "",
    displacement: "",
    side: "bilateral",
    block: "Working sets",
    warmup: false,
    testedMax: false,
  };
}
const optional = (v: string) => (v.trim() === "" ? null : Number(v));
export function WorkoutEditor({
  sessionId = "",
  performanceId = "",
  append = false,
}: {
  sessionId?: string;
  performanceId?: string;
  append?: boolean;
}) {
  const {
    db,
    data,
    settings,
    notify,
    navigate,
    filters,
    setFilters,
    analysis,
    setAnalysis,
  } = useLab();
  const [draft, setDraft] = useState<Draft>({
    unit: settings.unit,
    exercise: data.exercises.some((e) => e.id === filters.exercise)
      ? filters.exercise
      : data.exercises[0]?.id || "",
    date: today(),
    cycle: data.cycles.some((c) => c.id === filters.cycle) ? filters.cycle : "",
    modality: "Density",
    mode: "summary",
    load: "",
    reps: "",
    window: "15",
    sessionMinutes: "15",
    sessionRpe: "",
    bodyMass: "",
    notes: "",
    sets: [setInput("")],
    kind: "resistance",
    activity: "Running",
    distance: "",
    hr: "",
    intervals: [],
  });
  const [ready, setReady] = useState(false),
    [status, setStatus] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [advanced, setAdvanced] = useState(false);
  const draftKey =
    "workout:" +
    sessionId +
    (performanceId ? ":" + performanceId : "") +
    (append ? ":append" : "");
  const savingRef = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraft = useRef(draft),
    readyRef = useRef(false);
  useLayoutEffect(() => {
    latestDraft.current = draft;
    readyRef.current = ready;
  }, [draft, ready]);
  const original = data.sessions.find((s) => s.id === sessionId),
    originalP = append
      ? undefined
      : data.performances.find(
          (p) =>
            p.sessionId === sessionId &&
            (!performanceId || p.id === performanceId),
        ),
    originalC = append
      ? undefined
      : data.conditioning.find((c) => c.sessionId === sessionId);
  const initialContext = useRef({
    original,
    originalP,
    originalC,
    protocols: data.protocols,
    sets: data.sets,
    unit: settings.unit,
  });
  useEffect(() => {
    let cancelled = false;
    const { original, originalP, originalC, protocols, sets, unit } =
      initialContext.current;
    const data = { protocols, sets };
    const settings = { unit };
    db.drafts
      .get(draftKey)
      .then((saved) => {
        if (cancelled) return;
        if (saved) {
          const recovered = saved.payload as Draft;
          const convert = (v: string) =>
            v && recovered.unit && recovered.unit !== settings.unit
              ? String(fromKg(toKg(Number(v), recovered.unit), settings.unit))
              : v;
          setDraft({
            ...recovered,
            unit: settings.unit,
            load: convert(recovered.load),
            bodyMass: convert(recovered.bodyMass),
            sets: recovered.sets.map((s) => ({ ...s, load: convert(s.load) })),
          });
          setStatus("Recovered saved draft");
        } else if (original) {
          const pr = data.protocols.find(
            (pr) => pr.id === originalP?.protocolId,
          );
          setDraft((v) => ({
            ...v,
            date: original.date,
            cycle: original.cycleId || "",
            sessionMinutes: String(original.durationSec / 60),
            sessionRpe: original.rpe === null ? "" : String(original.rpe),
            notes: original.notes,
            exercise: pr?.exerciseId || v.exercise,
            modality: pr?.modality || v.modality,
            mode: originalP?.mode || v.mode,
            load:
              originalP?.loadKg === null || !originalP
                ? ""
                : String(
                    Number(fromKg(originalP.loadKg, settings.unit).toFixed(5)),
                  ),
            reps:
              originalP?.reps === null || !originalP
                ? ""
                : String(originalP.reps),
            window: originalP?.durationSec
              ? String(originalP.durationSec / 60)
              : "15",
            bodyMass: originalP?.bodyMassKg
              ? String(
                  Number(
                    fromKg(originalP.bodyMassKg, settings.unit).toFixed(3),
                  ),
                )
              : "",
            sets:
              originalP?.mode === "detailed"
                ? data.sets
                    .filter((s) => s.performanceId === originalP.id)
                    .sort((a, b) => a.order - b.order)
                    .map((s) => ({
                      load: String(
                        Number(fromKg(s.loadKg, settings.unit).toFixed(5)),
                      ),
                      reps: String(s.reps),
                      rir: s.rir === null ? "" : String(s.rir),
                      rpe: s.rpe === null ? "" : String(s.rpe),
                      rest: s.restSec === null ? "" : String(s.restSec),
                      end: s.endSec === null ? "" : String(s.endSec),
                      seconds:
                        s.movementSec === null ? "" : String(s.movementSec),
                      displacement:
                        s.displacementM === null ? "" : String(s.displacementM),
                      side: s.side,
                      block: s.block,
                      warmup: s.warmup,
                      testedMax: s.testedMax,
                    }))
                : [setInput("")],
            kind: originalC ? "conditioning" : "resistance",
            activity: originalC?.activity || "Running",
            distance: originalC ? String(originalC.distanceM) : "",
            hr: originalC?.hr ? String(originalC.hr) : "",
            intervals:
              originalC?.intervals.map((i) => ({
                work: String(i.workSec),
                rest: String(i.restSec),
                distance: String(i.distanceM),
              })) || [],
          }));
        }
        setReady(true);
      })
      .catch((e) => {
        setError(String(e));
        setReady(true);
      });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [db, draftKey]);
  useEffect(
    () => () => {
      if (readyRef.current && !savingRef.current) {
        void db.drafts
          .put({
            id: draftKey,
            payload: latestDraft.current,
            updatedAt: new Date().toISOString(),
          })
          .catch(() => {});
      }
    },
    [db, draftKey],
  );
  useEffect(() => {
    if (!ready || savingRef.current) return;
    setStatus("Saving draft…");
    timer.current = setTimeout(() => {
      if (savingRef.current) return;
      db.drafts
        .put({
          id: draftKey,
          payload: draft,
          updatedAt: new Date().toISOString(),
        })
        .then(() => setStatus("Draft saved on this device"))
        .catch(() =>
          setStatus("Draft could not be saved. Keep this tab open."),
        );
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, ready, db, draftKey]);
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const ex = data.exercises.find((e) => e.id === draft.exercise);
  const isDensity = draft.modality === "Density";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    savingRef.current = true;
    if (timer.current) clearTimeout(timer.current);
    try {
      let densityKey = "";
      const session = sessionSchema.parse({
        ...stamp(original?.id),
        createdAt: original?.createdAt || new Date().toISOString(),
        revision: (original?.revision || 0) + 1,
        date: draft.date,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        name:
          original?.name ||
          (draft.kind === "conditioning"
            ? draft.activity + " / " + draft.modality
            : ex!.name + " / " + draft.modality),
        durationSec: Number(draft.sessionMinutes) * 60,
        cycleId: draft.cycle || null,
        rpe: optional(draft.sessionRpe),
        notes: draft.notes,
      });
      if (
        isDensity &&
        draft.kind === "resistance" &&
        (Number(draft.window) <= 0 ||
          Number(draft.sessionMinutes) < Number(draft.window))
      )
        throw new Error(
          "Density window must be positive and fit inside the session duration.",
        );
      if (draft.kind === "conditioning") {
        const conditioning = conditioningSchema.parse({
          ...stamp(originalC?.id),
          sessionId: session.id,
          activity: draft.activity,
          distanceM: Number(draft.distance),
          durationSec: Number(draft.sessionMinutes) * 60,
          loadKg: toKg(Number(draft.load), settings.unit),
          hr: optional(draft.hr),
          intervals: draft.intervals.map((i) => ({
            workSec: Number(i.work),
            restSec: Number(i.rest),
            distanceM: Number(i.distance),
          })),
        });
        await saveSession(
          db,
          {
            session,
            conditioning,
            replacePerformanceId: originalP?.id,
            replaceConditioningId: originalC?.id,
          },
          draftKey,
        );
      } else {
        if (!ex) throw new Error("Choose an exercise.");
        const durationSec =
          isDensity || draft.modality === "AMRAP" || draft.modality === "EMOM"
            ? Number(draft.window) * 60
            : 0;
        let protocol = data.protocols.find(
          (p) =>
            p.exerciseId === ex.id &&
            p.modality === draft.modality &&
            p.durationSec === durationSec &&
            p.standard === ex.standard,
        );
        if (!protocol)
          protocol = {
            ...stamp(),
            exerciseId: ex.id,
            modality: draft.modality,
            durationSec,
            standard: ex.standard,
            version: 1,
          };
        const pid = originalP?.id || crypto.randomUUID();
        let sets: SetRecord[] = [];
        if (draft.mode === "detailed") {
          if (!draft.sets.length) throw new Error("Add at least one set.");
          sets = draft.sets.map((s, i) =>
            setSchema.parse({
              ...stamp(),
              performanceId: pid,
              order: i,
              block: s.block || "Working sets",
              loadKg: toKg(Number(s.load), settings.unit),
              reps: Number(s.reps),
              side: s.side,
              rir: optional(s.rir),
              rpe: optional(s.rpe),
              restSec: optional(s.rest),
              endSec: optional(s.end),
              movementSec: optional(s.seconds),
              displacementM: optional(s.displacement),
              warmup: s.warmup,
              testedMax: s.testedMax,
              notes: "",
            }),
          );
          if (
            durationSec > 0 &&
            sets.some((s) => s.endSec !== null && s.endSec > durationSec)
          )
            throw new Error(
              "Set timestamps must fit within the performance window.",
            );
          const times = sets
            .filter((s) => s.endSec !== null)
            .map((s) => s.endSec!);
          if (times.some((t, i) => i > 0 && t < times[i - 1]))
            throw new Error("Set completion times must be chronological.");
          if (sets.some((s) => s.testedMax && s.reps !== 1))
            throw new Error(
              "A declared maximum test must contain one successful repetition.",
            );
        }
        const constantLoad =
          sets.length &&
          sets.every((s) => Math.abs(s.loadKg - sets[0].loadKg) < 0.00001)
            ? sets[0].loadKg
            : null;
        const perf = performanceSchema.parse({
          ...stamp(pid),
          createdAt: originalP?.createdAt || new Date().toISOString(),
          revision: (originalP?.revision || 0) + 1,
          sessionId: session.id,
          protocolId: protocol.id,
          mode: draft.mode,
          loadKg:
            draft.mode === "summary"
              ? toKg(Number(draft.load), settings.unit)
              : constantLoad,
          originalLoad: draft.mode === "summary" ? Number(draft.load) : null,
          originalUnit: settings.unit,
          reps: draft.mode === "summary" ? Number(draft.reps) : null,
          durationSec,
          completed: true,
          bodyMassKg: draft.bodyMass
            ? toKg(Number(draft.bodyMass), settings.unit)
            : null,
        });
        if (draft.modality === "Density" && perf.loadKg !== null)
          densityKey = fixedLoadKey(perf, {
            ...data,
            protocols: [
              ...data.protocols.filter((p) => p.id !== protocol.id),
              protocol,
            ],
          });
        await saveSession(
          db,
          {
            session,
            protocol,
            performance: perf,
            sets,
            replacePerformanceId: originalP?.id,
            replaceConditioningId: originalC?.id,
          },
          draftKey,
        );
      }
      await db.drafts.delete(draftKey);
      setFilters({
        ...filters,
        exercise:
          draft.kind === "resistance" &&
          (filters.exercise || (originalP && !append))
            ? draft.exercise
            : "",
        pattern: "",
        modality: "",
        cycle: draft.cycle,
        from: filters.from && draft.date < filters.from ? "" : filters.from,
        to: filters.to && draft.date > filters.to ? "" : filters.to,
      });
      setAnalysis({ ...analysis, densityKey });
      notify("Workout saved. Your observations are ready to analyze.");
      navigate("history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save workout.");
      savingRef.current = false;
    } finally {
      setSaving(false);
    }
  }
  if (!ready)
    return (
      <Card>
        <p>Recovering your draft…</p>
      </Card>
    );
  return (
    <form onSubmit={submit} className="workout-form">
      <div className="toolbar">
        <div className="segmented">
          <button
            type="button"
            className={draft.kind === "resistance" ? "active" : ""}
            onClick={() => update("kind", "resistance")}
          >
            Resistance training
          </button>
          <button
            type="button"
            className={draft.kind === "conditioning" ? "active" : ""}
            onClick={() => update("kind", "conditioning")}
          >
            Conditioning
          </button>
        </div>
        <span className="save-status">
          <Check size={14} />
          {status}
        </span>
      </div>
      <Card>
        <SectionTitle
          title={
            original
              ? append
                ? "Add to session"
                : "Edit observation"
              : "Record the work"
          }
          subtitle="Simple inputs. Meaningful observations."
          action={
            <Badge tone="teal">
              {draft.kind === "resistance" && draft.mode === "summary"
                ? "QUICK LOG"
                : "DETAILED LOG"}
            </Badge>
          }
        />
        <div className="form-grid">
          <Field
            label={
              draft.kind === "resistance" ? "Exercise variation" : "Activity"
            }
          >
            {draft.kind === "resistance" ? (
              <select
                required
                value={draft.exercise}
                onChange={(e) => update("exercise", e.target.value)}
              >
                {data.exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={draft.activity}
                onChange={(e) =>
                  update("activity", e.target.value as Draft["activity"])
                }
              >
                {[
                  "Running",
                  "Cycling",
                  "Rowing",
                  "Sled push",
                  "Loaded carry",
                  "Circuit",
                  "Bodyweight",
                ].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Training modality">
            <select
              value={draft.modality}
              onChange={(e) => {
                const m = e.target.value as Modality;
                setDraft((d) => ({
                  ...d,
                  modality: m,
                  mode:
                    m === "Density" || m === "AMRAP" ? "summary" : "detailed",
                  sessionMinutes: m === "Density" ? "15" : d.sessionMinutes,
                }));
              }}
            >
              {modalities.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          {draft.kind === "resistance" && (
            <>
              <Field
                label={`External load (${settings.unit})`}
                hint={
                  ex
                    ? `${ex.convention === "per-implement" ? "Per implement" : ex.convention === "added" ? "Added load only" : ex.convention === "bodyweight" ? "Enter 0 for unweighted bodyweight" : ex.convention === "assisted" ? "Assistance amount — excluded from volume" : "Total implement mass"} · ${ex.standard}`
                    : ""
                }
              >
                <input
                  required={draft.mode === "summary"}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="185"
                  value={draft.load}
                  onChange={(e) => update("load", e.target.value)}
                />
              </Field>
              {draft.mode === "summary" && (
                <Field label="Total repetitions">
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    placeholder="60"
                    value={draft.reps}
                    onChange={(e) => update("reps", e.target.value)}
                  />
                </Field>
              )}
              {["Density", "AMRAP", "EMOM"].includes(draft.modality) && (
                <Field label="Elapsed performance window (min)">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={draft.window}
                    onChange={(e) => update("window", e.target.value)}
                  />
                </Field>
              )}
            </>
          )}
          {draft.kind === "conditioning" && (
            <>
              <Field label="Distance (metres)">
                <input
                  required
                  type="number"
                  min="0"
                  step="any"
                  value={draft.distance}
                  onChange={(e) => update("distance", e.target.value)}
                  placeholder="5000"
                />
              </Field>
              <Field label={`External load (${settings.unit}, optional)`}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={draft.load}
                  onChange={(e) => update("load", e.target.value)}
                />
              </Field>
              <Field label="Average heart rate (bpm, optional)">
                <input
                  type="number"
                  min="20"
                  max="250"
                  value={draft.hr}
                  onChange={(e) => update("hr", e.target.value)}
                />
              </Field>
            </>
          )}
        </div>
        {draft.kind === "resistance" && (
          <div className="form-footer">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                if (
                  draft.mode === "summary" &&
                  draft.reps &&
                  Number(draft.reps) > 0 &&
                  !confirm(
                    "Switching to detailed mode requires real set-by-set observations. The quick total will not be treated as one set. Continue?",
                  )
                )
                  return;
                update(
                  "mode",
                  draft.mode === "summary" ? "detailed" : "summary",
                );
              }}
            >
              {draft.mode === "summary"
                ? "Add individual sets"
                : "Use quick summary"}{" "}
              <ChevronDown size={14} />
            </button>
            <span className="muted">
              Summary and sets are never counted together.
            </span>
          </div>
        )}
      </Card>
      {draft.kind === "resistance" && draft.mode === "detailed" && (
        <Card>
          <SectionTitle
            title="Set-by-set observations"
            subtitle="Group labels support supersets, clusters, drop sets and circuits"
            action={
              <button
                type="button"
                className="button small"
                onClick={() =>
                  update("sets", [...draft.sets, setInput(draft.load)])
                }
              >
                <Plus size={15} />
                Add set
              </button>
            }
          />
          <div className="set-editor">
            {draft.sets.map((s, i) => (
              <div className="set-row" key={i}>
                <span className="set-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="set-fields">
                  {[
                    ["block", "Group"],
                    ["load", settings.unit],
                    [
                      "reps",
                      draft.modality === "Isometric"
                        ? "Reps (0 for hold)"
                        : "Reps",
                    ],
                    ["rir", "RIR"],
                    ["rpe", "RPE"],
                    ["rest", "Rest s"],
                    ["end", "Ends at s"],
                    ["seconds", "Movement / hold s"],
                    ["displacement", "Vertical ascent m"],
                  ].map(([k, l]) => (
                    <Field key={k} label={l}>
                      <input
                        aria-label={`Set ${i + 1} ${l}`}
                        type={k === "block" ? "text" : "number"}
                        min="0"
                        step={
                          ["load", "seconds", "displacement"].includes(k)
                            ? "any"
                            : "1"
                        }
                        value={s[k as keyof SetInput] as string}
                        onChange={(e) =>
                          update(
                            "sets",
                            draft.sets.map((row, j) =>
                              j === i ? { ...row, [k]: e.target.value } : row,
                            ),
                          )
                        }
                      />
                    </Field>
                  ))}
                  <Field label="Repetition counting">
                    <select
                      value={s.side}
                      onChange={(e) =>
                        update(
                          "sets",
                          draft.sets.map((row, j) =>
                            j === i
                              ? {
                                  ...row,
                                  side: e.target.value as SetRecord["side"],
                                }
                              : row,
                          ),
                        )
                      }
                    >
                      <option value="bilateral">Bilateral</option>
                      <option value="left">Left only</option>
                      <option value="right">Right only</option>
                      <option value="combined">Combined alternating</option>
                    </select>
                  </Field>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={s.warmup}
                      onChange={(e) =>
                        update(
                          "sets",
                          draft.sets.map((row, j) =>
                            j === i
                              ? { ...row, warmup: e.target.checked }
                              : row,
                          ),
                        )
                      }
                    />
                    Warm-up
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={s.testedMax}
                      onChange={(e) =>
                        update(
                          "sets",
                          draft.sets.map((row, j) =>
                            j === i
                              ? { ...row, testedMax: e.target.checked }
                              : row,
                          ),
                        )
                      }
                    />
                    Declared 1RM test
                  </label>
                </div>
                <button
                  type="button"
                  className="icon-button danger"
                  aria-label={`Remove set ${i + 1}`}
                  onClick={() =>
                    update(
                      "sets",
                      draft.sets.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className="muted">
            Unknown effort, rest and movement measurements stay empty. Isometric
            holds use movement/hold seconds; repetitions may be 0.
          </p>
        </Card>
      )}
      {draft.kind === "conditioning" && (
        <Card>
          <SectionTitle
            title="Intervals"
            subtitle="Optional work/rest breakdown"
            action={
              <button
                type="button"
                className="button small"
                onClick={() =>
                  update("intervals", [
                    ...draft.intervals,
                    { work: "60", rest: "60", distance: "0" },
                  ])
                }
              >
                <Plus size={15} />
                Add interval
              </button>
            }
          />
          {draft.intervals.map((v, i) => (
            <div className="interval-row" key={i}>
              {[
                ["work", "Work (s)"],
                ["rest", "Rest (s)"],
                ["distance", "Distance (m)"],
              ].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input
                    type="number"
                    min={k === "work" ? 1 : 0}
                    value={v[k as keyof typeof v]}
                    onChange={(e) =>
                      update(
                        "intervals",
                        draft.intervals.map((r, j) =>
                          j === i ? { ...r, [k]: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </Field>
              ))}
              <button
                type="button"
                className="icon-button"
                aria-label="Remove interval"
                onClick={() =>
                  update(
                    "intervals",
                    draft.intervals.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </Card>
      )}
      <Card>
        <button
          type="button"
          className="expand-button"
          onClick={() => setAdvanced((v) => !v)}
        >
          Session context <span>{advanced ? "−" : "+"}</span>
        </button>
        <div className="form-grid">
          <Field label="Date">
            <input
              required
              type="date"
              value={draft.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </Field>
          <Field label="Total session duration (min)">
            <input
              required
              type="number"
              min="0.01"
              step="any"
              value={draft.sessionMinutes}
              onChange={(e) => update("sessionMinutes", e.target.value)}
            />
          </Field>
          {advanced && (
            <>
              <Field label="Training cycle">
                <select
                  value={draft.cycle}
                  onChange={(e) => update("cycle", e.target.value)}
                >
                  <option value="">No cycle</option>
                  {data.cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Session RPE (0–10)">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={draft.sessionRpe}
                  onChange={(e) => update("sessionRpe", e.target.value)}
                />
              </Field>
              <Field label={`Body mass (${settings.unit}, optional)`}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={draft.bodyMass}
                  onChange={(e) => update("bodyMass", e.target.value)}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={draft.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Technique, equipment, conditions…"
                />
              </Field>
            </>
          )}
        </div>
      </Card>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="save-bar">
        <span className="muted">Stored on this device · works offline</span>
        <button className="button primary" disabled={saving} type="submit">
          <Save size={17} />
          {saving ? "Saving…" : original ? "Save changes" : "Save workout"}
        </button>
      </div>
    </form>
  );
}
export function History() {
  const { db, data, settings, navigate, notify } = useLab(),
    d = useScope();
  const [selected, setSelected] = useState("");
  const sessions = [...d.sessions].sort((a, b) => b.date.localeCompare(a.date));
  const pts = points(d);
  const active = sessions.find((s) => s.id === selected);
  async function remove(id: string) {
    if (
      !confirm(
        "Delete this session and its observations? Personal records and trends will be recalculated.",
      )
    )
      return;
    try {
      await deleteSession(db, id);
      notify(
        "Session deleted. Records recomputed from remaining observations.",
      );
      setSelected("");
    } catch (e) {
      notify(String(e));
    }
  }
  return (
    <>
      <div className="toolbar">
        <p className="muted">
          {sessions.length} sessions in the selected period
        </p>
        <button
          className="button small"
          onClick={() =>
            download(
              "strength-lab-sessions.csv",
              csv(
                sessions.map((s) => ({
                  id: s.id,
                  date: s.date,
                  name: sessionDisplayName(data, s),
                  duration_min: s.durationSec / 60,
                  cycle: s.cycleId,
                  rpe: s.rpe,
                  notes: s.notes,
                })),
              ),
              "text/csv",
            )
          }
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>
      <Card>
        {sessions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Session</th>
                  <th>Protocol</th>
                  <th>Duration</th>
                  <th>Volume ({settings.unit}·rep)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const ps = pts.filter((p) => p.session.id === s.id);
                  return (
                    <tr key={s.id}>
                      <td>
                        {dateLabel(s.date)}
                        <small className="cell-sub">{s.date.slice(0, 4)}</small>
                      </td>
                      <td>
                        <button
                          className="table-link"
                          onClick={() => setSelected(s.id)}
                        >
                          {sessionDisplayName(data, s)}
                        </button>
                      </td>
                      <td>
                        <Badge>
                          {ps[0]?.pr.modality ||
                            d.conditioning.find((c) => c.sessionId === s.id)
                              ?.activity ||
                            "Session"}
                        </Badge>
                      </td>
                      <td>{number(s.durationSec / 60)} min</td>
                      <td>
                        {ps.length && ps.some((p) => p.volume !== null)
                          ? number(
                              fromKg(
                                ps.reduce((v, p) => v + (p.volume ?? 0), 0),
                                settings.unit,
                              ),
                            )
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={"Edit " + sessionDisplayName(data, s)}
                          onClick={() => navigate("log?id=" + s.id)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={"Delete " + sessionDisplayName(data, s)}
                          onClick={() => remove(s.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </Card>
      {active && (
        <Card>
          <SectionTitle
            title={sessionDisplayName(data, active)}
            subtitle={`${active.date} · ${active.timeZone}`}
            action={
              <button
                className="button small"
                onClick={() => navigate("log?id=" + active.id + "&append=1")}
              >
                <Plus size={15} />
                Add exercise
              </button>
            }
          />
          <p>{active.notes || "No notes recorded."}</p>
          {pts
            .filter((p) => p.session.id === active.id)
            .map((p) => (
              <div className="history-detail" key={p.p.id}>
                <strong>{p.e.name}</strong>
                <Badge>{p.pr.modality}</Badge>
                <span>
                  {p.reps} reps · {p.p.durationSec / 60} min
                </span>
                <button
                  className="text-button"
                  onClick={() =>
                    navigate("log?id=" + active.id + "&performance=" + p.p.id)
                  }
                >
                  Edit observation <ArrowRight size={14} />
                </button>
              </div>
            ))}
        </Card>
      )}
    </>
  );
}
