import { modalities, type Dataset, type Session } from "./model";
import { fixedLoadKey, points } from "./metrics";
export type Filters = {
  exercise: string;
  cycle: string;
  from: string;
  to: string;
  modality?: string;
  pattern?: string;
};
export type AnalysisSelection = {
  densityKey: string;
  formula: "Epley" | "Brzycki";
};
export const emptyFilters = (): Filters => ({
  exercise: "",
  cycle: "",
  from: "",
  to: "",
});
export const emptyAnalysis = (): AnalysisSelection => ({
  densityKey: "",
  formula: "Epley",
});
export function scopeDataset(data: Dataset, filters: Filters): Dataset {
  const withinDate = (date: string) =>
    (!filters.from || date >= filters.from) &&
    (!filters.to || date <= filters.to);
  const exerciseMatches = (id: string) => {
    const e = data.exercises.find((e) => e.id === id);
    return (
      (!filters.exercise || filters.exercise === id) &&
      (!filters.pattern || e?.pattern === filters.pattern)
    );
  };
  const protocolIds = new Set(
    data.protocols
      .filter(
        (p) =>
          exerciseMatches(p.exerciseId) &&
          (!filters.modality || p.modality === filters.modality),
      )
      .map((p) => p.id),
  );
  const resistanceIds = new Set(
    data.performances
      .filter((p) => protocolIds.has(p.protocolId))
      .map((p) => p.sessionId),
  );
  const conditioningIds = new Set(
    data.conditioning
      .filter(
        (c) =>
          !filters.exercise &&
          !filters.pattern &&
          (!filters.modality ||
            data.sessions
              .find((s) => s.id === c.sessionId)
              ?.name.endsWith(" / " + filters.modality)),
      )
      .map((c) => c.sessionId),
  );
  const specific = filters.exercise || filters.modality || filters.pattern;
  const sessionIds = new Set(
    data.sessions
      .filter(
        (s) =>
          withinDate(s.date) &&
          (!filters.cycle || s.cycleId === filters.cycle) &&
          (!specific || resistanceIds.has(s.id) || conditioningIds.has(s.id)),
      )
      .map((s) => s.id),
  );
  const performances = data.performances.filter(
    (p) => sessionIds.has(p.sessionId) && protocolIds.has(p.protocolId),
  );
  const performanceIds = new Set(performances.map((p) => p.id));
  return {
    ...data,
    sessions: data.sessions.filter((s) => sessionIds.has(s.id)),
    performances,
    sets: data.sets.filter((s) => performanceIds.has(s.performanceId)),
    conditioning: data.conditioning.filter((c) => sessionIds.has(c.sessionId)),
    wellness: data.wellness.filter((w) => withinDate(w.date)),
    plans: data.plans.filter(
      (p) =>
        withinDate(p.date) &&
        exerciseMatches(p.exerciseId) &&
        (!filters.cycle || p.cycleId === filters.cycle) &&
        (!filters.modality || p.modality === filters.modality),
    ),
  };
}
export function selectedDensityKey(
  data: Dataset,
  preferred: string,
  exercise = "",
) {
  const observations = points(data, exercise || undefined, true).filter(
    (p) => p.p.loadKg !== null,
  );
  return observations.some((p) => fixedLoadKey(p.p, data) === preferred)
    ? preferred
    : observations.length
      ? fixedLoadKey(observations.at(-1)!.p, data)
      : "";
}
export function sessionDisplayName(data: Dataset, session: Session) {
  const automatic =
    data.exercises.some((e) =>
      modalities.some((m) => session.name === `${e.name} / ${m}`),
    ) || /^Resistance training \/ \d+ exercises$/.test(session.name);
  if (!automatic) return session.name;
  const performances = data.performances.filter(
    (p) => p.sessionId === session.id,
  );
  if (performances.length === 1) {
    const pr = data.protocols.find(
      (pr) => pr.id === performances[0].protocolId,
    );
    const e = data.exercises.find((e) => e.id === pr?.exerciseId);
    if (e && pr) return `${e.name} / ${pr.modality}`;
  }
  if (performances.length > 1)
    return `Resistance training / ${performances.length} exercises`;
  const conditioning = data.conditioning.find(
    (c) => c.sessionId === session.id,
  );
  return conditioning
    ? `${conditioning.activity} / ${session.name.split(" / ").at(-1)}`
    : session.name;
}
