import { authErrorResponse, requireSession } from "@/lib/auth/session";
import { fetchStudentEvents } from "@/lib/apex/client";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return authErrorResponse(auth.error);
  if (!auth.session.studentId) return Response.json({ error: "Your account has no linked student number." }, { status: 403 });
  try {
    return Response.json({ events: await fetchStudentEvents(auth.session.studentId) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Attended events could not be loaded. Please try again." }, { status: 502 });
  }
}
