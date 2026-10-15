import { authErrorResponse, requireOfficer } from "@/lib/auth/session";
import { fetchEventPostEval, fetchPublishedEvents } from "@/lib/apex/client";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const auth = await requireOfficer();
  if (!auth.ok) return authErrorResponse(auth.error);
  const { eventId } = await context.params;
  try {
    const events = await fetchPublishedEvents({ organizationId: auth.session.organizationId, window: "evaluation" });
    if (!events.some((event) => event.event_id === eventId)) return Response.json({ error: "This event is not available to your account." }, { status: 403 });
    const data = await fetchEventPostEval(eventId, auth.session.organizationId);
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The event's post-evaluation could not be loaded. Please try again." }, { status: 502 });
  }
}
