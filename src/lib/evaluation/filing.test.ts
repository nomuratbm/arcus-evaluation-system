import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { EVALUATION_CRITERIA } from "@/lib/evaluation/criteria";
import type { EvaluationRecord } from "@/lib/evaluation/catalog-types";
import { fileEvaluation } from "@/lib/evaluation/filing";
import { fillEvaluationPdf } from "@/lib/evaluation/fill-pdf";
import { createEmptyDraft, type EvaluationDraft } from "@/lib/evaluation/schema";
import { parseEvaluationSubmission } from "@/lib/evaluation/parse-submission";
import { recordFromItem } from "@/lib/dynamodb/evaluations";
import { isOfficer } from "@/lib/auth/roles";
import { useEvaluationStore } from "@/store/useEvaluationStore";
import type { StudentIdentity, StudentLookupResult } from "@/lib/student-identity";

const ana: StudentIdentity = { studentId: "2026123456", fullName: "Ana Santos", programYear: "BSCpE-4", organizationName: "JPCS" };
function validDraft(overrides: Partial<EvaluationDraft> = {}): EvaluationDraft {
  return { ...createEmptyDraft(), studentId: ana.studentId, eventId: "event-1", eventTitle: "Workshop", department: "School of Information Technology", participated: "no", ...overrides };
}
function ports(configured = true, student: StudentIdentity | null = ana) {
  const records: EvaluationRecord[] = [];
  return {
    records,
    async lookup(): Promise<StudentLookupResult> { return student ? { status: "found", student } : { status: "not_found" }; },
    index: {
      isConfigured: () => configured,
      async put(record: EvaluationRecord) { records.push(record); },
      async list() { return records; },
      async get(id: string) { return records.find((row) => row.evaluationId === id) ?? null; },
    },
  };
}

test("invalid draft returns field errors without writing", async () => {
  const fake = ports();
  const result = await fileEvaluation(validDraft({ department: "" }), ana.studentId, fake);
  assert.equal(result.status, "invalid");
  assert.equal(fake.records.length, 0);
});

test("unknown student and mismatched lookup identity do not write", async () => {
  for (const student of [null, { ...ana, studentId: "2026999999" }]) {
    const fake = ports(true, student);
    assert.equal((await fileEvaluation(validDraft(), ana.studentId, fake)).status, "not_registered");
    assert.equal(fake.records.length, 0);
  }
});

test("filing ignores a spoofed client student ID and uses verified identity", async () => {
  const fake = ports();
  const result = await fileEvaluation(validDraft({ studentId: "2026999999" }), ana.studentId, fake);
  assert.equal(result.status, "stored");
  assert.equal(fake.records[0].studentId, ana.studentId);
  assert.equal(fake.records[0].fullName, ana.fullName);
  assert.equal(fake.records[0].eventId, "event-1");
});

test("full responses are preserved for browser PDF reproduction", async () => {
  const fake = ports();
  const draft = validDraft({
    participated: "yes", recentActivity: "Workshop", dateParticipated: "2026-01-01",
    ratings: Object.fromEntries(EVALUATION_CRITERIA.map((row) => [row.id, 5 as const])),
    discoverySources: { ...createEmptyDraft().discoverySources, others: true },
    othersSpecify: "Student council", comments: "Useful workshop.",
  });
  assert.equal((await fileEvaluation(draft, ana.studentId, fake)).status, "stored");
  const record = fake.records[0];
  assert.equal(Object.keys(record.ratings!).length, 23);
  assert.deepEqual(record.ratings, draft.ratings);
  assert.deepEqual(record.discoverySources, draft.discoverySources);
  assert.equal(record.comments, draft.comments);
  assert.equal(record.othersSpecify, draft.othersSpecify);
  assert.deepEqual(recordFromItem({ ...record }), record);
});

test("missing index or event prevents a write", async () => {
  assert.equal((await fileEvaluation(validDraft(), ana.studentId, ports(false))).status, "misconfigured");
  assert.equal((await fileEvaluation(validDraft({ eventId: "" }), ana.studentId, ports())).status, "not_registered");
});

test("legacy metadata remains visible without invented response data", () => {
  const legacy = recordFromItem({ ...validDraft(), evaluationId: "old", filedAt: "2026-01-01T00:00:00Z" });
  assert.ok(legacy);
  assert.equal(legacy.ratings, null);
  assert.equal(legacy.discoverySources, null);
  assert.equal(legacy.schemaVersion, 1);
});

test("submission parser needs no browser identity and normalizes responses", () => {
  const parsed = parseEvaluationSubmission({ draft: { ...validDraft(), ratings: { meaningfulness: 99 }, discoverySources: { faculty: "true" } }, identity: { studentId: "spoofed" } });
  assert.ok(parsed);
  assert.deepEqual(parsed.draft.ratings, {});
  assert.equal(parsed.draft.discoverySources.faculty, false);
  assert.equal("identity" in parsed, false);
});

test("browser renderer preserves the template and its appearance-update fallback", async (t) => {
  const template = await readFile(new URL("../../../public/templates/evaluation-template.pdf", import.meta.url));
  t.mock.method(globalThis, "fetch", async (url: string) => {
    assert.equal(url, "/templates/evaluation-template.pdf");
    return new Response(template, { headers: { "Content-Type": "application/pdf" } });
  });
  const bytes = await fillEvaluationPdf(validDraft(), ana);
  assert.equal(Buffer.from(bytes.subarray(0, 4)).toString(), "%PDF");
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), (await PDFDocument.load(template)).getPageCount());
  const form = pdf.getForm();
  if (form.getFields().length) {
    assert.equal(form.getTextField("Name").getText(), ana.fullName);
    assert.equal(form.getTextField("SN").getText(), ana.studentId);
    assert.equal(form.getCheckBox("Check Box16").isChecked(), true);
  }
});

test("student and organization accounts route by verified claims", () => {
  assert.equal(isOfficer({ groups: [] }, ["admin"]), false);
  assert.equal(isOfficer({ organizationId: "org-1" }, ["admin"]), true);
  assert.equal(isOfficer({ groups: ["admin"] }, ["admin"]), true);
  assert.equal(isOfficer({ groups: ["org_submitter"] }, ["admin"]), false);
});

test("persisted responses are isolated by account, student number, and event", () => {
  const store = useEvaluationStore;
  store.getState().initialize("user-a", "event-a", "A", ana);
  store.getState().setComments("Saved response");
  store.getState().initialize("user-a", "event-a", "A", ana);
  assert.equal(store.getState().draft.comments, "Saved response");
  store.getState().initialize("user-b", "event-a", "A", ana);
  assert.equal(store.getState().draft.comments, "");
  store.getState().setComments("Other event");
  store.getState().initialize("user-b", "event-b", "B", ana);
  assert.equal(store.getState().draft.comments, "");
  store.getState().reset();
  assert.equal(store.getState().identity?.studentId, ana.studentId);
  assert.equal(store.getState().draft.eventId, "event-b");
});
