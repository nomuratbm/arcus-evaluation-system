import { createEvaluationId, dynamoEvaluationIndex } from "@/lib/dynamodb/evaluations";
import type { EvaluationIndex } from "@/lib/evaluation/catalog-types";
import type { EvaluationDraft } from "@/lib/evaluation/schema";
import { validateEvaluationDraft, type ValidationResult } from "@/lib/evaluation/validate";
import type { StudentLookupResult } from "@/lib/student-identity";
import { lookupStudent } from "@/lib/student-lookup";

export type EvaluationFilingPorts = {
  lookup: (studentId: string) => Promise<StudentLookupResult>;
  index: EvaluationIndex;
};

export type FileEvaluationResult =
  | { status: "invalid"; errors: ValidationResult["errors"] }
  | { status: "not_registered" }
  | { status: "misconfigured" }
  | { status: "stored"; evaluationId: string };

const productionPorts: EvaluationFilingPorts = {
  lookup: lookupStudent,
  index: dynamoEvaluationIndex,
};

/** The caller verifies event eligibility and supplies the authenticated student ID. */
export async function fileEvaluation(
  input: EvaluationDraft,
  studentId: string,
  ports: EvaluationFilingPorts = productionPorts,
): Promise<FileEvaluationResult> {
  if (!studentId || !input.eventId) return { status: "not_registered" };
  if (!ports.index.isConfigured()) return { status: "misconfigured" };
  const lookup = await ports.lookup(studentId);
  if (lookup.status !== "found" || lookup.student.studentId !== studentId) {
    return { status: "not_registered" };
  }
  const draft = { ...input, studentId };
  const validation = validateEvaluationDraft(draft, lookup.student);
  if (!validation.ok) return { status: "invalid", errors: validation.errors };
  // Bound free text so three copies fit comfortably within DynamoDB's item limits.
  if ([draft.comments, draft.othersSpecify, draft.recentActivity].some((value) => value.length > 10_000)) {
    return { status: "invalid", errors: { comments: "Keep each text response under 10,000 characters." } };
  }
  const evaluationId = createEvaluationId();
  await ports.index.put({
    ...draft,
    ...lookup.student,
    participated: draft.participated === "yes" ? "yes" : "no",
    schemaVersion: 2,
    evaluationId,
    filedAt: new Date().toISOString(),
  });
  return { status: "stored", evaluationId };
}
