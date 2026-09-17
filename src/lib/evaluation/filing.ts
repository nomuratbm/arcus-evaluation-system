import { fillEvaluationPdf } from "@/lib/evaluation/fill-pdf";
import type { EvaluationDraft } from "@/lib/evaluation/schema";
import {
  validateEvaluationDraft,
  type ValidationResult,
} from "@/lib/evaluation/validate";
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
  | { status: "stored"; key: string; bucket: string };

const s3Store: EvaluationPdfStore = {
  isConfigured() {
    return Boolean(s3BucketName());
  },
  put: putEvaluationPdf,
};

const productionPorts: EvaluationFilingPorts = {
  lookup: lookupStudent,
  store: s3Store,
};

/**
 * Validate, re-lookup the registered student, and fill FM-SA-05-01.
 * Never writes to object storage.
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

/** Assemble then persist. The only write path. */
export async function fileEvaluation(
  draft: EvaluationDraft,
  claimedIdentity: StudentIdentity,
  ports: EvaluationFilingPorts = productionPorts,
): Promise<FileEvaluationResult> {
  const claimedValidation = validateEvaluationDraft(draft, claimedIdentity);
  if (!claimedValidation.ok) {
    return { status: "invalid", errors: claimedValidation.errors };
  }

  if (!ports.store.isConfigured()) {
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

  return { status: "stored", key: stored.key, bucket: stored.bucket };
}
