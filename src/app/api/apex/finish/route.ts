import { finishEvent } from "@/lib/apex/client";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/apex/finish
 * Marks an event's post-evaluation complete by asking mapua-apex to flip the
 * approved submission to terminal `finished`. The org scope comes from the
 * verified session (org_submitter → their org; admin → unset/all), and the
 * shared service token is applied server-side in finishEvent().
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    const unauthenticated = auth.error.status === "unauthenticated";
    return Response.json(
      { error: unauthenticated ? "Authentication required" : "Admin access required" },
      { status: unauthenticated ? 401 : 403 },
    );
  }

  let body: { eventId?: unknown; submissionId?: unknown } | null = null;
  try {
    body = (await request.json()) as { eventId?: unknown; submissionId?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
  const submissionId =
    typeof body?.submissionId === "string" ? body.submissionId.trim() : "";
  if (!eventId || !submissionId) {
    return Response.json(
      { error: "eventId and submissionId are required" },
      { status: 400 },
    );
  }

  try {
    const event = await finishEvent({
      eventId,
      submissionId,
      organizationId: auth.session.organizationId,
    });
    return Response.json({ finished: true, event });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to mark the event complete.";
    return Response.json({ error: message }, { status: 502 });
  }
}