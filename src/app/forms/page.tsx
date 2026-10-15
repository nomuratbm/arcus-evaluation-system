import Link from "next/link";
import { EvaluationForm } from "@/components/evaluation/EvaluationForm";
import { requirePageSession } from "@/lib/auth/session";
import { fetchStudentEvents } from "@/lib/apex/client";
import { lookupStudent } from "@/lib/student-lookup";
import type { StudentIdentity } from "@/lib/student-identity";

export const metadata = {
  title: "Student Activity Evaluation Form",
  description: "Evaluate Office of Student Affairs programs and activities (FM-SA-05-01).",
};

export default async function FormsPage({ searchParams }: {
  searchParams: Promise<{ eventId?: string; eventTitle?: string }>;
}) {
  const query = await searchParams;
  const eventId = typeof query.eventId === "string" ? query.eventId : "";
  const session = await requirePageSession(`/forms?${new URLSearchParams({ eventId })}`);
  let message: string | null = null;
  let student: StudentIdentity | null = null;
  let eventTitle = "";
  if (!session.studentId) {
    message = "Your account has no linked student number. Register in Arcus Attendance, then sign in again. Contact an administrator if you already have a QR code.";
  } else if (!eventId) {
    message = "Select an attended event from your event list first.";
  } else {
    try {
      const [events, lookup] = await Promise.all([fetchStudentEvents(session.studentId), lookupStudent(session.studentId)]);
      const event = events.find((candidate) => candidate.event_id === eventId);
      if (!event) message = "This event is not available: your attendance must be recorded and its evaluation window must be open.";
      else if (lookup.status !== "found") message = "Your student profile could not be found. Contact an administrator to check your registration.";
      else { student = lookup.student; eventTitle = event.title ?? "Untitled event"; }
    } catch {
      message = "The evaluation could not be loaded. Refresh this page to try again.";
    }
  }
  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/" className="mb-5 inline-block text-sm text-primary underline underline-offset-4">Back to events</Link>
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">{student ? <EvaluationForm key={`${session.userId}:${eventId}`} userId={session.userId} eventId={eventId} eventTitle={eventTitle} student={student} /> : <p role="status">{message}</p>}</div>
  </main>;
}
