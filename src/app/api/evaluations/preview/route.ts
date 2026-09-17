import { previewEvaluation } from "@/lib/evaluation/filing";
import {
  filingErrorResponse,
  filledPdfResponse,
  readEvaluationSubmission,
} from "@/lib/evaluation/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await readEvaluationSubmission(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const result = await previewEvaluation(
      parsed.submission.draft,
      parsed.submission.identity,
    );

    if (result.status !== "ready") {
      return filingErrorResponse(result);
    }

    return filledPdfResponse(result.pdf);
  } catch (error) {
    console.error("Error previewing evaluation:", error);
    return Response.json(
      { error: "Failed to preview the evaluation PDF" },
      { status: 500 },
    );
  }
}
