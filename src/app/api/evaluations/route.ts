import { parseEvaluationSubmission } from "@/lib/evaluation/parse-submission";
import { submitEvaluation } from "@/lib/evaluation/submit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const submission = parseEvaluationSubmission(body);
  if (!submission) {
    return Response.json({ error: "Invalid evaluation payload" }, { status: 400 });
  }

  try {
    const result = await submitEvaluation(submission.draft, submission.identity);

    if (result.status === "misconfigured") {
      return Response.json(
        { error: "Server configuration error: missing S3 bucket" },
        { status: 500 },
      );
    }

    if (result.status === "not_registered") {
      return Response.json(
        { error: "Student number is not registered" },
        { status: 404 },
      );
    }

    if (result.status === "invalid") {
      return Response.json(
        { error: "Please fix the highlighted fields before submitting.", errors: result.errors },
        { status: 400 },
      );
    }

    return Response.json({
      stored: true,
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
