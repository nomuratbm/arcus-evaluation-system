import { fileEvaluation } from "@/lib/evaluation/filing";
import {
  filingErrorResponse,
  readEvaluationSubmission,
} from "@/lib/evaluation/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await readEvaluationSubmission(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const result = await fileEvaluation(
      parsed.submission.draft,
      parsed.submission.identity,
    );

    if (result.status !== "stored") {
      return filingErrorResponse(result);
    }

    return Response.json({
      stored: true,
      evaluationId: result.evaluationId,
      key: result.key,
      bucket: result.bucket,
    });
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    return Response.json(
      { error: "Failed to store the evaluation PDF" },
      { status: 500 },
    );
  }
}
