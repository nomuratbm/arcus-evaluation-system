import { authErrorResponse, requireSession } from "@/lib/auth/session";
import { fetchStudentEvents } from "@/lib/apex/client";
import { fileEvaluation } from "@/lib/evaluation/filing";
import {
  filingErrorResponse,
  readEvaluationSubmission,
} from "@/lib/evaluation/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return authErrorResponse(auth.error);
  if (!auth.session.studentId) return Response.json({ error: "Your account has no linked student number. Register in Arcus Attendance first." }, { status: 403 });
  const parsed = await readEvaluationSubmission(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const events = await fetchStudentEvents(auth.session.studentId);
    const event = events.find((candidate) => candidate.event_id === parsed.submission.draft.eventId);
    if (!event) return Response.json({ error: "You can only evaluate an attended event while its evaluation window is open." }, { status: 403 });
    const result = await fileEvaluation(
      { ...parsed.submission.draft, eventId: event.event_id, eventTitle: event.title ?? "Untitled event" },
      auth.session.studentId,
    );

    if (result.status !== "stored") {
      return filingErrorResponse(result);
    }

    return Response.json({
      stored: true,
      evaluationId: result.evaluationId,
    });
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    return Response.json(
      { error: "Failed to file the evaluation. Please try again." },
      { status: 500 },
    );
  }
}
