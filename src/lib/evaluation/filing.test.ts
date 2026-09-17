import assert from "node:assert/strict";
import { test } from "node:test";

import { EVALUATION_CRITERIA } from "@/lib/evaluation/criteria";
import {
  fileEvaluation,
  previewEvaluation,
  type EvaluationPdfStore,
} from "@/lib/evaluation/filing";
import { createEmptyDraft, type EvaluationDraft } from "@/lib/evaluation/schema";
import type { StudentIdentity, StudentLookupResult } from "@/lib/student-identity";

const ana: StudentIdentity = {
  studentId: "2020123456",
  fullName: "Ana Santos",
  programYear: "BSCpE-4",
  organizationName: "JPCS",
};

function validDraft(overrides: Partial<EvaluationDraft> = {}): EvaluationDraft {
  return {
    ...createEmptyDraft(),
    studentId: ana.studentId,
    department: "Computer Engineering",
    participated: "no",
    ...overrides,
  };
}

function lookupOf(student: StudentIdentity | null): (studentId: string) => Promise<StudentLookupResult> {
  return async (studentId) => {
    if (!student || student.studentId !== studentId) {
      return { status: "not_found" };
    }
    return { status: "found", student };
  };
}

function memoryStore(configured = true): EvaluationPdfStore & {
  objects: Array<{ studentId: string; body: Uint8Array; key: string }>;
} {
  const objects: Array<{ studentId: string; body: Uint8Array; key: string }> = [];
  return {
    objects,
    isConfigured: () => configured,
    async put(input) {
      const key = `evaluations/${input.studentId}/test.pdf`;
      objects.push({ studentId: input.studentId, body: input.body, key });
      return { key, bucket: "test-bucket" };
    },
  };
}

function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

test("invalid draft returns field errors and does not write", async () => {
  const store = memoryStore();
  const result = await previewEvaluation(createEmptyDraft(), ana, {
    lookup: lookupOf(ana),
    store,
  });

  assert.equal(result.status, "invalid");
  if (result.status === "invalid") {
    assert.ok(result.errors.studentId);
    assert.ok(result.errors.department);
  }
  assert.equal(store.objects.length, 0);
});

test("unknown student is not_registered and does not write", async () => {
  const store = memoryStore();
  const result = await previewEvaluation(validDraft(), ana, {
    lookup: lookupOf(null),
    store,
  });

  assert.equal(result.status, "not_registered");
  assert.equal(store.objects.length, 0);
});

test("claimed studentId mismatch is not_registered", async () => {
  const store = memoryStore();
  const result = await previewEvaluation(validDraft(), ana, {
    lookup: lookupOf({ ...ana, studentId: "9999999999" }),
    store,
  });

  assert.equal(result.status, "not_registered");
  assert.equal(store.objects.length, 0);
});

test("preview of a valid registered draft returns PDF bytes and does not write", async () => {
  const store = memoryStore();
  const result = await previewEvaluation(validDraft(), ana, {
    lookup: lookupOf(ana),
    store,
  });

  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.ok(isPdf(result.pdf));
  }
  assert.equal(store.objects.length, 0);
});

test("file of the same draft writes one object", async () => {
  const store = memoryStore();
  const draft = validDraft({ comments: "Thank you." });
  const result = await fileEvaluation(draft, ana, {
    lookup: lookupOf(ana),
    store,
  });

  assert.equal(result.status, "stored");
  if (result.status === "stored") {
    assert.equal(result.key, `evaluations/${ana.studentId}/test.pdf`);
    assert.equal(result.bucket, "test-bucket");
  }
  assert.equal(store.objects.length, 1);
  assert.ok(isPdf(store.objects[0].body));
});

test("file without a bucket is misconfigured and skips lookup", async () => {
  let lookups = 0;
  const store = memoryStore(false);
  const result = await fileEvaluation(validDraft(), ana, {
    async lookup(studentId) {
      lookups += 1;
      return lookupOf(ana)(studentId);
    },
    store,
  });

  assert.equal(result.status, "misconfigured");
  assert.equal(lookups, 0);
  assert.equal(store.objects.length, 0);
});

test("participated yes still previews without storing", async () => {
  const store = memoryStore();
  const ratings = Object.fromEntries(
    EVALUATION_CRITERIA.map((criterion) => [criterion.id, 5 as const]),
  );
  const draft = validDraft({
    participated: "yes",
    recentActivity: "Intramurals",
    dateParticipated: "2026-09-01",
    discoverySources: {
      ...createEmptyDraft().discoverySources,
      faculty: true,
    },
    ratings,
  });

  const previewed = await previewEvaluation(draft, ana, {
    lookup: lookupOf(ana),
    store,
  });

  assert.equal(previewed.status, "ready");
  assert.equal(store.objects.length, 0);
});
