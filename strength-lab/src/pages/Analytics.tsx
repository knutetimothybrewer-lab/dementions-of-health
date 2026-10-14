import { selectedDensityKey, sessionDisplayName } from "../domain/scope";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Target,
} from "lucide-react";
import { useState } from "react";
import Chart, { lineOption } from "../components/Chart";
import { dateLabel, number, useLab, useScope } from "../components/context";
import {
  Badge,
  Card,
  Empty,
  Help,
  Metric,
  SectionTitle,
} from "../components/ui";
import {
  change,
  comparisonKey,
  correlation,
  cycleWeek,
  e1rm,
  fixedLoadKey,
  fromKg,
  linearTrend,
  matchedInsight,
  movingMedian,
  normalizedLoad,
  points,
  qualifying,
  rolling,
  stats,
  toKg,
} from "../domain/metrics";
import { dayNumber, today, type Dataset } from "../domain/model";

function weekStart(date: string, sunday = false) {
  const d = new Date(date + "T12:00:00Z"),
    day = d.getUTCDay();
  return new Date((dayNumber(date) - (sunday ? day : (day + 6) % 7)) * 86400000)
    .toISOString()
    .slice(0, 10);
}
function strengthObservations(
  d: Dataset,
  formula: "Epley" | "Brzycki",
  exerciseId?: string,
) {
  return points(d, exerciseId)
    .flatMap((pt) =>
      d.sets
        .filter((s) => s.performanceId === pt.p.id && qualifying(s, pt.e))
        .flatMap((s) => {
          const value = e1rm(
            normalizedLoad(s.loadKg, pt.e, s.side),
            s.reps,
            formula,
          );
          return value === null
            ? []
            : [{ date: pt.session.date, value, set: s, pt }];
        }),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
function Insight({ rows }: { rows: ReturnType<typeof points> }) {
  const insight = matchedInsight(rows);
  return insight ? (
    <div className="insight">
      <div className="insight-icon">
        <Activity size={19} />
      </div>
      <div>
        <Badge tone="teal">Recorded observation · n={rows.length}</Badge>
        <p>{insight.text}</p>
        <small>{insight.limitation}</small>
      </div>
    </div>
  ) : null;
}

function useDensitySelection() {
  const { analysis, filters, selectDensity } = useLab();
  const d = useScope({ exercise: "" });
  const pts = points(d, undefined, true);
  const active = selectedDensityKey(d, analysis.densityKey, filters.exercise);
  const choose = (key: string) => {
    const pt = pts.find((p) => fixedLoadKey(p.p, d) === key);
    if (pt) selectDensity(key, pt.e.id);
  };
  return { d, pts, active, choose };
}

export function Dashboard() {
  const { settings, data, navigate, filters, analysis } = useLab(),
    d = useScope(),
    unit = settings.unit;
  const pts = points(d),
    allDensity = points(d, undefined, true),
    densityKey = selectedDensityKey(d, analysis.densityKey, filters.exercise),
    matched = allDensity.filter((p) => fixedLoadKey(p.p, d) === densityKey),
    latest = matched.at(-1);
  const currentWeek = weekStart(today(), settings.weekStart === "sunday");
  const customPeriod = Boolean(filters.from || filters.to);
  const weekPts = pts.filter(
    (p) =>
      customPeriod ||
      (p.session.date >= currentWeek && p.session.date <= today()),
  );
  const weekSessions = d.sessions.filter(
    (s) => customPeriod || (s.date >= currentWeek && s.date <= today()),
  );
  const volume = weekPts.reduce((s, p) => s + (p.volume ?? 0), 0),
    omitted = weekPts.filter((p) => p.volume === null).length;
  const previousWeek = new Date((dayNumber(currentWeek) - 7) * 86400000)
    .toISOString()
    .slice(0, 10);
  const previousVolume = pts
    .filter(
      (p) => p.session.date >= previousWeek && p.session.date < currentWeek,
    )
    .reduce((s, p) => s + (p.volume ?? 0), 0);
  const pct = customPeriod ? null : change(volume, previousVolume);
  const currentCycle =
    data.cycles.find((c) => c.id === filters.cycle) ||
    data.cycles.find((c) => today() >= c.start && today() <= c.end);
  const weekMap = new Map<string, number>();
  for (let i = 7; i >= 0; i--)
    weekMap.set(
      new Date(
        (dayNumber(
          weekStart(filters.to || today(), settings.weekStart === "sunday"),
        ) -
          i * 7) *
          86400000,
      )
        .toISOString()
        .slice(0, 10),
      0,
    );
  pts.forEach((p) => {
    const w = weekStart(p.session.date, settings.weekStart === "sunday");
    if (weekMap.has(w)) weekMap.set(w, weekMap.get(w)! + (p.volume ?? 0));
  });
  const strength = strengthObservations(
      d,
      analysis.formula,
      filters.exercise || undefined,
    ),
    lastStrength = strength.at(-1);
  const recent = [...d.sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  return (
    <>
      <div className="hero-strip">
        <div>
          <span className="eyebrow">YOUR PERSONAL PERFORMANCE LABORATORY</span>
          <h2>
            Every session.
            <br />
            <em>A clearer picture.</em>
          </h2>
          <p>Track the work. Understand the change.</p>
        </div>
        <div className="hero-readout">
          <span className="hero-ring">
            <Activity size={31} />
          </span>
          <div>
            <Badge tone="teal">
              {currentCycle
                ? today() > currentCycle.end
                  ? "COMPLETED BLOCK"
                  : today() < currentCycle.start
                    ? "UPCOMING BLOCK"
                    : "BLOCK IN PROGRESS"
                : "READY WHEN YOU ARE"}
            </Badge>
            <h3>{currentCycle?.name || "Your next chapter"}</h3>
            <p>
              {currentCycle
                ? `${today() > currentCycle.end ? "Completed" : today() < currentCycle.start ? "Upcoming" : `Week ${cycleWeek(today(), currentCycle.start)}`} · ${currentCycle.goal}`
                : "Start with a session. Build your baseline."}
            </p>
            <button
              className="text-button"
              onClick={() => navigate(currentCycle ? "cycles" : "log")}
            >
              {currentCycle ? "View training block" : "Log your first session"}{" "}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
      <div className="section-label">
        {customPeriod ? "SELECTED PERIOD" : "THIS WEEK"}{" "}
        <span>
          {customPeriod ? filters.from || "Beginning" : dateLabel(currentWeek)}{" "}
          — {customPeriod ? filters.to || "Latest" : dateLabel(today())} ·
          selected filters apply
        </span>
      </div>
      <div className="metrics four">
        <Metric
          label="External volume load"
          value={number(fromKg(volume, unit))}
          unit={`${unit}·rep`}
          detail={
            omitted
              ? `${omitted} unsupported performances excluded`
              : pct === null
                ? "Recorded volume · not mechanical work"
                : `${pct >= 0 ? "+" : ""}${number(pct, 1)}% vs prior week · context matters`
          }
          accent
        />
        <Metric
          label="Training frequency"
          value={weekSessions.length}
          unit="sessions"
          detail={`${new Set(weekSessions.map((s) => s.date)).size} training days in this period`}
        />
        <Metric
          label="Latest density performance"
          value={latest ? latest.reps : "—"}
          unit="reps"
          detail={
            latest
              ? `${latest.e.name} · ${number(fromKg(latest.p.loadKg ?? 0, unit))} ${unit} · ${number(latest.p.durationSec / 60)} min`
              : "No density session recorded"
          }
        />
        <Metric
          label="Training time"
          value={number(
            weekSessions.reduce((s, x) => s + x.durationSec, 0) / 60,
          )}
          unit="min"
          detail={`${weekPts.reduce((s, p) => s + p.hardSets, 0)} known hard sets · ${weekPts.reduce((s, p) => s + p.effortUnknown, 0)} effort unknown`}
        />
      </div>
      <div className="grid-main">
        <Card>
          <SectionTitle
            title="Training volume"
            subtitle="Weekly external-load volume · last 8 weeks"
            action={<Badge>8 WEEK VIEW</Badge>}
          />
          {pts.length ? (
            <Chart
              title="Weekly training volume"
              rows={[...weekMap].map(([w, v]) => ({
                week: w,
                volume: fromKg(v, unit),
                unit: unit + "·rep",
              }))}
              option={{
                xAxis: {
                  type: "category",
                  data: [...weekMap.keys()].map(dateLabel),
                  axisTick: { show: false },
                  axisLine: { lineStyle: { color: "#33414f" } },
                  axisLabel: { fontSize: 10 },
                },
                yAxis: {
                  type: "value",
                  name: unit + "·rep",
                  splitLine: { lineStyle: { color: "#8796a61c" } },
                },
                series: [
                  {
                    type: "bar",
                    data: [...weekMap.values()].map((v) => fromKg(v, unit)),
                    barWidth: "42%",
                    itemStyle: { color: "#659df7", borderRadius: [4, 4, 0, 0] },
                  },
                ],
              }}
            />
          ) : (
            <Empty />
          )}
          <div className="panel-foot">
            <span className="legend-dot blue" />
            Recorded external volume{" "}
            <span className="muted">
              A training descriptor, not an adaptation score.
            </span>
          </div>
        </Card>
        <Card>
          <SectionTitle
            title="Density progression"
            subtitle={
              latest
                ? `${latest.e.name} · ${number(fromKg(latest.p.loadKg ?? 0, unit))} ${unit} · ${latest.p.durationSec / 60} min`
                : "Your fixed-load performance"
            }
          />
          {matched.length ? (
            <>
              <Chart
                title="Fixed-load repetitions"
                option={lineOption(
                  matched.map((x) => dateLabel(x.session.date)),
                  [
                    {
                      name: "Recorded reps",
                      values: matched.map((x) => x.reps),
                      area: true,
                    },
                  ],
                  "reps",
                )}
                rows={matched.map((x) => ({
                  date: x.session.date,
                  reps: x.reps,
                  load: fromKg(x.p.loadKg ?? 0, unit),
                  window_min: x.p.durationSec / 60,
                }))}
              />
              <div className="mini-stats">
                <div>
                  <span>Latest</span>
                  <strong>
                    {matched.at(-1)?.reps}
                    <small> reps</small>
                  </strong>
                </div>
                <div>
                  <span>Best in selected scope</span>
                  <strong>
                    {Math.max(...matched.map((x) => x.reps))}
                    <small> reps</small>
                  </strong>
                </div>
                <div>
                  <span>Observations</span>
                  <strong>{matched.length}</strong>
                </div>
              </div>
            </>
          ) : (
            <Empty text="Log the same load and window to follow task-specific performance." />
          )}
        </Card>
      </div>
      <div className="grid-main">
        <Card>
          <SectionTitle
            title="Recent sessions"
            subtitle="Your latest recorded work"
            action={
              <button
                className="text-button"
                onClick={() => navigate("history")}
              >
                All sessions <ArrowUpRight size={15} />
              </button>
            }
          />
          {recent.length ? (
            <div className="session-list">
              {recent.map((s) => (
                <button
                  className="session-row"
                  key={s.id}
                  onClick={() => navigate("history")}
                >
                  <span className="session-icon">
                    <CheckCircle2 size={18} />
                  </span>
                  <span>
                    <strong>{sessionDisplayName(data, s)}</strong>
                    <small>
                      {dateLabel(s.date)} · {Math.round(s.durationSec / 60)} min
                    </small>
                  </span>
                  <Badge>
                    {data.performances.some((p) => p.sessionId === s.id)
                      ? "RESISTANCE"
                      : "CONDITIONING"}
                  </Badge>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Card>
        <Card>
          <SectionTitle
            title="Strength snapshot"
            subtitle={
              lastStrength
                ? `${lastStrength.pt.e.name} · ${analysis.formula}`
                : "Qualifying individual sets"
            }
          />
          <div className="strength-readout">
            <span className="eyebrow">ESTIMATED ONE-REP MAX</span>
            <strong>
              {number(
                lastStrength ? fromKg(lastStrength.value, unit) : null,
                1,
              )}
              <small>{unit}</small>
            </strong>
            <Badge tone="blue">Model-based estimate</Badge>
            <p>
              From qualifying individual sets. Density totals do not estimate
              maximal strength.
            </p>
            <button
              className="text-button"
              onClick={() => navigate("strength")}
            >
              Explore strength analytics <ArrowRight size={15} />
            </button>
          </div>
        </Card>
      </div>
      {matched.length > 1 && <Insight rows={matched} />}
    </>
  );
}
export function DensityLab() {
  const { settings } = useLab();
  const { d, pts, active, choose } = useDensitySelection();
  const groups = Array.from(
    new Set(
      pts.filter((x) => x.p.loadKg !== null).map((x) => fixedLoadKey(x.p, d)),
    ),
  );
  const rows = pts.filter((x) => fixedLoadKey(x.p, d) === active);
  const first = rows[0],
    last = rows.at(-1);
  const unit = settings.unit;
  const pct = last && first ? change(last.reps, first.reps) : null;
  const [mode, setMode] = useState("fixed");
  const comparable = last
    ? pts.filter((x) => comparisonKey(x.p, d) === comparisonKey(last.p, d))
    : [];
  const chartRows =
    mode === "fixed"
      ? rows
      : mode === "variable-load"
        ? comparable
        : pts.filter((p) => p.e.id === last?.e.id);
  const rr = chartRows.map((x) => ({
    date: x.session.date,
    load: fromKg(x.p.loadKg ?? 0, unit),
    reps: x.reps,
    window_min: x.p.durationSec / 60,
    volume_density:
      x.volumeDensity === null ? null : fromKg(x.volumeDensity, unit),
  }));
  const detail = last
    ? d.sets
        .filter((s) => s.performanceId === last.p.id)
        .sort((a, b) => a.order - b.order)
    : [];
  const timed = detail.filter((s) => s.endSec !== null);
  const accumulation = timed.map((s, i) => ({
    time_min: s.endSec! / 60,
    cumulative_reps: timed
      .slice(0, i + 1)
      .reduce((total, row) => total + row.reps, 0),
  }));
  return (
    <>
      <div className="toolbar">
        <div className="segmented">
          {[
            ["fixed", "Fixed load / time"],
            ["variable-load", "Variable load / fixed time"],
            ["variable-time", "Variable load / time"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={mode === v ? "active" : ""}
              onClick={() => setMode(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <Help />
      </div>
      <Card className="control-card">
        <label>
          Comparable protocol
          <select value={active} onChange={(e) => choose(e.target.value)}>
            <option value="" disabled>
              No matching protocol selected
            </option>
            {groups.map((g) => {
              const x = pts.find((x) => fixedLoadKey(x.p, d) === g)!;
              return (
                <option key={g} value={g}>
                  {x.e.name} · {number(fromKg(x.p.loadKg ?? 0, unit))} {unit} ·{" "}
                  {x.p.durationSec / 60} min
                </option>
              );
            })}
          </select>
        </label>
        <Badge tone="teal">{rows.length} matched observations</Badge>
      </Card>
      {mode !== "fixed" && (
        <div className="notice">
          {mode === "variable-load"
            ? "Loads differ. Compare load, repetitions and density independently; greater volume does not establish superior performance."
            : "Loads or durations may differ. Normalized rates have limited comparability and do not create a universal performance ranking."}
        </div>
      )}
      <div className="metrics four">
        <Metric
          label="Latest repetitions"
          value={last?.reps ?? "—"}
          unit="reps"
          detail={last?.session.date}
        />
        <Metric
          label="Volume density"
          value={number(
            last?.volumeDensity == null
              ? null
              : fromKg(last.volumeDensity, unit),
            1,
          )}
          unit={unit + "·rep/min"}
        />
        <Metric
          label="Repetition rate"
          value={number(last?.repDensity, 2)}
          unit="reps/min"
        />
        <Metric
          label="Change from first"
          value={pct === null ? "—" : `${pct >= 0 ? "+" : ""}${number(pct, 1)}`}
          unit="%"
          detail={
            first
              ? `Baseline: ${first.reps} reps · ${first.session.date}`
              : "No baseline"
          }
        />
      </div>
      <Card>
        <SectionTitle
          title="Task-specific performance"
          subtitle="Recorded observations; gaps are preserved"
        />
        {chartRows.length ? (
          <Chart
            title="Density performance"
            rows={rr}
            option={lineOption(
              chartRows.map((x) => dateLabel(x.session.date)),
              [
                {
                  name:
                    mode === "fixed" ? "Total repetitions" : "Repetition rate",
                  values: chartRows.map((x) =>
                    mode === "fixed" ? x.reps : x.repDensity,
                  ),
                  area: true,
                },
                {
                  name: "Five-observation mean",
                  values: rolling(
                    chartRows.map((x) =>
                      mode === "fixed" ? x.reps : (x.repDensity ?? 0),
                    ),
                  ),
                },
              ],
              mode === "fixed" ? "reps" : "reps/min",
            )}
          />
        ) : (
          <Empty />
        )}
      </Card>
      <div className="grid-two">
        <Card>
          <SectionTitle
            title="Within-session accumulation"
            subtitle="Latest matched session · set completion times"
          />
          {accumulation.length ? (
            <Chart
              title="Cumulative repetitions"
              rows={accumulation}
              option={{
                xAxis: {
                  type: "value",
                  name: "elapsed min",
                  max: last!.p.durationSec / 60,
                },
                yAxis: { type: "value", name: "reps" },
                series: [
                  {
                    type: "line",
                    step: "end",
                    data: [
                      [0, 0],
                      ...accumulation.map((a) => [
                        a.time_min,
                        a.cumulative_reps,
                      ]),
                    ],
                  },
                ],
              }}
            />
          ) : (
            <Empty
              title="Timestamps required"
              text="Quick logs do not reveal pacing, rest intervals or within-session fatigue."
              action={false}
            />
          )}
        </Card>
        <Card>
          <SectionTitle
            title="Detail coverage"
            subtitle="Additional analysis needs additional observations"
          />
          <div className="detail-grid">
            <span>Individual sets</span>
            <strong>{detail.length || "Not recorded"}</strong>
            <span>Average reps/set</span>
            <strong>
              {number(
                detail.length
                  ? detail.reduce((s, x) => s + x.reps, 0) / detail.length
                  : null,
                1,
              )}
            </strong>
            <span>Observed rest intervals</span>
            <strong>{detail.filter((s) => s.restSec !== null).length}</strong>
            <span>Average recorded rest</span>
            <strong>
              {number(
                detail.some((s) => s.restSec !== null)
                  ? detail.reduce((s, x) => s + (x.restSec ?? 0), 0) /
                      detail.filter((s) => s.restSec !== null).length
                  : null,
                1,
              )}{" "}
              s
            </strong>
            <span>Interpretation</span>
            <strong>Descriptive only</strong>
          </div>
        </Card>
      </div>
      <Insight rows={rows} />
    </>
  );
}
export function StrengthAnalytics() {
  const { settings, filters, setFilters, analysis, setAnalysis } = useLab();
  const d = useScope({ exercise: "" });
  const formula = analysis.formula;
  const eligibleIds = d.exercises.map((e) => e.id);
  const active =
    filters.exercise ||
    strengthObservations(d, formula).at(-1)?.pt.e.id ||
    points(d).at(-1)?.e.id ||
    "";
  const obs = strengthObservations(d, formula, active);
  const best = obs.length ? Math.max(...obs.map((o) => o.value)) : null;
  const latest = obs.at(-1);
  const measured = points(d, active).flatMap((pt) =>
    d.sets
      .filter(
        (s) =>
          s.performanceId === pt.p.id &&
          s.testedMax &&
          s.reps === 1 &&
          !s.warmup &&
          ["total", "per-implement"].includes(pt.e.convention),
      )
      .map((s) => ({
        date: pt.session.date,
        value: normalizedLoad(s.loadKg, pt.e, s.side),
      })),
  );
  return (
    <>
      <div className="toolbar">
        <div className="inline-fields">
          <select
            aria-label="Strength exercise"
            value={active}
            onChange={(e) =>
              setFilters({ ...filters, exercise: e.target.value })
            }
          >
            <option value="" disabled>
              Select an exercise
            </option>
            {eligibleIds.map((id) => (
              <option key={id} value={id}>
                {d.exercises.find((e) => e.id === id)?.name}
              </option>
            ))}
          </select>
          <select
            aria-label="1RM equation"
            value={formula}
            onChange={(e) =>
              setAnalysis({
                ...analysis,
                formula: e.target.value as "Epley" | "Brzycki",
              })
            }
          >
            <option>Epley</option>
            <option>Brzycki</option>
          </select>
        </div>
        <Help topic="strength" />
      </div>
      <div className="metrics four">
        <Metric
          label="Latest estimated 1RM"
          value={number(latest ? fromKg(latest.value, settings.unit) : null, 1)}
          unit={settings.unit}
          detail={formula + " · model-based"}
        />
        <Metric
          label="Best estimated 1RM"
          value={number(best === null ? null : fromKg(best, settings.unit), 1)}
          unit={settings.unit}
        />
        <Metric
          label="Tested maximum"
          value={number(
            measured.length
              ? fromKg(Math.max(...measured.map((m) => m.value)), settings.unit)
              : null,
            1,
          )}
          unit={settings.unit}
          detail="Explicitly recorded maximum test"
        />
        <Metric
          label="Relative estimated strength"
          value={number(
            latest && latest.pt.p.bodyMassKg
              ? latest.value / latest.pt.p.bodyMassKg
              : null,
            2,
          )}
          unit="× BW"
          detail="Uses recorded body-mass context"
        />
      </div>
      <Card>
        <SectionTitle
          title="Estimated strength progression"
          subtitle="Only qualifying individual sets · 2–10 reps, RIR ≤1 or RPE ≥9"
        />
        {obs.length ? (
          <Chart
            title="Estimated strength"
            option={lineOption(
              obs.map((o) => dateLabel(o.date)),
              [
                {
                  name: formula + " estimate",
                  values: obs.map((o) => fromKg(o.value, settings.unit)),
                },
              ],
              settings.unit,
            )}
            rows={obs.map((o) => ({
              date: o.date,
              load: fromKg(o.set.loadKg, settings.unit),
              reps: o.set.reps,
              rir: o.set.rir,
              estimated_1rm: fromKg(o.value, settings.unit),
              formula,
            }))}
          />
        ) : (
          <Empty
            title="No qualifying strength sets"
            text="Record individual near-maximal sets. Accumulated density repetitions never enter this calculation."
          />
        )}
      </Card>
      <div className="notice">
        Estimates and tested maxima are separate. Formula choice, effort and
        exercise mechanics affect accuracy. Formula disagreement is not a
        confidence interval.
      </div>
    </>
  );
}
export function LoadProfiles() {
  const { settings, analysis, selectDensity } = useLab();
  const { d, pts, active: densityKey } = useDensitySelection();
  const [aggregation, setAggregation] = useState("latest"),
    [profileView, setProfileView] = useState("line"),
    [reference, setReference] = useState(""),
    [zoneMode, setZoneMode] = useState("current");
  const keys = Array.from(new Set(pts.map((x) => comparisonKey(x.p, d))));
  const selected = pts.find((x) => fixedLoadKey(x.p, d) === densityKey);
  const active = selected ? comparisonKey(selected.p, d) : "";
  const matched = pts.filter(
    (x) => comparisonKey(x.p, d) === active && x.p.loadKg !== null,
  );
  const loads = Array.from(new Set(matched.map((x) => x.p.loadKg!))).sort(
    (a, b) => a - b,
  );
  const cycles = Array.from(
    new Set(matched.map((x) => x.session.cycleId || "uncategorized")),
  );
  const profile = cycles.map((c) => ({
    cycle: c,
    name: d.cycles.find((x) => x.id === c)?.name || "No cycle",
    values: loads.map((l) => {
      const rows = matched.filter(
        (x) =>
          Math.abs(x.p.loadKg! - l) < 0.00001 &&
          (x.session.cycleId || "uncategorized") === c,
      );
      if (!rows.length) return null;
      return aggregation === "best"
        ? Math.max(...rows.map((x) => x.reps))
        : rows.at(-1)!.reps;
    }),
  }));
  const heat = loads.flatMap((l, i) => {
    const rows = matched.filter((x) => Math.abs(x.p.loadKg! - l) < 0.00001);
    const pct =
      rows.length > 1 ? change(rows.at(-1)!.reps, rows[0].reps) : null;
    return pct === null ? [] : [[i, 0, Number(pct.toFixed(2))]];
  });
  const refs = strengthObservations(d, analysis.formula, matched[0]?.e.id),
    currentRef =
      Number(reference) > 0
        ? toKg(Number(reference), settings.unit)
        : refs.at(-1)?.value;
  const zoneBounds = settings.zones || [60, 70, 80, 90];
  const zoneNames = [
    `<${zoneBounds[0]}%`,
    ...zoneBounds.slice(0, -1).map((v, i) => `${v}–${zoneBounds[i + 1]}%`),
    `≥${zoneBounds[3]}%`,
  ];
  const profileRows = matched.map((x) => {
    const historical = refs
      .filter((r) => r.date <= x.session.date)
      .at(-1)?.value;
    const ref = zoneMode === "historical" ? historical : currentRef;
    const percent = ref ? (100 * x.p.loadKg!) / ref : null;
    return {
      date: x.session.date,
      load: fromKg(x.p.loadKg!, settings.unit),
      reps: x.reps,
      cycle: d.cycles.find((c) => c.id === x.session.cycleId)?.name || "None",
      relative_intensity_pct: percent,
      reference: zoneMode,
      intensity_zone:
        percent === null
          ? null
          : zoneNames[zoneBounds.filter((z) => percent >= z).length],
    };
  });
  return (
    <>
      <div className="toolbar">
        <div className="inline-fields">
          <select
            aria-label="Load profile protocol"
            value={active}
            onChange={(e) => {
              const pt = pts
                .filter((x) => comparisonKey(x.p, d) === e.target.value)
                .at(-1);
              if (pt) selectDensity(fixedLoadKey(pt.p, d), pt.e.id);
            }}
          >
            <option value="" disabled>
              No matching protocol selected
            </option>
            {keys.map((k) => {
              const x = pts.find((x) => comparisonKey(x.p, d) === k)!;
              return (
                <option key={k} value={k}>
                  {x.e.name} · {x.p.durationSec / 60} min
                </option>
              );
            })}
          </select>
          <select
            aria-label="Profile visualization"
            value={profileView}
            onChange={(e) => setProfileView(e.target.value)}
          >
            <option value="line">Cycle curves</option>
            <option value="scatter">Measured scatterplot</option>
          </select>
          <select
            aria-label="Profile aggregation"
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
          >
            <option value="latest">Latest per load / cycle</option>
            <option value="best">Best per load / cycle</option>
          </select>
        </div>
        <Help />
      </div>
      <Card>
        <SectionTitle
          title="The load–repetition relationship"
          subtitle="Cycle profiles combine different dates; each point is a recorded observation"
          action={
            <Badge tone="blue">{aggregation.toUpperCase()} OBSERVATIONS</Badge>
          }
        />
        {matched.length ? (
          <Chart
            title="Load profiles"
            rows={profileRows}
            option={{
              legend: { top: 0, textStyle: { color: "#8796a6" } },
              xAxis: { type: "value", name: "load (" + settings.unit + ")" },
              yAxis: { type: "value", name: "reps" },
              series: profile.map((s) => ({
                name: s.name,
                type: profileView === "scatter" ? "scatter" : "line",
                connectNulls: false,
                symbolSize: 9,
                data: loads.map((l, i) => [
                  fromKg(l, settings.unit),
                  s.values[i],
                ]),
              })),
            }}
          />
        ) : (
          <Empty
            title="No load profile yet"
            text="Log the same exercise and duration at several loads. Missing observations will remain gaps."
          />
        )}
      </Card>
      <div className="grid-two">
        <Card>
          <SectionTitle
            title="Load-specific change"
            subtitle="First to latest matched observation at each load"
          />
          {heat.length ? (
            <Chart
              title="Load improvement heatmap"
              rows={loads.map((l) => {
                const r = matched.filter(
                  (x) => Math.abs(x.p.loadKg! - l) < 0.00001,
                );
                return {
                  load: fromKg(l, settings.unit),
                  first: r[0].reps,
                  latest: r.at(-1)!.reps,
                  n: r.length,
                  change_pct:
                    r.length > 1 ? change(r.at(-1)!.reps, r[0].reps) : null,
                };
              })}
              height={220}
              option={{
                grid: { left: 40, right: 20, top: 20, bottom: 65 },
                xAxis: {
                  type: "category",
                  data: loads.map(
                    (l) =>
                      number(fromKg(l, settings.unit)) + " " + settings.unit,
                  ),
                },
                yAxis: { type: "category", data: ["Change"] },
                visualMap: {
                  min: Math.min(0, ...heat.map((h) => h[2])),
                  max: Math.max(20, ...heat.map((h) => h[2])),
                  orient: "horizontal",
                  left: "center",
                  bottom: 0,
                  inRange: { color: ["#263746", "#78d9c5"] },
                  textStyle: { color: "#8796a6" },
                },
                series: [
                  {
                    type: "heatmap",
                    data: heat,
                    label: {
                      show: true,
                      formatter: (p) => (p.value as number[])[2] + "%",
                      color: "#10202a",
                    },
                  },
                ],
                tooltip: {
                  trigger: "item",
                  formatter: (p) =>
                    "Change: " +
                    ((Array.isArray(p) ? p[0] : p).value as number[])[2] +
                    "%",
                },
              }}
            />
          ) : (
            <Empty title="Repeat observations needed" action={false} />
          )}
        </Card>
        <Card>
          <SectionTitle
            title="Relative-intensity context"
            subtitle="Descriptive zones, not physiological boundaries"
          />
          <div className="form-grid">
            <label className="field">
              <span>Current reference 1RM ({settings.unit})</span>
              <input
                type="number"
                min="1"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional measured reference"
              />
            </label>
            <label className="field">
              <span>Reference context</span>
              <select
                value={zoneMode}
                onChange={(e) => setZoneMode(e.target.value)}
              >
                <option value="current">Current reference recalculation</option>
                <option value="historical">
                  Historical qualifying estimate
                </option>
              </select>
            </label>
          </div>
          <p className="muted">
            Historical references use qualifying observations available on or
            before each date. A current override never rewrites history. If no
            reference exists, intensity is unavailable.
          </p>
          <div className="zone-list">
            {zoneNames.map((z, i) => (
              <Badge key={z} tone={i > 2 ? "blue" : "neutral"}>
                {z}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
export function Research() {
  const { settings } = useLab();
  const { d, pts, active, choose } = useDensitySelection();
  const [outcome, setOutcome] = useState("reps"),
    [threshold, setThreshold] = useState("2");
  const keys = Array.from(
    new Set(
      pts.filter((x) => x.p.loadKg !== null).map((x) => fixedLoadKey(x.p, d)),
    ),
  );
  const rows = pts.filter((x) => fixedLoadKey(x.p, d) === active);
  const values = rows.map((x) =>
    outcome === "reps"
      ? x.reps
      : x.volumeDensity === null
        ? null
        : fromKg(x.volumeDensity, settings.unit),
  );
  const validRows = rows.flatMap((x, i) =>
    values[i] === null ? [] : [{ date: x.session.date, value: values[i]! }],
  );
  const summary = stats(validRows.map((r) => r.value)),
    trend = linearTrend(validRows),
    sufficient = trend && trend.n >= 4 && trend.span >= 14;
  const pairs = rows.flatMap((x) => {
    const w = d.wellness.find((w) => w.date === x.session.date);
    return w
      ? [{ readiness: w.readiness, reps: x.reps, date: x.session.date }]
      : [];
  });
  const r =
    pairs.length >= 8
      ? correlation(
          pairs.map((p) => p.readiness),
          pairs.map((p) => p.reps),
        )
      : null;
  return (
    <>
      <div className="toolbar">
        <div className="inline-fields">
          <select
            aria-label="Research protocol"
            value={active}
            onChange={(e) => choose(e.target.value)}
          >
            <option value="" disabled>
              No matching protocol selected
            </option>
            {keys.map((k) => {
              const x = pts.find((x) => fixedLoadKey(x.p, d) === k)!;
              return (
                <option key={k} value={k}>
                  {x.e.name} · {number(fromKg(x.p.loadKg ?? 0, settings.unit))}{" "}
                  {settings.unit} · {x.p.durationSec / 60} min
                </option>
              );
            })}
          </select>
          <select
            aria-label="Research outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          >
            <option value="reps">Total repetitions</option>
            <option value="density">Volume density</option>
          </select>
        </div>
        <Help topic="research" />
      </div>
      <div className="metrics four">
        <Metric
          label="Observations"
          value={summary?.n ?? 0}
          unit="n"
          detail={`${rows.length - validRows.length} missing outcomes`}
        />
        <Metric
          label="Sample standard deviation"
          value={number(summary?.sd, 2)}
          unit={outcome === "reps" ? "reps" : settings.unit + "·rep/min"}
        />
        <Metric
          label="Coefficient of variation"
          value={number(summary?.cv, 1)}
          unit="%"
        />
        <Metric
          label="Exploratory trend slope"
          value={number(sufficient ? trend.slope * 7 : null, 2)}
          unit={
            outcome === "reps" ? "reps/week" : settings.unit + "·rep/min/week"
          }
          detail={
            trend
              ? `${trend.span} days · n=${trend.n}`
              : "Distinct dates required"
          }
        />
      </div>
      <Card>
        <SectionTitle
          title="Recorded trend and rolling mean"
          subtitle="Elapsed-date regression; five-observation rolling window"
        />
        {validRows.length ? (
          <Chart
            title="Research trend"
            rows={validRows}
            option={lineOption(
              validRows.map((r) => dateLabel(r.date)),
              [
                { name: "Observed", values: validRows.map((r) => r.value) },
                {
                  name: "Rolling mean (5)",
                  values: rolling(validRows.map((r) => r.value)),
                },
                {
                  name: "Moving median (5)",
                  values: movingMedian(validRows.map((r) => r.value)),
                },
                ...(sufficient
                  ? [
                      {
                        name: "Exploratory OLS model",
                        values: validRows.map(
                          (r) =>
                            trend.intercept +
                            trend.slope *
                              (dayNumber(r.date) -
                                dayNumber(validRows[0].date)),
                        ),
                      },
                    ]
                  : []),
              ],
              outcome === "reps" ? "reps" : settings.unit + "·rep/min",
            )}
          />
        ) : (
          <Empty />
        )}
      </Card>
      <div className="grid-two">
        <Card>
          <SectionTitle
            title="Trend interpretation"
            subtitle="Description with explicit sufficiency rules"
          />
          <label className="field">
            <span>Practical-change threshold (outcome units)</span>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
          <div className="detail-grid">
            <span>Model R²</span>
            <strong>{number(sufficient ? trend.r2 : null, 3)}</strong>
            <span>Observed predicted change</span>
            <strong>
              {number(sufficient ? trend.slope * trend.span : null, 2)}
            </strong>
            <span>Plateau descriptor</span>
            <strong>
              {sufficient && Number(threshold) >= 0
                ? Math.abs(trend.slope * trend.span) <= Number(threshold)
                  ? "Within selected threshold"
                  : "Outside selected threshold"
                : "Insufficient data"}
            </strong>
          </div>
          <p className="muted">
            This does not diagnose a plateau or identify its cause. Confidence
            intervals are disabled because independence is not established.
          </p>
        </Card>
        <Card>
          <SectionTitle
            title="Readiness and performance"
            subtitle="Same-date pairs only · minimum 8 pairs"
          />
          <div className="large-number">
            {number(r, 3)}
            <small>Pearson r</small>
          </div>
          <p>
            {pairs.length} matched pairs · {rows.length - pairs.length} missing
            wellness matches.
          </p>
          <p className="muted">
            Correlation is exploratory and cannot establish causation. A
            constant variable produces an unavailable result.
          </p>
        </Card>
      </div>
      <Insight rows={rows} />
    </>
  );
}
export function Records() {
  const { settings } = useLab(),
    d = useScope(),
    unit = settings.unit;
  const pts = points(d);
  const groups = new Map<string, typeof pts>();
  pts.forEach((pt) => {
    const key = fixedLoadKey(pt.p, d);
    groups.set(key, [...(groups.get(key) || []), pt]);
  });
  const records = [...groups.values()].flatMap((rows) => {
    const x = rows[0];
    if (x.pr.modality !== "Density") return [];
    const best = Math.max(...rows.map((r) => r.reps));
    return [
      {
        name: "Most repetitions · fixed load/window",
        exercise: x.e.name,
        value: best,
        unit: "reps",
        protocol: `${number(fromKg(x.p.loadKg ?? 0, unit))} ${unit} · ${x.p.durationSec / 60} min`,
        dates: rows.filter((r) => r.reps === best).map((r) => r.session.date),
        classification: "Recorded observation",
      },
    ];
  });
  const exerciseIds = Array.from(new Set(pts.map((x) => x.e.id)));
  for (const id of exerciseIds) {
    const rows = pts.filter((x) => x.e.id === id),
      e = rows[0].e;
    const setRows = d.sets.filter(
      (s) => rows.some((x) => x.p.id === s.performanceId) && !s.warmup,
    );
    const loads = [
      ...setRows.map((s) => s.loadKg),
      ...rows.filter((x) => x.p.loadKg !== null).map((x) => x.p.loadKg!),
    ];
    if (loads.length)
      records.push({
        name: "Heaviest recorded load",
        exercise: e.name,
        value: fromKg(Math.max(...loads), unit),
        unit,
        protocol:
          e.convention === "per-implement"
            ? "Per implement · not a tested maximum"
            : "Recorded external load · not a tested maximum",
        dates: [],
        classification: "Recorded observation",
      });
    for (const formula of ["Epley", "Brzycki"] as const) {
      const obs = strengthObservations(d, formula, id);
      if (obs.length) {
        const max = Math.max(...obs.map((o) => o.value));
        records.push({
          name: `Highest estimated 1RM · ${formula}`,
          exercise: e.name,
          value: fromKg(max, unit),
          unit,
          protocol: "Qualifying individual sets only",
          dates: obs.filter((o) => o.value === max).map((o) => o.date),
          classification: "Model-based estimate",
        });
      }
    }
  }
  for (const rows of groups.values()) {
    const x = rows[0];
    if (x.pr.modality === "Density" && x.p.loadKg !== null) {
      for (const [name, property, recordUnit] of [
        ["Highest repetition density", "repDensity", "reps/min"],
        ["Greatest fixed-window volume", "volume", unit + "·rep"],
        ["Highest volume density", "volumeDensity", unit + "·rep/min"],
      ] as const) {
        const eligible = rows.filter((r) => r[property] !== null);
        if (!eligible.length) continue;
        const max = Math.max(...eligible.map((r) => r[property]!));
        records.push({
          name,
          exercise: x.e.name,
          value: property === "repDensity" ? max : fromKg(max, unit),
          unit: recordUnit,
          protocol: `${number(fromKg(x.p.loadKg, unit))} ${unit} · ${x.p.durationSec / 60} min`,
          dates: eligible
            .filter((r) => r[property] === max)
            .map((r) => r.session.date),
          classification: "Recorded observation",
        });
      }
    }
  }
  for (const id of exerciseIds) {
    const ps = pts.filter((p) => p.e.id === id),
      exercise = ps[0].e;
    if (!["total", "per-implement"].includes(exercise.convention)) continue;
    const sets = d.sets.filter(
      (s) => ps.some((p) => p.p.id === s.performanceId) && !s.warmup,
    );
    const tested = sets.filter((s) => s.testedMax && s.reps === 1);
    if (tested.length) {
      const max = Math.max(
        ...tested.map((s) => normalizedLoad(s.loadKg, exercise, s.side)),
      );
      records.push({
        name: "Highest declared tested 1RM",
        exercise: exercise.name,
        value: fromKg(max, unit),
        unit,
        protocol: exercise.standard,
        dates: tested
          .filter((s) => normalizedLoad(s.loadKg, exercise, s.side) === max)
          .map((s) => ps.find((p) => p.p.id === s.performanceId)!.session.date),
        classification: "Recorded maximum test",
      });
    }
    const repCounts = Array.from(
      new Set(sets.filter((s) => qualifying(s, exercise)).map((s) => s.reps)),
    );
    for (const reps of repCounts) {
      const rs = sets.filter((s) => s.reps === reps && qualifying(s, exercise));
      const max = Math.max(
        ...rs.map((s) => normalizedLoad(s.loadKg, exercise, s.side)),
      );
      records.push({
        name: `Heaviest qualifying ${reps}-rep set`,
        exercise: exercise.name,
        value: fromKg(max, unit),
        unit,
        protocol: exercise.standard,
        dates: rs
          .filter((s) => normalizedLoad(s.loadKg, exercise, s.side) === max)
          .map((s) => ps.find((p) => p.p.id === s.performanceId)!.session.date),
        classification: "Recorded observation",
      });
    }
    const workGroups = new Map<string, { work: number; date: string }[]>();
    for (const p of ps) {
      const ss = sets.filter((s) => s.performanceId === p.p.id);
      if (!ss.length || ss.some((s) => s.displacementM === null)) continue;
      const key =
        comparisonKey(p.p, d) + "|" + ss.map((s) => s.displacementM).join(",");
      const work = ss.reduce(
        (v, s) =>
          v +
          normalizedLoad(s.loadKg, exercise, s.side) *
            9.80665 *
            s.displacementM! *
            s.reps,
        0,
      );
      workGroups.set(key, [
        ...(workGroups.get(key) || []),
        { work, date: p.session.date },
      ]);
    }
    for (const ws of workGroups.values()) {
      const max = Math.max(...ws.map((w) => w.work));
      records.push({
        name: "Greatest modeled positive external work",
        exercise: exercise.name,
        value: max,
        unit: "J",
        protocol: "Matching vertical model and displacement observations",
        dates: ws.filter((w) => w.work === max).map((w) => w.date),
        classification: "Model-based estimate",
      });
    }
  }
  const activityGroups = new Map<string, typeof d.conditioning>();
  for (const c of d.conditioning) {
    if (c.distanceM <= 0) continue;
    const key = c.activity + "|" + c.distanceM + "|" + c.loadKg;
    activityGroups.set(key, [...(activityGroups.get(key) || []), c]);
  }
  for (const cs of activityGroups.values()) {
    const fastest = Math.min(...cs.map((c) => c.durationSec));
    records.push({
      name: "Shortest recorded elapsed time",
      exercise: cs[0].activity,
      value: fastest / 60,
      unit: "min",
      protocol: `${cs[0].distanceM} m · ${number(fromKg(cs[0].loadKg, unit))} ${unit} external load`,
      dates: cs
        .filter((c) => c.durationSec === fastest)
        .map((c) => d.sessions.find((s) => s.id === c.sessionId)!.date),
      classification: "Recorded observation",
    });
  }
  return (
    <>
      <div className="toolbar">
        <p className="muted">
          Separate records for each exercise, load convention and protocol. Ties
          are retained.
        </p>
        <Help topic="strength" />
      </div>
      {records.length ? (
        <div className="record-grid">
          {records.map((r, i) => (
            <Card key={i} className="record-card">
              <div className="record-top">
                <Target size={20} />
                <Badge
                  tone={
                    r.classification === "Model-based estimate"
                      ? "blue"
                      : "teal"
                  }
                >
                  {r.classification}
                </Badge>
              </div>
              <h3>{r.exercise}</h3>
              <p>{r.name}</p>
              <div className="record-value">
                {number(r.value, r.unit === "reps" ? 0 : 1)}
                <small>{r.unit}</small>
              </div>
              <small>{r.protocol}</small>
              {r.dates.length > 0 && (
                <div className="record-date">
                  <Clock3 size={12} />
                  {r.dates.join(" · ")}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            title="Your records start here"
            text="Comparable observations will establish your baseline and personal records."
          />
        </Card>
      )}
    </>
  );
}
