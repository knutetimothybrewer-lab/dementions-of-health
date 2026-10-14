import { it, expect } from "vitest";
import { demoData } from "../src/data/demo";
import {
  scopeDataset,
  emptyFilters,
  selectedDensityKey,
  sessionDisplayName,
} from "../src/domain/scope";
import { points, fixedLoadKey, toKg } from "../src/domain/metrics";
it("applies the same exercise cycle and date range to all derived observations", () => {
  const d = demoData();
  const scoped = scopeDataset(d, {
    ...emptyFilters(),
    exercise: "bench",
    cycle: "cycle-current",
    from: d.cycles[0].start,
    to: d.cycles[0].end,
  });
  expect(
    points(scoped).every(
      (p) => p.e.id === "bench" && p.session.cycleId === "cycle-current",
    ),
  ).toBe(true);
  expect(
    scoped.sets.every((s) =>
      scoped.performances.some((p) => p.id === s.performanceId),
    ),
  ).toBe(true);
  expect(
    scoped.plans.every(
      (p) => p.exerciseId === "bench" && p.cycleId === "cycle-current",
    ),
  ).toBe(true);
});
it("keeps the selected fixed load rather than defaulting to another group", () => {
  const d = demoData(),
    p = points(d, "bench", true).find(
      (p) => Math.abs(p.p.loadKg! - toKg(135, "lb")) < 0.00001,
    )!;
  const key = fixedLoadKey(p.p, d);
  expect(selectedDensityKey(d, key, "bench")).toBe(key);
  const rows = points(d, "bench", true).filter(
    (p) => fixedLoadKey(p.p, d) === selectedDensityKey(d, key, "bench"),
  );
  expect(rows.map((r) => r.reps)).toEqual([100, 115]);
});
it("does not borrow density or strength observations from an unrelated selected exercise", () => {
  const d = demoData();
  expect(selectedDensityKey(d, "", "deadlift")).toBe("");
  expect(
    points(scopeDataset(d, { ...emptyFilters(), exercise: "deadlift" })),
  ).toEqual([]);
});
it("corrects stale auto-generated labels without changing custom session names", () => {
  const d = demoData(),
    session = d.sessions.find((s) => s.id === d.performances[1].sessionId)!;
  expect(
    sessionDisplayName(d, {
      ...session,
      name: "Barbell bench press / Straight sets",
    }),
  ).toBe("Back squat / Straight sets");
  expect(
    sessionDisplayName(d, { ...session, name: "My lower training day" }),
  ).toBe("My lower training day");
});
