import { OfficerDashboard } from "@/components/officer/OfficerDashboard";
import { fetchPublishedEvents, type ApexPublishedEvent } from "@/lib/apex/client";
import { requirePageSession } from "@/lib/auth/session";
import { getOrganizationName } from "@/lib/student-lookup";

export const metadata = { title: "Officer dashboard", description: "Event participant evaluations and Apex post-evaluation review status." };

export default async function OfficerDashboardPage() {
  const session = await requirePageSession("/officer", true);
  let events: ApexPublishedEvent[] = [];
  let error: string | null = null;
  try { events = await fetchPublishedEvents({ organizationId: session.organizationId, window: "evaluation" }); }
  catch { error = "Events could not be loaded from Mapúa Apex. Refresh this page to try again."; }
  const organizationName = await resolveOrganizationName(session.organizationId, events);
  const organizationLine = session.organizationId
    ? `Organization: ${organizationName ?? "Unavailable"}`
    : "Administrator access · All organizations";
  const namedEvents = organizationName
    ? events.map((event) => event.organization_name ? event : { ...event, organization_name: organizationName })
    : events;
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : (
        <OfficerDashboard events={namedEvents} organizationLine={organizationLine} />
      )}
    </main>
  );
}

async function resolveOrganizationName(
  organizationId: string | undefined,
  events: ApexPublishedEvent[],
): Promise<string | null> {
  const fromEvent = events.find((event) => event.organization_name)?.organization_name ?? null;
  if (fromEvent || !organizationId) {
    return fromEvent;
  }

  try {
    const name = await getOrganizationName(organizationId);
    return name || null;
  } catch (error) {
    console.error("Failed to resolve organization name:", error);
    return null;
  }
}
