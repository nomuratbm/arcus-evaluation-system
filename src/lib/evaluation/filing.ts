import { fillEvaluationPdf } from "@/lib/evaluation/fill-pdf";
import type { EvaluationDraft } from "@/lib/evaluation/schema";
import {
  validateEvaluationDraft,
  type ValidationResult,
} from "@/lib/evaluation/validate";
import type { EvaluationIndex } from "@/lib/evaluation/catalog-types";
import { createEvaluationId, dynamoEvaluationIndex } from "@/lib/dynamodb/evaluations";
import { putEvaluationPdf, s3BucketName } from "@/lib/s3/evaluations";
import type { StudentIdentity, StudentLookupResult } from "@/lib/student-identity";
import { lookupStudent } from "@/lib/student-lookup";

export type EvaluationPdfStore = {
  isConfigured(): boolean;
  put(input: {
    studentId: string;
    body: Uint8Array;
  }): Promise<{ key: string; bucket: string }>;
};

export type StudentLookup = (studentId: string) => Promise<StudentLookupResult>;

export type EvaluationFilingPorts = {
  lookup: StudentLookup;
  store: EvaluationPdfStore;
  index: EvaluationIndex;
};

export type AssembledEvaluation = {
  identity: StudentIdentity;
  pdf: Uint8Array;
};

export type AssembleEvaluationResult =
  | { status: "invalid"; errors: ValidationResult["errors"] }
  | { status: "not_registered" }
  | { status: "ready"; assembled: AssembledEvaluation };

export type PreviewEvaluationResult =
  | { status: "invalid"; errors: ValidationResult["errors"] }
  | { status: "not_registered" }
  | { status: "ready"; pdf: Uint8Array };

export type FileEvaluationResult =
  | { status: "invalid"; errors: ValidationResult["errors"] }
  | { status: "not_registered" }
  | { status: "misconfigured" }
  | { status: "stored"; evaluationId: string; key: string; bucket: string };

const s3Store: EvaluationPdfStore = {
  isConfigured() {
    return Boolean(s3BucketName());
  },
  put: putEvaluationPdf,
};

const productionPorts: EvaluationFilingPorts = {
  lookup: lookupStudent,
  store: s3Store,
  index: dynamoEvaluationIndex,
};

/**
 * Validate, re-lookup the registered student, and fill FM-SA-05-01.
 * Never writes to object storage or the evaluation index.
 */
export async function assembleEvaluation(
  draft: EvaluationDraft,
  claimedIdentity: StudentIdentity,
  ports: Pick<EvaluationFilingPorts, "lookup"> = productionPorts,
): Promise<AssembleEvaluationResult> {
  const claimedValidation = validateEvaluationDraft(draft, claimedIdentity);
  if (!claimedValidation.ok) {
    return { status: "invalid", errors: claimedValidation.errors };
  }

  const lookup = await ports.lookup(draft.studentId);
  if (lookup.status !== "found") {
    return { status: "not_registered" };
  }

  const identity = lookup.student;
  if (claimedIdentity.studentId !== identity.studentId) {
    return { status: "not_registered" };
  }

  const pdf = await fillEvaluationPdf(draft, identity);
  return { status: "ready", assembled: { identity, pdf } };
}

/** Filled FM-SA-05-01 bytes for review. Does not call the store. */
export async function previewEvaluation(
  draft: EvaluationDraft,
  claimedIdentity: StudentIdentity,
  ports: EvaluationFilingPorts = productionPorts,
): Promise<PreviewEvaluationResult> {
  const assembled = await assembleEvaluation(draft, claimedIdentity, ports);
  if (assembled.status !== "ready") {
    return assembled;
  }

  return { status: "ready", pdf: assembled.assembled.pdf };
}

/** Assemble then persist PDF + DynamoDB index. The only write path. */
export async function fileEvaluation(
  draft: EvaluationDraft,
  claimedIdentity: StudentIdentity,
  ports: EvaluationFilingPorts = productionPorts,
): Promise<FileEvaluationResult> {
  const claimedValidation = validateEvaluationDraft(draft, claimedIdentity);
  if (!claimedValidation.ok) {
    return { status: "invalid", errors: claimedValidation.errors };
  }

  if (!ports.store.isConfigured() || !ports.index.isConfigured()) {
    return { status: "misconfigured" };
  }

  const assembled = await assembleEvaluation(draft, claimedIdentity, ports);
  if (assembled.status !== "ready") {
    return assembled;
  }

  const stored = await ports.store.put({
    studentId: assembled.assembled.identity.studentId,
    body: assembled.assembled.pdf,
  });

  const evaluationId = createEvaluationId();
  const filedAt = new Date().toISOString();
  const identity = assembled.assembled.identity;

  await ports.index.put({
    evaluationId,
    studentId: identity.studentId,
    fullName: identity.fullName,
    programYear: identity.programYear,
    organizationName: identity.organizationName,
    department: draft.department,
    recentActivity: draft.recentActivity,
    dateParticipated: draft.dateParticipated,
    participated: draft.participated === "yes" ? "yes" : "no",
    s3Bucket: stored.bucket,
    s3Key: stored.key,
    filedAt,
  });

  return {
    status: "stored",
    evaluationId,
    key: stored.key,
    bucket: stored.bucket,
  };
}
