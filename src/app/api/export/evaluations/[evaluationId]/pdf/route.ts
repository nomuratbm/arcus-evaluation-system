import { authErrorResponse, requireAdmin } from "@/lib/auth/session";
import { downloadFiledEvaluation } from "@/lib/evaluation/catalog";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ evaluationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return authErrorResponse(auth.error);
  }

  const { evaluationId } = await context.params;
  if (!evaluationId?.trim()) {
    return Response.json({ error: "Missing evaluation id" }, { status: 400 });
  }

  try {
    const result = await downloadFiledEvaluation(evaluationId.trim());

    if (result.status === "misconfigured") {
      return Response.json(
        {
          error:
            "Server configuration error: missing DynamoDB table or S3 bucket",
        },
        { status: 500 },
      );
    }

    if (result.status === "not_found") {
      return Response.json({ error: "Evaluation not found" }, { status: 404 });
    }

    const filename = `${result.record.studentId}-evaluation.pdf`;
    return new Response(Buffer.from(result.pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error downloading evaluation PDF:", error);
    return Response.json(
      { error: "Failed to download evaluation PDF" },
      { status: 500 },
    );
  }
}
