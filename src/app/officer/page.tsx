import { OfficerQuickActions } from "@/components/officer/OfficerQuickActions";
import { EventWorkspace } from "@/components/officer/EventWorkspace";
import { fetchPublishedEvents, type ApexPublishedEvent } from "@/lib/apex/client";
import { requirePageSession } from "@/lib/auth/session";

export const metadata = { title: "Officer dashboard", description: "Event participant evaluations and Apex post-evaluation review status." };

export default async function OfficerDashboardPage() {
  const session = await requirePageSession("/officer", true);
  let events: ApexPublishedEvent[] = [];
  let error: string | null = null;
  try { events = await fetchPublishedEvents({ organizationId: session.organizationId, window: "evaluation" }); }
  catch { error = "Events could not be loaded from Mapúa Apex. Refresh this page to try again."; }
  return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Officer dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">{session.organizationId ? `Organization: ${events[0]?.organization_name ?? session.organizationId}` : "Administrator access · All organizations"}</p>
      </div>
      <OfficerQuickActions />
    </div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <EventWorkspace events={events} />}
  </main>;
}
