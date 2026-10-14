import { describe, expect, it } from "vitest";
import { demoData, exerciseLibrary } from "../src/data/demo";
import {
  acceleration,
  adherence,
  biomechanics,
  change,
  comparisonKey,
  correlation,
  cycleWeek,
  density,
  e1rm,
  fixedLoadKey,
  fromKg,
  linearTrend,
  matchedInsight,
  pace,
  performanceTotals,
  points,
  qualifying,
  rolling,
  sessionLoad,
  speed,
  stats,
  toKg,
  volume,
} from "../src/domain/metrics";
import { databaseSchema, validateReferences } from "../src/domain/model";
describe("scientific calculations", () => {
  it("converts pounds without early rounding", () => {
    expect(toKg(185, "lb")).toBeCloseTo(83.91458845, 8);
    expect(fromKg(toKg(185, "lb"), "lb")).toBeCloseTo(185, 10);
  });
  it("matches the requested density fixture", () => {
    const v = volume(toKg(185, "lb"), 60)!;
    expect(fromKg(v, "lb")).toBeCloseTo(11100);
    expect(fromKg(density(v, 900)!, "lb")).toBeCloseTo(740);
    expect(density(60, 900)).toBe(4);
  });
  it("handles invalid and zero denominators", () => {
    expect(density(10, 0)).toBeNull();
    expect(change(10, 0)).toBeNull();
    expect(volume(-1, 5)).toBeNull();
    expect(volume(1, 1.5)).toBeNull();
    expect(density(NaN, 10)).toBeNull();
    expect(density(0, 900)).toBe(0);
  });
  it("calculates fixed-load improvement without a strength claim", () => {
    expect(change(70, 60)).toBeCloseTo(16.6666667);
    const d = demoData(),
      rows = points(d, "bench", true).filter(
        (x) => Math.abs(x.p.loadKg! - toKg(185, "lb")) < 0.00001,
      );
    const insight = matchedInsight(rows)!;
    expect(insight.text).toContain("matched observations");
    expect(insight.limitation).toContain(
      "does not establish changes in maximal strength",
    );
  });
  it("validates set-based strength domains", () => {
    expect(e1rm(100, 5, "Epley")).toBeCloseTo(116.6666667);
    expect(e1rm(100, 5, "Brzycki")).toBe(112.5);
    expect(e1rm(100, 37, "Brzycki")).toBeNull();
    expect(e1rm(100, 60, "Epley")).toBeNull();
    expect(e1rm(100, 1, "Epley")).toBe(100);
    expect(e1rm(100, 0, "Epley")).toBeNull();
  });
  it("requires qualifying individual effort and compatible mechanics", () => {
    const d = demoData(),
      s = d.sets[0],
      e = d.exercises[0];
    expect(qualifying({ ...s, reps: 5, rir: 1 }, e)).toBe(true);
    expect(qualifying({ ...s, reps: 5, rir: null, rpe: null }, e)).toBe(false);
    expect(
      qualifying({ ...s, reps: 5, rir: 1 }, { ...e, convention: "assisted" }),
    ).toBe(false);
  });
  it("uses explicitly supplied displacement and movement time", () => {
    const result = biomechanics(100, 0.5, 1, 900)!;
    expect(result.force).toBeCloseTo(980.665);
    expect(result.work).toBeCloseTo(490.3325);
    expect(result.power).toBeCloseTo(490.3325);
    expect(result.velocity).toBe(0.5);
    expect(biomechanics(100, 0.5, 0, 900)).toBeNull();
    expect(acceleration(-1, 1, 2)).toBe(1);
  });
  it("accounts for elapsed dates in regressions", () => {
    const trend = linearTrend([
      { date: "2026-01-01", value: 10 },
      { date: "2026-01-03", value: 14 },
      { date: "2026-01-11", value: 30 },
    ])!;
    expect(trend.slope).toBe(2);
    expect(trend.span).toBe(10);
    expect(trend.r2).toBe(1);
    expect(
      linearTrend([
        { date: "2026-01-01", value: 1 },
        { date: "2026-01-01", value: 2 },
      ]),
    ).toBeNull();
  });
  it("does not create partial moving averages or fake variability", () => {
    expect(rolling([1, 2, 3, 4, 5])).toEqual([null, null, null, null, 3]);
    expect(stats([2])?.sd).toBeNull();
    expect(stats([1, 3])?.median).toBe(2);
    expect(correlation([1, 1], [1, 2])).toBeNull();
  });
  it("matches protocols and preserves missing loads", () => {
    const d = demoData(),
      p = d.performances[0];
    expect(fixedLoadKey(p, d)).not.toBe(
      fixedLoadKey({ ...p, loadKg: toKg(225, "lb") }, d),
    );
    expect(comparisonKey(p, d)).not.toBe(
      comparisonKey({ ...p, durationSec: 600 }, d),
    );
    expect(fixedLoadKey({ ...p, loadKg: null }, d)).toContain("variable");
  });
  it("never double-counts summaries and sets", () => {
    const d = demoData(),
      p = d.performances[0],
      e = d.exercises[0];
    const fake = { ...d.sets[0], performanceId: p.id, reps: 100 };
    expect(performanceTotals(p, e, [fake]).reps).toBe(p.reps);
    const detailed = d.performances.find(
      (p) => p.mode === "detailed" && p.protocolId === "bench-density",
    )!;
    expect(performanceTotals({ ...detailed, reps: 1000 }, e, d.sets).reps).toBe(
      70,
    );
  });
  it("normalizes bilateral and unilateral dumbbell loading", () => {
    const d = demoData(),
      e = exerciseLibrary().find((e) => e.id === "dbpress")!,
      p = { ...d.performances[0], mode: "detailed" as const };
    const s = { ...d.sets[0], performanceId: p.id, loadKg: 20, reps: 10 };
    expect(performanceTotals(p, e, [{ ...s, side: "bilateral" }]).volume).toBe(
      400,
    );
    expect(
      performanceTotals(p, e, [
        { ...s, side: "left" },
        { ...s, side: "right" },
      ]).volume,
    ).toBe(400);
    expect(performanceTotals(p, e, [{ ...s, side: "combined" }]).volume).toBe(
      200,
    );
    expect(
      performanceTotals(p, { ...e, convention: "bodyweight" }, [s]).volume,
    ).toBeNull();
  });
  it("uses explicit plan denominators and date weeks", () => {
    expect(adherence(3, 4)).toBe(75);
    expect(adherence(0, 0)).toBeNull();
    expect(cycleWeek("2026-01-08", "2026-01-01")).toBe(2);
  });
  it("calculates modality-specific conditioning and subjective load", () => {
    expect(pace(5000, 1500)).toBe(300);
    expect(speed(5000, 1500)).toBeCloseTo(3.3333);
    expect(pace(0, 1500)).toBeNull();
    expect(sessionLoad(8, 2700)).toBe(360);
    expect(sessionLoad(null, 2700)).toBeNull();
  });
  it("validates the entire isolated demonstration dataset", () => {
    const d = databaseSchema.parse(demoData());
    expect(() => validateReferences(d)).not.toThrow();
    d.sets[0].performanceId = "missing";
    expect(() => validateReferences(d)).toThrow(
      "Missing performances reference",
    );
  });
});
it("custom hard-set thresholds do not count missing effort", () => {
  const d = demoData(),
    p = d.performances.find((p) => p.mode === "detailed")!,
    e = d.exercises[0];
  const sets = [
    { ...d.sets[0], performanceId: p.id, rir: 4 },
    { ...d.sets[0], id: "unknown", performanceId: p.id, rir: null },
  ];
  expect(performanceTotals(p, e, sets, 3).hardSets).toBe(0);
  expect(performanceTotals(p, e, sets, 4).hardSets).toBe(1);
  expect(performanceTotals(p, e, sets, 4).effortUnknown).toBe(1);
});
