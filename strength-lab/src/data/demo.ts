import { toKg } from "../domain/metrics";
import {
  type Dataset,
  dayNumber,
  emptyDataset,
  type Exercise,
  stamp,
  today,
} from "../domain/model";
export function exerciseLibrary(): Exercise[] {
  return [
    [
      "bench",
      "Barbell bench press",
      "Horizontal push",
      "Barbell",
      "total",
      1,
      "Full ROM · touch chest · no assistance",
    ],
    [
      "squat",
      "Back squat",
      "Squat",
      "Barbell",
      "total",
      1,
      "Hip crease below knee · full lockout",
    ],
    [
      "deadlift",
      "Conventional deadlift",
      "Hinge",
      "Barbell",
      "total",
      1,
      "Floor to full lockout · dead stop",
    ],
    [
      "ohp",
      "Standing overhead press",
      "Vertical push",
      "Barbell",
      "total",
      1,
      "Strict press · no leg drive",
    ],
    [
      "row",
      "Barbell row",
      "Horizontal pull",
      "Barbell",
      "total",
      1,
      "Controlled full ROM · fixed torso angle",
    ],
    [
      "dbpress",
      "Dumbbell bench press",
      "Horizontal push",
      "Dumbbells",
      "per-implement",
      2,
      "Full ROM · load per dumbbell · bilateral reps",
    ],
    [
      "pullup",
      "Weighted pull-up",
      "Vertical pull",
      "Pull-up bar",
      "added",
      1,
      "Dead hang to chin over bar · added load only",
    ],
    [
      "pushup",
      "Push-up",
      "Horizontal push",
      "Bodyweight",
      "bodyweight",
      1,
      "Chest to floor · full lockout",
    ],
    [
      "plank",
      "Front plank",
      "Core",
      "Bodyweight",
      "bodyweight",
      1,
      "Isometric · duration recorded",
    ],
    [
      "carry",
      "Farmer carry",
      "Carry",
      "Dumbbells",
      "per-implement",
      2,
      "Load per hand · distance recorded",
    ],
  ].map(
    ([id, name, pattern, equipment, convention, implementCount, standard]) => ({
      ...stamp(String(id)),
      name: String(name),
      pattern: String(pattern),
      equipment: String(equipment),
      convention: convention as Exercise["convention"],
      implements: Number(implementCount),
      standard: String(standard),
      variation: String(name),
    }),
  );
}
function dateOffset(days: number) {
  return new Date((dayNumber(today()) + days) * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function demoData(): Dataset {
  const d = emptyDataset();
  d.exercises = exerciseLibrary();
  d.settings = [
    {
      id: "preferences",
      unit: "lb",
      theme: "dark",
      weekStart: "monday",
      lastBackup: null,
    },
  ];
  d.cycles = [
    {
      ...stamp("cycle-current"),
      name: "Density / Accumulation",
      goal: "Build task-specific capacity at 185 lb",
      start: dateOffset(-27),
      end: dateOffset(28),
      frequency: 4,
      deloadWeeks: [4],
    },
    {
      ...stamp("cycle-previous"),
      name: "Strength / Foundation",
      goal: "Heavy-load practice and baseline density",
      start: dateOffset(-83),
      end: dateOffset(-28),
      frequency: 3,
      deloadWeeks: [8],
    },
  ];
  d.protocols = [
    {
      ...stamp("bench-density"),
      exerciseId: "bench",
      modality: "Density",
      durationSec: 900,
      standard: d.exercises[0].standard,
      version: 1,
    },
    {
      ...stamp("squat-straight"),
      exerciseId: "squat",
      modality: "Straight sets",
      durationSec: 0,
      standard: d.exercises[1].standard,
      version: 1,
    },
  ];
  for (let i = 0; i < 12; i++) {
    const date = dateOffset(-77 + i * 7),
      sid = "density-session-" + i,
      pid = "density-performance-" + i,
      reps = [49, 51, 50, 54, 55, 56, 58, 60, 62, 64, 67, 70][i];
    d.sessions.push({
      ...stamp(sid),
      date,
      timeZone: "America/New_York",
      name: "Upper / Density",
      durationSec: 2700,
      cycleId: i >= 8 ? "cycle-current" : "cycle-previous",
      rpe: 7 + (i % 3) * 0.5,
      notes: "Demonstration observation — not your training data.",
    });
    d.performances.push({
      ...stamp(pid),
      sessionId: sid,
      protocolId: "bench-density",
      mode: i === 11 ? "detailed" : "summary",
      loadKg: toKg(185, "lb"),
      originalLoad: 185,
      originalUnit: "lb",
      reps: i === 11 ? null : reps,
      durationSec: 900,
      completed: true,
      bodyMassKg: 84,
    });
    if (i === 11) {
      [12, 11, 10, 10, 9, 9, 9].forEach((r, j) =>
        d.sets.push({
          ...stamp(),
          performanceId: pid,
          order: j,
          block: "Density block",
          loadKg: toKg(185, "lb"),
          reps: r,
          side: "bilateral",
          rir: j < 4 ? 3 : 1,
          rpe: null,
          restSec: j ? 75 : null,
          endSec: (j + 1) * 125,
          movementSec: null,
          displacementM: null,
          warmup: false,
          testedMax: false,
          notes: "",
        }),
      );
    }
    const sqid = "strength-session-" + i,
      sqpid = "strength-performance-" + i;
    d.sessions.push({
      ...stamp(sqid),
      date: dateOffset(-78 + i * 7),
      timeZone: "America/New_York",
      name: "Lower / Strength",
      durationSec: 3300,
      cycleId: i >= 8 ? "cycle-current" : "cycle-previous",
      rpe: 8,
      notes: "Demonstration observation",
    });
    d.performances.push({
      ...stamp(sqpid),
      sessionId: sqid,
      protocolId: "squat-straight",
      mode: "detailed",
      loadKg: null,
      originalLoad: null,
      originalUnit: "lb",
      reps: null,
      durationSec: 0,
      completed: true,
      bodyMassKg: 84,
    });
    [5, 5, 5].forEach((r, j) =>
      d.sets.push({
        ...stamp(),
        performanceId: sqpid,
        order: j,
        block: "Working sets",
        loadKg: toKg(225 + i * 5, "lb"),
        reps: r,
        side: "bilateral",
        rir: j === 2 ? 1 : 2,
        rpe: null,
        restSec: j ? 180 : null,
        endSec: null,
        movementSec: null,
        displacementM: null,
        warmup: false,
        testedMax: false,
        notes: "",
      }),
    );
    d.wellness.push({
      ...stamp("wellness-" + i),
      date,
      sleep: 7 + (i % 4) * 0.3,
      quality: 4,
      fatigue: 2 + (i % 2),
      soreness: 2,
      readiness: 4,
      stress: 2,
      motivation: 4,
      bodyMassKg: 84,
    });
    const runid = "run-session-" + i;
    d.sessions.push({
      ...stamp(runid),
      date: dateOffset(-79 + i * 7),
      timeZone: "America/New_York",
      name: "Aerobic / Easy run",
      durationSec: 1800 - i * 15,
      cycleId: i >= 8 ? "cycle-current" : "cycle-previous",
      rpe: 5,
      notes: "Demonstration observation",
    });
    d.conditioning.push({
      ...stamp(),
      sessionId: runid,
      activity: "Running",
      distanceM: 5000,
      durationSec: 1800 - i * 15,
      loadKg: 0,
      hr: 145 - (i % 4),
      intervals: [],
    });
  }
  for (const [load, oldReps, newReps] of [
    [135, 100, 115],
    [225, 35, 39],
    [245, 20, 21],
  ])
    for (const [index, reps] of [oldReps, newReps].entries()) {
      const sid = `profile-${load}-${index}`;
      d.sessions.push({
        ...stamp(sid),
        date: dateOffset(index ? -2 : -56),
        timeZone: "America/New_York",
        name: "Load profile observation",
        durationSec: 900,
        cycleId: index ? "cycle-current" : "cycle-previous",
        rpe: 8,
        notes:
          "Illustrative sample; separate dates, not a single measured curve.",
      });
      d.performances.push({
        ...stamp(),
        sessionId: sid,
        protocolId: "bench-density",
        mode: "summary",
        loadKg: toKg(load, "lb"),
        originalLoad: load,
        originalUnit: "lb",
        reps,
        durationSec: 900,
        completed: true,
        bodyMassKg: 84,
      });
    }
  for (let i = 0; i < 16; i++) {
    const date = dateOffset(-27 + i * 3);
    d.plans.push({
      ...stamp(),
      cycleId: "cycle-current",
      date,
      exerciseId: "bench",
      modality: "Density",
      loadKg: toKg(185, "lb"),
      reps: 70,
      durationSec: 900,
      sessionId:
        d.sessions.find((s) => s.date === date && s.name === "Upper / Density")
          ?.id ?? null,
    });
  }
  return d;
}
