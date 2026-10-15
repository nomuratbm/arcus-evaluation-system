import { authErrorResponse, requireAdmin } from "@/lib/auth/session";
import { fetchPublishedEvents } from "@/lib/apex/client";
import { listFiledEvaluations } from "@/lib/evaluation/catalog";

export const dynamic = "force-dynamic";

function requestedLimit(value: string | null): number {
  if (!value) return 200;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return 200;
  return Math.min(Math.max(parsed, 1), 200);
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return authErrorResponse(auth.error);
  }

  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId")?.trim();
  if (!eventId) return Response.json({ error: "Select an event." }, { status: 400 });
  const studentId = url.searchParams.get("studentId") ?? undefined;
  const department = url.searchParams.get("department") ?? undefined;
  const activityQuery = url.searchParams.get("activity") ?? undefined;

  try {
    const events = await fetchPublishedEvents({ organizationId: auth.session.organizationId, window: "evaluation" });
    if (!events.some((event) => event.event_id === eventId)) return Response.json({ error: "This event is not available to your account." }, { status: 403 });
    const result = await listFiledEvaluations({
      eventId,
      studentId,
      department,
      activityQuery,
      limit: requestedLimit(url.searchParams.get("limit")),
    });

    if (result.status === "misconfigured") {
      return Response.json(
        { error: "Server configuration error: missing DynamoDB table" },
        { status: 500 },
      );
    }

    return Response.json({ evaluations: result.evaluations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error listing evaluations:", error);
    return Response.json(
      { error: "Failed to list evaluations" },
      { status: 500 },
    );
  }
}
