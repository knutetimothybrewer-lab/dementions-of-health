import { useState } from "react";
import { Plus, ArrowRight, CalendarDays, Check } from "lucide-react";
import { useLab, useScope, number, dateLabel } from "../components/context";
import {
  Badge,
  Card,
  Empty,
  Field,
  Help,
  Metric,
  SectionTitle,
} from "../components/ui";
import Chart, { lineOption } from "../components/Chart";
import {
  cycleSchema,
  planSchema,
  wellnessSchema,
  stamp,
  today,
  dayNumber,
  type Wellness,
  type Cycle,
} from "../domain/model";
import {
  adherence,
  cycleWeek,
  points,
  fromKg,
  toKg,
  biomechanics,
  acceleration,
  pace,
  speed,
  sessionLoad,
} from "../domain/metrics";

export function Cycles() {
  const { db, data, settings, notify, navigate } = useLab();
  const [creating, setCreating] = useState(false),
    [error, setError] = useState(""),
    [cycleId, setCycleId] = useState(""),
    [compareId, setCompareId] = useState("");
  const [form, setForm] = useState({
    name: "",
    goal: "",
    start: today(),
    end: today(),
    frequency: "4",
    deload: "4",
  });
  const [plan, setPlan] = useState({
    date: today(),
    exercise: data.exercises[0]?.id || "",
    load: "185",
    reps: "60",
    minutes: "15",
  });
  const current =
    data.cycles.find((c) => c.id === cycleId) ||
    data.cycles.find((c) => c.start <= today() && c.end >= today()) ||
    data.cycles[0];
  const compare =
    data.cycles.find((c) => c.id === compareId) ||
    data.cycles.find((c) => c.id !== current?.id);
  const plans = data.plans.filter((p) => p.cycleId === current?.id),
    due = plans.filter((p) => p.date <= today()),
    complete = due.filter((p) => p.sessionId !== null).length;
  const sessions = data.sessions.filter((s) => s.cycleId === current?.id);
  const wk = current ? cycleWeek(today(), current.start) : 0;
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const c = cycleSchema.parse({
        ...stamp(),
        name: form.name,
        goal: form.goal,
        start: form.start,
        end: form.end,
        frequency: Number(form.frequency),
        deloadWeeks: form.deload.split(",").filter(Boolean).map(Number),
      });
      await db.cycles.add(c);
      setCycleId(c.id);
      setCreating(false);
      notify("Training cycle created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  async function addPlan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (!current) throw new Error("Create a cycle first.");
      if (plan.date < current.start || plan.date > current.end)
        throw new Error("Planned date must fall inside the cycle.");
      const p = planSchema.parse({
        ...stamp(),
        cycleId: current.id,
        date: plan.date,
        exerciseId: plan.exercise,
        modality: "Density",
        loadKg: toKg(Number(plan.load), settings.unit),
        reps: Number(plan.reps),
        durationSec: Number(plan.minutes) * 60,
        sessionId: null,
      });
      if (p.durationSec <= 0)
        throw new Error("Density window must be positive.");
      await db.plans.add(p);
      notify("Planned session added.");
    } catch (err) {
      setError(String(err));
    }
  }
  function summary(c: Cycle | undefined) {
    if (!c) return null;
    const scoped = {
      ...data,
      sessions: data.sessions.filter((s) => s.cycleId === c.id),
      performances: data.performances.filter((p) =>
        data.sessions.some((s) => s.id === p.sessionId && s.cycleId === c.id),
      ),
    };
    const pts = points(scoped);
    const v = pts.reduce((s, p) => s + (p.volume ?? 0), 0),
      weeks = (dayNumber(c.end) - dayNumber(c.start) + 1) / 7;
    return {
      sessions: scoped.sessions.length,
      volume: v,
      weeks,
      perWeek: v / weeks,
      perSession: scoped.sessions.length ? v / scoped.sessions.length : null,
      coverage: pts.filter((p) => p.volume !== null).length + "/" + pts.length,
    };
  }
  const a = summary(current),
    b = summary(compare);
  return (
    <>
      <div className="toolbar">
        <select
          aria-label="Active training cycle"
          value={current?.id || ""}
          onChange={(e) => setCycleId(e.target.value)}
        >
          {data.cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="button small" onClick={() => setCreating((v) => !v)}>
          <Plus size={15} />
          New cycle
        </button>
      </div>
      {creating && (
        <Card>
          <SectionTitle title="Design a training block" />
          <form onSubmit={create}>
            <div className="form-grid">
              {[
                ["name", "Name"],
                ["goal", "Primary goal"],
                ["start", "Start date"],
                ["end", "End date"],
                ["frequency", "Sessions / week"],
                ["deload", "Deload weeks (comma-separated)"],
              ].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input
                    required={k !== "deload"}
                    type={
                      ["start", "end"].includes(k)
                        ? "date"
                        : k === "frequency"
                          ? "number"
                          : "text"
                    }
                    value={form[k as keyof typeof form]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [k]: e.target.value }))
                    }
                  />
                </Field>
              ))}
            </div>
            <button className="button primary" type="submit">
              Create cycle
            </button>
          </form>
        </Card>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {current ? (
        <>
          <div className="metrics four">
            <Metric
              label="Cycle week"
              value={wk >= 1 && today() <= current.end ? wk : "—"}
              unit={
                "/ " +
                Math.ceil(
                  (dayNumber(current.end) - dayNumber(current.start) + 1) / 7,
                )
              }
              detail={
                current.deloadWeeks.includes(wk)
                  ? "Planned deload · reductions are contextual"
                  : current.goal
              }
            />
            <Metric
              label="Due-slot adherence"
              value={number(adherence(complete, due.length))}
              unit="%"
              detail={`${complete} completed / ${due.length} due slots`}
            />
            <Metric
              label="Completed sessions"
              value={sessions.length}
              detail="Extra work counted separately from adherence"
            />
            <Metric
              label="Planned frequency"
              value={current.frequency}
              unit="/ week"
              detail={`${current.start} — ${current.end}`}
            />
          </div>
          <div className="grid-main">
            <Card>
              <SectionTitle
                title="Planned versus completed"
                subtitle="Link actual sessions explicitly; dates alone do not prove completion"
              />
              {plans.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Exercise / target</th>
                        <th>Completion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...plans]
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((p) => (
                          <tr key={p.id}>
                            <td>
                              {dateLabel(p.date)}
                              {current.deloadWeeks.includes(
                                cycleWeek(p.date, current.start),
                              ) && <Badge>DELOAD</Badge>}
                            </td>
                            <td>
                              {
                                data.exercises.find(
                                  (e) => e.id === p.exerciseId,
                                )?.name
                              }
                              <small className="cell-sub">
                                {number(fromKg(p.loadKg, settings.unit))}{" "}
                                {settings.unit} · {p.reps} reps ·{" "}
                                {p.durationSec / 60} min
                              </small>
                            </td>
                            <td>
                              <select
                                aria-label={"Completion for " + p.date}
                                value={p.sessionId || ""}
                                onChange={async (e) => {
                                  try {
                                    await db.plans.update(p.id, {
                                      sessionId: e.target.value || null,
                                      updatedAt: new Date().toISOString(),
                                      revision: p.revision + 1,
                                    });
                                    notify("Plan completion updated.");
                                  } catch (err) {
                                    notify(String(err));
                                  }
                                }}
                              >
                                <option value="">
                                  {p.date > today() ? "Upcoming" : "Not linked"}
                                </option>
                                {sessions.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.date} · {s.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Build your plan"
                  text="Add target sessions, then link actual training as you complete it."
                  action={false}
                />
              )}
            </Card>
            <Card>
              <SectionTitle
                title="Plan a density session"
                subtitle="Fixed-load targets for your current block"
              />
              <form onSubmit={addPlan}>
                <div className="form-grid one">
                  <Field label="Date">
                    <input
                      type="date"
                      required
                      value={plan.date}
                      min={current.start}
                      max={current.end}
                      onChange={(e) =>
                        setPlan((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Exercise">
                    <select
                      value={plan.exercise}
                      onChange={(e) =>
                        setPlan((p) => ({ ...p, exercise: e.target.value }))
                      }
                    >
                      {data.exercises.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {[
                    ["load", "Load (" + settings.unit + ")"],
                    ["reps", "Target repetitions"],
                    ["minutes", "Window (min)"],
                  ].map(([k, l]) => (
                    <Field key={k} label={l}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={plan[k as keyof typeof plan]}
                        onChange={(e) =>
                          setPlan((p) => ({ ...p, [k]: e.target.value }))
                        }
                      />
                    </Field>
                  ))}
                </div>
                <button className="button primary small" type="submit">
                  <Plus size={15} />
                  Add target
                </button>
              </form>
            </Card>
          </div>
          <Card>
            <SectionTitle
              title="Cycle comparison"
              subtitle="Raw totals and normalized denominators; unequal blocks remain explicit"
              action={
                <select
                  aria-label="Comparison cycle"
                  value={compare?.id || ""}
                  onChange={(e) => setCompareId(e.target.value)}
                >
                  {data.cycles
                    .filter((c) => c.id !== current.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              }
            />
            {a && b ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Descriptor</th>
                      <th>{current.name}</th>
                      <th>{compare?.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Recorded sessions", a.sessions, b.sessions],
                      [
                        "Planned duration (weeks)",
                        number(a.weeks, 1),
                        number(b.weeks, 1),
                      ],
                      [
                        "External volume (" + settings.unit + "·rep)",
                        number(fromKg(a.volume, settings.unit)),
                        number(fromKg(b.volume, settings.unit)),
                      ],
                      [
                        "Volume / planned week",
                        number(fromKg(a.perWeek, settings.unit)),
                        number(fromKg(b.perWeek, settings.unit)),
                      ],
                      [
                        "Volume / recorded session",
                        number(
                          a.perSession === null
                            ? null
                            : fromKg(a.perSession, settings.unit),
                        ),
                        number(
                          b.perSession === null
                            ? null
                            : fromKg(b.perSession, settings.unit),
                        ),
                      ],
                      [
                        "Volume coverage (performances)",
                        a.coverage,
                        b.coverage,
                      ],
                    ].map(([label, x, y]) => (
                      <tr key={String(label)}>
                        <th>{label}</th>
                        <td>{x}</td>
                        <td>{y}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="Another cycle required" action={false} />
            )}
            <p className="muted">
              Current blocks may be incomplete. These totals describe recorded
              work, not adaptation. Use Load Profiles for matched load-specific
              performance.
            </p>
            <button
              className="text-button"
              onClick={() => navigate("profiles")}
            >
              Compare matched load profiles <ArrowRight size={15} />
            </button>
          </Card>
        </>
      ) : (
        <Card>
          <Empty
            title="Create your first training cycle"
            text="Set dates, goals, frequency and planned deloads, then connect actual sessions."
            action={false}
          />
        </Card>
      )}
    </>
  );
}
export function Biomechanics() {
  const { settings } = useLab();
  const [form, setForm] = useState({
      mass: "",
      height: "",
      seconds: "",
      session: "",
      reps: "1",
      v1: "",
      v2: "",
      dt: "",
    }),
    [model, setModel] = useState("vertical"),
    [source, setSource] = useState("entered assumption");
  const numeric = (s: string) => (s.trim() ? Number(s) : NaN);
  const result =
    model === "vertical"
      ? biomechanics(
          toKg(numeric(form.mass), settings.unit),
          numeric(form.height),
          numeric(form.seconds),
          numeric(form.session) * 60,
        )
      : null;
  const a = acceleration(numeric(form.v1), numeric(form.v2), numeric(form.dt));
  const validReps =
    Number.isInteger(Number(form.reps)) && Number(form.reps) > 0;
  return (
    <>
      <div className="toolbar">
        <Badge tone="blue">MODEL-BASED ESTIMATES</Badge>
        <Help topic="biomechanics" />
      </div>
      <div className="grid-two">
        <Card>
          <SectionTitle
            title="Define the measurement model"
            subtitle="Every output depends on explicit inputs"
          />
          <div className="form-grid">
            <Field label="Movement model">
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="vertical">
                  Simplified vertical external lift
                </option>
                <option value="machine">
                  Machine / cable / horizontal (unsupported)
                </option>
              </select>
            </Field>
            <Field label="Displacement provenance">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option>entered assumption</option>
                <option>manually measured</option>
                <option>device measured</option>
              </select>
            </Field>
            {[
              ["mass", "External mass (" + settings.unit + ")"],
              ["height", "Vertical ascent per rep (m)"],
              ["seconds", "Concentric time per rep (s)"],
              ["session", "Session elapsed time (min)"],
              ["reps", "Repetitions with this displacement"],
            ].map(([k, l]) => (
              <Field key={k} label={l}>
                <input
                  type="number"
                  min={k === "mass" || k === "height" ? 0 : 0.001}
                  step="any"
                  value={form[k as keyof typeof form]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [k]: e.target.value }))
                  }
                />
              </Field>
            ))}
          </div>
          <p className="muted">
            A repeated displacement assumption is labeled as modeled, even when
            the source is a manual measurement. These calculator inputs do not
            create workout observations.
          </p>
        </Card>
        <Card>
          <SectionTitle
            title="External mechanics"
            subtitle={
              model === "vertical"
                ? "g = 9.80665 m/s² · upward-positive"
                : "Unsupported movement model"
            }
          />
          {result && validReps ? (
            <div className="physics-results">
              {[
                ["Gravitational force", result.force, "N", "mg"],
                ["Positive work per rep", result.work, "J", "mgΔh"],
                [
                  "Total modeled positive work",
                  result.work * Number(form.reps),
                  "J",
                  "reps × mgΔh",
                ],
                [
                  "Average concentric power",
                  result.power,
                  "W",
                  "work / movement time",
                ],
                [
                  "Average displacement velocity",
                  result.velocity,
                  "m/s",
                  "Δs / Δt",
                ],
                [
                  "Session-level work rate",
                  result.sessionRate * Number(form.reps),
                  "W",
                  "total positive work / session time",
                ],
              ].map(([l, v, u, f]) => (
                <div key={String(l)}>
                  <span>
                    {l}
                    <small>{f}</small>
                  </span>
                  <strong>
                    {number(Number(v), 2)} <small>{u}</small>
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title={
                model === "vertical"
                  ? "Complete the required inputs"
                  : "Appropriate model required"
              }
              text={
                model === "vertical"
                  ? "Load alone cannot establish work, power or velocity."
                  : "Machine stack labels and horizontal movement require geometry, friction and effective-resistance information."
              }
              action={false}
            />
          )}
          <Badge>{source.toUpperCase()}</Badge>
        </Card>
      </div>
      <Card>
        <SectionTitle
          title="Optional acceleration and applied force"
          subtitle="Requires measured velocity changes and a matching interval"
        />
        <div className="form-grid">
          {[
            ["v1", "Initial vertical velocity (m/s)"],
            ["v2", "Final vertical velocity (m/s)"],
            ["dt", "Interval (s)"],
          ].map(([k, l]) => (
            <Field key={k} label={l}>
              <input
                type="number"
                step="any"
                value={form[k as keyof typeof form]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
              />
            </Field>
          ))}
        </div>
        <div className="detail-grid">
          <span>Average acceleration</span>
          <strong>{number(a, 3)} m/s²</strong>
          <span>Simplified applied external force</span>
          <strong>
            {number(
              a !== null && result
                ? toKg(Number(form.mass), settings.unit) * (9.80665 + a)
                : null,
              2,
            )}{" "}
            N
          </strong>
        </div>
        <p className="muted">
          Net force ma differs from applied force m(g+a). Neither establishes
          muscle or joint force. No peak or instantaneous measurements are
          inferred.
        </p>
      </Card>
    </>
  );
}
export function ConditioningPage() {
  const { settings, navigate } = useLab(),
    d = useScope();
  const [activity, setActivity] = useState("Running"),
    [distance, setDistance] = useState("");
  const rows = d.conditioning
    .filter(
      (c) =>
        c.activity === activity &&
        (!distance || Math.abs(c.distanceM - Number(distance)) < 0.001),
    )
    .map((c) => ({
      ...c,
      date: d.sessions.find((s) => s.id === c.sessionId)!.date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const distances = Array.from(
    new Set(
      d.conditioning
        .filter((c) => c.activity === activity)
        .map((c) => c.distanceM),
    ),
  );
  const latest = rows.at(-1);
  const sec = latest ? pace(latest.distanceM, latest.durationSec) : null;
  function paceLabel(seconds: number | null) {
    return seconds === null
      ? "—"
      : `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
  }
  return (
    <>
      <div className="toolbar">
        <div className="inline-fields">
          <select
            aria-label="Conditioning activity"
            value={activity}
            onChange={(e) => {
              setActivity(e.target.value);
              setDistance("");
            }}
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
          <select
            aria-label="Conditioning distance"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          >
            <option value="">All distances · descriptive rates</option>
            {distances.map((m) => (
              <option key={m} value={m}>
                {m} m · matched distance
              </option>
            ))}
          </select>
        </div>
        <Help topic="conditioning" />
      </div>
      <div className="metrics four">
        <Metric
          label="Latest distance"
          value={number(latest?.distanceM)}
          unit="m"
        />
        <Metric
          label="Latest elapsed pace"
          value={paceLabel(sec)}
          unit="min/km"
        />
        <Metric
          label="Latest speed"
          value={number(
            latest ? speed(latest.distanceM, latest.durationSec)! * 3.6 : null,
            1,
          )}
          unit="km/h"
        />
        <Metric
          label="Recorded heart rate"
          value={latest?.hr ?? "—"}
          unit="bpm"
          detail="Entered average, not a sensor stream"
        />
      </div>
      <Card>
        <SectionTitle
          title={activity + " performance"}
          subtitle="Activity-specific observations · elapsed-time convention"
        />
        {rows.length ? (
          <Chart
            title="Conditioning progression"
            rows={rows.map((r) => ({
              date: r.date,
              distance_m: r.distanceM,
              duration_sec: r.durationSec,
              pace_sec_per_km: pace(r.distanceM, r.durationSec),
              hr: r.hr,
            }))}
            option={lineOption(
              rows.map((r) => dateLabel(r.date)),
              [
                {
                  name: "Elapsed pace",
                  values: rows.map((r) => pace(r.distanceM, r.durationSec)),
                },
              ],
              "s/km",
            )}
          />
        ) : (
          <Empty
            title="No conditioning observations"
            text="Select Conditioning in the workout logger to record distance, duration and intervals."
          />
        )}
      </Card>
      <div className="grid-two">
        <Card>
          <SectionTitle title="Latest interval breakdown" />
          {latest?.intervals.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Interval</th>
                    <th>Work</th>
                    <th>Rest</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.intervals.map((v, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{v.workSec} s</td>
                      <td>{v.restSec} s</td>
                      <td>{v.distanceM} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="No interval observations" action={false} />
          )}
        </Card>
        <Card>
          <SectionTitle
            title="Activity-specific records"
            subtitle="A fixed distance is required for a time record"
          />
          {distance && rows.length ? (
            <div className="large-number">
              {number(Math.min(...rows.map((r) => r.durationSec)) / 60, 2)}
              <small>
                min · {distance} m · {activity}
              </small>
            </div>
          ) : (
            <p className="muted">
              Choose a recorded fixed distance to view the shortest elapsed-time
              observation. Terrain, equipment and conditions can still differ.
            </p>
          )}
          <p className="muted">
            Different activities are never combined into a universal workload
            score.
          </p>
        </Card>
      </div>
    </>
  );
}
export function WellnessPanel() {
  const { db, data, settings, notify } = useLab();
  const [open, setOpen] = useState(false),
    [trends, setTrends] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    date: today(),
    sleep: "",
    quality: "3",
    fatigue: "3",
    soreness: "3",
    readiness: "3",
    stress: "3",
    motivation: "3",
    mass: "",
  });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const old = data.wellness.find((w) => w.date === form.date);
      const record = wellnessSchema.parse({
        ...stamp(old?.id),
        date: form.date,
        sleep: Number(form.sleep),
        quality: Number(form.quality),
        fatigue: Number(form.fatigue),
        soreness: Number(form.soreness),
        readiness: Number(form.readiness),
        stress: Number(form.stress),
        motivation: Number(form.motivation),
        bodyMassKg: form.mass ? toKg(Number(form.mass), settings.unit) : null,
      });
      await db.wellness.put(record);
      notify("Wellness observation saved.");
      setOpen(false);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }
  const recent = [...data.wellness].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  return (
    <Card>
      <SectionTitle
        title="Subjective readiness"
        subtitle="Optional context, never a recovery diagnosis"
        action={
          <button className="button small" onClick={() => setOpen((v) => !v)}>
            <Plus size={14} />
            Check in
          </button>
        }
      />
      {open ? (
        <form onSubmit={save}>
          <div className="form-grid">
            <Field label="Date">
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Sleep (hours)">
              <input
                required
                type="number"
                min="0"
                max="24"
                step="0.1"
                value={form.sleep}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sleep: e.target.value }))
                }
              />
            </Field>
            {[
              ["quality", "Sleep quality"],
              ["fatigue", "Fatigue"],
              ["soreness", "Soreness"],
              ["readiness", "Readiness"],
              ["stress", "Stress"],
              ["motivation", "Motivation"],
            ].map(([k, l]) => (
              <Field key={k} label={l + " (1 low – 5 high)"}>
                <select
                  value={form[k as keyof typeof form]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [k]: e.target.value }))
                  }
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </Field>
            ))}
            <Field label={"Body mass (" + settings.unit + ", optional)"}>
              <input
                type="number"
                min="1"
                step="any"
                value={form.mass}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mass: e.target.value }))
                }
              />
            </Field>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button primary small">
            Save check-in
          </button>
        </form>
      ) : recent ? (
        <div className="wellness-overview">
          <div>
            <span>Sleep</span>
            <strong>
              {recent.sleep}
              <small> h</small>
            </strong>
          </div>
          <div>
            <span>Readiness</span>
            <strong>
              {recent.readiness}
              <small> / 5</small>
            </strong>
          </div>
          <div>
            <span>Fatigue</span>
            <strong>
              {recent.fatigue}
              <small> / 5</small>
            </strong>
          </div>
          <small>Latest: {recent.date}</small>
        </div>
      ) : (
        <p className="muted">
          Sleep, soreness, fatigue, stress and readiness provide subjective
          context for performance.
        </p>
      )}
      <div className="form-footer">
        <button className="text-button" onClick={() => setTrends((v) => !v)}>
          {trends ? "Hide" : "View"} wellness and training-load trends
        </button>
        <Help topic="recovery" />
      </div>
      {trends && (
        <div className="grid-two recovery-charts">
          <div>
            <h3>Subjective wellness</h3>
            <Chart
              title="Subjective wellness"
              rows={[...data.wellness]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((w) => ({
                  date: w.date,
                  sleep_hours: w.sleep,
                  readiness: w.readiness,
                  fatigue: w.fatigue,
                  stress: w.stress,
                  soreness: w.soreness,
                }))}
              option={lineOption(
                [...data.wellness]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((w) => dateLabel(w.date)),
                [
                  {
                    name: "Readiness",
                    values: [...data.wellness]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((w) => w.readiness),
                  },
                  {
                    name: "Fatigue",
                    values: [...data.wellness]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((w) => w.fatigue),
                  },
                ],
                "1–5 rating",
              )}
            />
          </div>
          <div>
            <h3>Session-RPE load</h3>
            <Chart
              title="Session RPE load"
              rows={[...data.sessions]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((s) => ({
                  date: s.date,
                  session_rpe: s.rpe,
                  duration_min: s.durationSec / 60,
                  load_au: sessionLoad(s.rpe, s.durationSec),
                }))}
              option={lineOption(
                [...data.sessions]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((s) => dateLabel(s.date)),
                [
                  {
                    name: "Recorded load",
                    values: [...data.sessions]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((s) => sessionLoad(s.rpe, s.durationSec)),
                  },
                ],
                "AU",
              )}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
