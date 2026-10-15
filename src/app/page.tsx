import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/session";
import { fetchStudentEvents, type ApexPublishedEvent } from "@/lib/apex/client";

export default async function Home() {
  const session = await requirePageSession("/");
  if (session.role === "admin") redirect("/officer");
  let events: ApexPublishedEvent[] = [];
  let message: string | null = null;
  if (!session.studentId) {
    message = "Your account has no linked student number. Register in Arcus Attendance, then sign out and sign in again. If you already have a QR code, contact an administrator to link your existing registration.";
  } else {
    try { events = await fetchStudentEvents(session.studentId); }
    catch { message = "Your attended events could not be loaded. Refresh this page to try again."; }
  }
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Your event evaluations</h1>
      <p className="mt-3 text-base text-stone-600">Choose an event you attended to complete the FM-SA-05-01 form. Only events with an open evaluation window appear here.</p>
      {message ? <p role="status" className="mt-8 rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-700">{message}</p> : events.length === 0 ?
        <p className="mt-8 rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-700">No evaluations are available right now. Events appear after your attendance is recorded and while evaluations are open.</p> :
        <ul className="mt-8 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {events.map((event) => <li key={event.event_id}>
            <Link href={`/forms?${new URLSearchParams({ eventId: event.event_id, eventTitle: event.title ?? "Untitled event" })}`}
              className="block rounded-lg p-5 transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-sky-800">
              <h2 className="font-semibold text-sky-900">{event.title ?? "Untitled event"}</h2>
              <p className="mt-1 text-sm text-stone-600">{[event.organization_name, event.date_of_event, event.venue].filter(Boolean).join(" · ")}</p>
              <p className="mt-2 text-sm text-sky-900">Complete evaluation</p>
            </Link>
          </li>)}
        </ul>}
    </main>
  );
}
