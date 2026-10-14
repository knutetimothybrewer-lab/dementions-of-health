import { createContext, useContext } from "react";
import { type LabDB } from "../data/db";
import { type Dataset, type Settings } from "../domain/model";
export type Filters = {
  exercise: string;
  cycle: string;
  from: string;
  to: string;
  modality?: string;
  pattern?: string;
};
export type LabContext = {
  db: LabDB;
  data: Dataset;
  settings: Settings;
  demo: boolean;
  setDemo: (v: boolean) => void;
  notify: (text: string) => void;
  navigate: (page: string) => void;
  filters: Filters;
  setFilters: (v: Filters) => void;
};
export const Context = createContext<LabContext | null>(null);
export function useLab() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Lab context unavailable");
  return ctx;
}
export function useScope() {
  const { data, filters } = useLab();
  const protocolIds = new Set(
    data.protocols
      .filter((p) => {
        const e = data.exercises.find((e) => e.id === p.exerciseId);
        return (
          (!filters.exercise || p.exerciseId === filters.exercise) &&
          (!filters.modality || p.modality === filters.modality) &&
          (!filters.pattern || e?.pattern === filters.pattern)
        );
      })
      .map((p) => p.id),
  );
  const matchingSessions = new Set(
    data.performances
      .filter((p) => protocolIds.has(p.protocolId))
      .map((p) => p.sessionId),
  );
  const specific = filters.exercise || filters.modality || filters.pattern;
  const sessionIds = new Set(
    data.sessions
      .filter(
        (s) =>
          (!filters.cycle || s.cycleId === filters.cycle) &&
          (!filters.from || s.date >= filters.from) &&
          (!filters.to || s.date <= filters.to) &&
          (!specific || matchingSessions.has(s.id)),
      )
      .map((s) => s.id),
  );
  return {
    ...data,
    sessions: data.sessions.filter((s) => sessionIds.has(s.id)),
    performances: data.performances.filter(
      (p) => sessionIds.has(p.sessionId) && protocolIds.has(p.protocolId),
    ),
    conditioning: data.conditioning.filter((c) => sessionIds.has(c.sessionId)),
  };
}
export function number(value: number | null | undefined, digits = 0) {
  return value == null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(value);
}
export function dateLabel(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
