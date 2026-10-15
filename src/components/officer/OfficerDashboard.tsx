"use client";

import { useState } from "react";

import { EventWorkspace } from "@/components/officer/EventWorkspace";
import { ExportEvaluationsButton } from "@/components/officer/ExportEvaluationsButton";
import type { ApexPublishedEvent } from "@/lib/apex/client";

export function OfficerDashboard({
  events,
  organizationLine,
}: {
  events: ApexPublishedEvent[];
  organizationLine: string;
}) {
  const [eventId, setEventId] = useState(events[0]?.event_id ?? "");
  const selected = events.find((event) => event.event_id === eventId);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Officer dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">{organizationLine}</p>
        </div>
        {events.length > 0 ? (
          <ExportEvaluationsButton eventId={eventId} eventTitle={selected?.title ?? "Untitled event"} />
        ) : null}
      </div>
      <EventWorkspace events={events} eventId={eventId} onEventIdChange={setEventId} />
    </>
  );
}
