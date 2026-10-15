"use client";

import { useState } from "react";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataExportTable } from "@/components/officer/DataExportTable";
import { EventPostEvalPanel } from "@/components/officer/EventPostEvalPanel";
import type { ApexPublishedEvent } from "@/lib/apex/client";

export function EventWorkspace({ events, exportOnly = false }: { events: ApexPublishedEvent[]; exportOnly?: boolean }) {
  const [eventId, setEventId] = useState(events[0]?.event_id ?? "");
  if (!events.length) return <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">No events have an open evaluation window for your account. Events from other organizations are not shown to organization officers.</p>;
  return <div className="space-y-8">
    <div className="flex max-w-xl flex-col gap-2">
      <label htmlFor="officer-event" className="text-sm font-medium">Event</label>
      <Select items={events.map((event) => ({ value: event.event_id, label: `${event.title ?? "Untitled event"} — ${event.organization_name ?? event.organization_id ?? ""}` }))}
        value={eventId} onValueChange={(value) => setEventId(value ?? "")}>
        <SelectTrigger id="officer-event" className="w-full"><SelectValue placeholder="Select event" /></SelectTrigger>
        <SelectPopup>{events.map((event) => <SelectItem key={event.event_id} value={event.event_id}>{event.title ?? "Untitled event"} — {event.organization_name ?? event.organization_id}</SelectItem>)}</SelectPopup>
      </Select>
    </div>
    {eventId ? exportOnly ? <DataExportTable key={eventId} eventId={eventId} /> : <EventPostEvalPanel key={eventId} eventId={eventId} /> : null}
  </div>;
}
