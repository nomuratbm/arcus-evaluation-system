import { authErrorResponse, requireOfficer } from "@/lib/auth/session";
import { listFiledEvaluations } from "@/lib/evaluation/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireOfficer();
  if (!auth.ok) {
    return authErrorResponse(auth.error);
  }

  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId") ?? undefined;
  const department = url.searchParams.get("department") ?? undefined;
  const activityQuery = url.searchParams.get("activity") ?? undefined;

  try {
    const result = await listFiledEvaluations({
      studentId,
      department,
      activityQuery,
      limit: 100,
    });

    if (result.status === "misconfigured") {
      return Response.json(
        { error: "Server configuration error: missing DynamoDB table" },
        { status: 500 },
      );
    }

    return Response.json({ evaluations: result.evaluations });
  } catch (error) {
    console.error("Error listing evaluations:", error);
    return Response.json(
      { error: "Failed to list evaluations" },
      { status: 500 },
    );
  }
}
