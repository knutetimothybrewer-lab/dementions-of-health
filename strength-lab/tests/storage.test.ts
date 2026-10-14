import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  LabDB,
  backup,
  deleteSession,
  initialize,
  parseBackup,
  restore,
  saveSession,
  snapshot,
} from "../src/data/db";
import { demoData } from "../src/data/demo";
let db: LabDB;
beforeEach(async () => {
  db = new LabDB("test-" + crypto.randomUUID());
  await initialize(db);
});
afterEach(async () => {
  await db.delete();
});
it("initializes personal history without sample observations", async () => {
  expect(await db.sessions.count()).toBe(0);
  expect(await db.exercises.count()).toBeGreaterThan(0);
});
it("restores a complete backup and deduplicates exact imports", async () => {
  const d = demoData();
  await restore(db, d, "replace");
  const b = await backup(db);
  const parsed = await parseBackup(JSON.stringify(b));
  await restore(db, parsed, "merge");
  expect(await db.sessions.count()).toBe(d.sessions.length);
  expect((await snapshot(db)).sets.length).toBe(d.sets.length);
});
it("rejects corrupt and unsupported backups", async () => {
  const b = await backup(db);
  b.data.exercises[0].name = "Changed";
  await expect(parseBackup(JSON.stringify(b))).rejects.toThrow("integrity");
  await expect(
    parseBackup(JSON.stringify({ ...b, schemaVersion: 99 })),
  ).rejects.toThrow("Unsupported");
});
it("rejects merge conflicts transactionally", async () => {
  const d = demoData();
  await restore(db, d, "replace");
  const changed = structuredClone(d);
  changed.sessions[0].notes = "conflict";
  await expect(restore(db, changed, "merge")).rejects.toThrow("Conflicting");
  expect((await db.sessions.get(d.sessions[0].id))?.notes).toBe(
    d.sessions[0].notes,
  );
});
it("deletes related observations and clears plan links", async () => {
  const d = demoData();
  await restore(db, d, "replace");
  const s = d.sessions[0];
  await db.plans.add({ ...d.plans[0], id: "linked", sessionId: s.id });
  await deleteSession(db, s.id);
  expect(await db.sessions.get(s.id)).toBeUndefined();
  expect(await db.performances.where("sessionId").equals(s.id).count()).toBe(0);
  expect((await db.plans.get("linked"))?.sessionId).toBeNull();
});
it("rolls back invalid references without modifying history", async () => {
  const d = demoData(),
    session = { ...d.sessions[0], cycleId: null },
    performance = { ...d.performances[0], protocolId: "missing" };
  await expect(saveSession(db, { session, performance })).rejects.toThrow(
    "Missing protocols",
  );
  expect(await db.sessions.count()).toBe(0);
});
it("appends an exercise without overwriting existing observations", async () => {
  const d = demoData();
  await restore(db, d, "replace");
  const performance = { ...d.performances[0], id: "appended" };
  await saveSession(db, { session: d.sessions[0], performance });
  expect(
    await db.performances.where("sessionId").equals(d.sessions[0].id).count(),
  ).toBe(2);
});
