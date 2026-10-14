import { sessionDisplayName } from "../domain/scope";
import Dexie, { type Table } from "dexie";
import {
  type Conditioning,
  type Cycle,
  type Dataset,
  type Exercise,
  type Performance,
  type Plan,
  type Protocol,
  type Session,
  type SetRecord,
  type Settings,
  type Wellness,
  databaseSchema,
  emptyDataset,
  stamp,
  validateReferences,
} from "../domain/model";
import { demoData, exerciseLibrary } from "./demo";
export class LabDB extends Dexie {
  exercises!: Table<Exercise>;
  protocols!: Table<Protocol>;
  sessions!: Table<Session>;
  performances!: Table<Performance>;
  sets!: Table<SetRecord>;
  cycles!: Table<Cycle>;
  plans!: Table<Plan>;
  conditioning!: Table<Conditioning>;
  wellness!: Table<Wellness>;
  settings!: Table<Settings>;
  drafts!: Table<{ id: string; payload: unknown; updatedAt: string }>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({
      exercises: "id,name,pattern",
      protocols: "id,exerciseId,[exerciseId+modality]",
      sessions: "id,date,cycleId",
      performances: "id,sessionId,protocolId",
      sets: "id,performanceId,[performanceId+order]",
      cycles: "id,start",
      plans: "id,cycleId,date,sessionId",
      conditioning: "id,sessionId,activity",
      wellness: "id,date",
      settings: "id",
      drafts: "id",
    });
  }
}
export const realDB = new LabDB("strength-lab-v1");
export const demoDB = new LabDB("strength-lab-demo-v1");
export const tableNames = [
  "exercises",
  "protocols",
  "sessions",
  "performances",
  "sets",
  "cycles",
  "plans",
  "conditioning",
  "wellness",
  "settings",
] as const;
export async function snapshot(db: LabDB): Promise<Dataset> {
  const d = emptyDataset();
  await db.transaction(
    "r",
    tableNames.map((n) => db.table(n)),
    async () => {
      for (const n of tableNames)
        (d[n] as unknown[]) = await db.table(n).toArray();
    },
  );
  return d;
}
export async function initialize(db: LabDB, demo = false) {
  await db.transaction(
    "rw",
    tableNames.map((n) => db.table(n)),
    async () => {
      if (!(await db.exercises.count())) {
        const data = demo
          ? demoData()
          : {
              ...emptyDataset(),
              exercises: exerciseLibrary(),
              settings: [
                {
                  id: "preferences" as const,
                  unit: "lb" as const,
                  theme: "dark" as const,
                  weekStart: "monday" as const,
                  lastBackup: null,
                },
              ],
            };
        for (const n of tableNames)
          if (data[n].length) await db.table(n).bulkPut(data[n]);
      }
    },
  );
}
export async function saveSession(
  db: LabDB,
  bundle: {
    session: Session;
    protocol?: Protocol;
    performance?: Performance;
    sets?: SetRecord[];
    conditioning?: Conditioning;
    replacePerformanceId?: string;
    replaceConditioningId?: string;
  },
  draftId = "workout",
) {
  await db.transaction(
    "rw",
    [...tableNames.map((n) => db.table(n)), db.drafts],
    async () => {
      if (bundle.replacePerformanceId) {
        await db.sets
          .where("performanceId")
          .equals(bundle.replacePerformanceId)
          .delete();
        await db.performances.delete(bundle.replacePerformanceId);
      }
      if (bundle.replaceConditioningId)
        await db.conditioning.delete(bundle.replaceConditioningId);
      await db.sessions.put(bundle.session);
      if (bundle.protocol) await db.protocols.put(bundle.protocol);
      if (bundle.performance) await db.performances.put(bundle.performance);
      if (bundle.sets?.length) await db.sets.bulkPut(bundle.sets);
      if (bundle.conditioning) await db.conditioning.put(bundle.conditioning);
      const data = emptyDataset();
      for (const n of tableNames)
        (data[n] as unknown[]) = await db.table(n).toArray();
      databaseSchema.parse(data);
      validateReferences(data);
      const name = sessionDisplayName(data, bundle.session);
      if (name !== bundle.session.name)
        await db.sessions.update(bundle.session.id, { name });
      await db.drafts.delete(draftId);
    },
  );
}
export async function deleteSession(db: LabDB, id: string) {
  await db.transaction(
    "rw",
    [db.sessions, db.performances, db.sets, db.conditioning, db.plans],
    async () => {
      const ps = await db.performances.where("sessionId").equals(id).toArray();
      for (const p of ps)
        await db.sets.where("performanceId").equals(p.id).delete();
      await db.performances.where("sessionId").equals(id).delete();
      await db.conditioning.where("sessionId").equals(id).delete();
      await db.plans.where("sessionId").equals(id).modify({ sessionId: null });
      await db.sessions.delete(id);
    },
  );
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
async function digest(value: unknown) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical(value)),
  );
  return Array.from(new Uint8Array(hash))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
export async function backup(db: LabDB) {
  const data = await snapshot(db);
  return {
    format: "strength-lab",
    schemaVersion: 1,
    calculationVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
    digest: await digest(data),
  };
}
export async function parseBackup(text: string) {
  if (text.length > 32 * 1024 * 1024)
    throw new Error("Backup exceeds the 32 MB import limit.");
  const raw = JSON.parse(text);
  if (raw.format !== "strength-lab" || raw.schemaVersion !== 1)
    throw new Error("Unsupported backup format or schema version.");
  const data = databaseSchema.parse(raw.data);
  validateReferences(data);
  if ((await digest(raw.data)) !== raw.digest)
    throw new Error("Backup integrity check failed.");
  return data;
}
export async function restore(
  db: LabDB,
  data: Dataset,
  mode: "replace" | "merge",
) {
  databaseSchema.parse(data);
  validateReferences(data);
  await db.transaction(
    "rw",
    [...tableNames.map((n) => db.table(n)), db.drafts],
    async () => {
      const combined = emptyDataset();
      for (const n of tableNames) {
        const existing = mode === "merge" ? await db.table(n).toArray() : [];
        const map = new Map(existing.map((r) => [r.id, r]));
        for (const row of data[n]) {
          const old = map.get(row.id);
          if (old && n !== "settings" && canonical(old) !== canonical(row))
            throw new Error(
              `Conflicting ${n} record ${row.id}. Use replacement or resolve the conflict first.`,
            );
          map.set(row.id, row);
        }
        combined[n] = Array.from(map.values()) as never;
      }
      validateReferences(combined);
      for (const n of tableNames) {
        await db.table(n).clear();
        if (combined[n].length) await db.table(n).bulkPut(combined[n]);
      }
      if (mode === "replace") await db.drafts.clear();
    },
  );
}
export function download(
  name: string,
  text: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [
    keys.map(escape).join(","),
    ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
  ].join("\r\n");
}
export async function addExercise(
  db: LabDB,
  name: string,
  convention: Exercise["convention"],
  pattern: string,
  implementCount: number,
  standard: string,
) {
  await db.exercises.add({
    ...stamp(),
    name: name.trim(),
    pattern,
    equipment: "Custom",
    convention,
    implements: implementCount,
    standard,
    variation: name.trim(),
  });
}
