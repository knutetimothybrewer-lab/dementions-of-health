import { createContext, useContext } from "react";
import { type LabDB } from "../data/db";
import { type Dataset, type Settings } from "../domain/model";
import {
  scopeDataset,
  type Filters,
  type AnalysisSelection,
} from "../domain/scope";
export type { Filters, AnalysisSelection } from "../domain/scope";
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
  analysis: AnalysisSelection;
  setAnalysis: (v: AnalysisSelection) => void;
  selectDensity: (key: string, exercise: string) => void;
};
export const Context = createContext<LabContext | null>(null);
export function useLab() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Lab context unavailable");
  return ctx;
}
export function useScope(overrides: Partial<Filters> = {}) {
  const { data, filters } = useLab();
  return scopeDataset(data, { ...filters, ...overrides });
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
