import { fillEvaluationPdf } from "@/lib/evaluation/fill-pdf";
import type { EvaluationDraft } from "@/lib/evaluation/schema";
import { validateEvaluationDraft } from "@/lib/evaluation/validate";
import { putEvaluationPdf, s3BucketName } from "@/lib/s3/evaluations";
import { lookupStudent } from "@/lib/student-lookup";
import type { StudentIdentity } from "@/lib/student-identity";

export type SubmitEvaluationResult =
  | { status: "invalid"; errors: ReturnType<typeof validateEvaluationDraft>["errors"] }
  | { status: "not_registered" }
  | { status: "misconfigured" }
  | { status: "stored"; key: string; bucket: string };

/**
 * Validate a looked-up student evaluation, fill FM-SA-05-01, and store the PDF in S3.
 */
export async function submitEvaluation(
  draft: EvaluationDraft,
  claimedIdentity: StudentIdentity,
): Promise<SubmitEvaluationResult> {
  if (!s3BucketName()) {
    return { status: "misconfigured" };
  }

  const claimedValidation = validateEvaluationDraft(draft, claimedIdentity);
  if (!claimedValidation.ok) {
    return { status: "invalid", errors: claimedValidation.errors };
  }

  const lookup = await lookupStudent(draft.studentId);
  if (lookup.status !== "found") {
    return { status: "not_registered" };
  }

  const identity = lookup.student;
  if (claimedIdentity.studentId !== identity.studentId) {
    return { status: "not_registered" };
  }

  const pdf = await fillEvaluationPdf(draft, identity);
  const stored = await putEvaluationPdf({
    studentId: identity.studentId,
    body: pdf,
  });

  return { status: "stored", key: stored.key, bucket: stored.bucket };
}
