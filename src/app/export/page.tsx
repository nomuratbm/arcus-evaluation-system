import { EventWorkspace } from "@/components/officer/EventWorkspace";
import { requirePageSession } from "@/lib/auth/session";
import { fetchPublishedEvents, type ApexPublishedEvent } from "@/lib/apex/client";

export const metadata = {
  title: "Data export",
  description:
    "List filed student activity evaluations and download FM-SA-05-01 PDFs.",
};

export const dynamic = "force-dynamic";

export default async function DataExportPage() {
  const session = await requirePageSession("/export", true);
  let events: ApexPublishedEvent[] = [];
  let error: string | null = null;
  try { events = await fetchPublishedEvents({ organizationId: session.organizationId, window: "evaluation" }); }
  catch { error = "Events could not be loaded. Refresh this page to try again."; }
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Data export
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose an event to browse its filed evaluations and generate FM-SA-05-01 PDFs in your browser.
        </p>
      </div>
      <div className="mt-8">
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <EventWorkspace events={events} exportOnly />}
      </div>
    </main>
  );
}
