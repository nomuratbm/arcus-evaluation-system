import { parseEvaluationSubmission, type EvaluationSubmission } from "@/lib/evaluation/parse-submission";
import type {
  FileEvaluationResult,
  PreviewEvaluationResult,
} from "@/lib/evaluation/filing";

export async function readEvaluationSubmission(request: Request): Promise<
  | { ok: true; submission: EvaluationSubmission }
  | { ok: false; response: Response }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const submission = parseEvaluationSubmission(body);
  if (!submission) {
    return {
      ok: false,
      response: Response.json(
        { error: "Invalid evaluation payload" },
        { status: 400 },
      ),
    };
  }

  return { ok: true, submission };
}

export function filingErrorResponse(
  result: Exclude<PreviewEvaluationResult | FileEvaluationResult, { status: "ready" } | { status: "stored" }>,
): Response {
  if (result.status === "misconfigured") {
    return Response.json(
      {
        error:
          "Server configuration error: missing S3 bucket or DynamoDB table",
      },
      { status: 500 },
    );
  }

  if (result.status === "not_registered") {
    return Response.json(
      { error: "Student number is not registered" },
      { status: 404 },
    );
  }

  return Response.json(
    {
      error: "Please fix the highlighted fields before submitting.",
      errors: result.errors,
    },
    { status: 400 },
  );
}

export function filledPdfResponse(pdf: Uint8Array): Response {
  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="FM-SA-05-01.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
