"use client";

import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventPostEvalPanel } from "@/components/officer/EventPostEvalPanel";
import type { ApexPublishedEvent } from "@/lib/apex/client";

export function EventWorkspace({
  events,
  eventId,
  onEventIdChange,
}: {
  events: ApexPublishedEvent[];
  eventId: string;
  onEventIdChange: (eventId: string) => void;
}) {
  if (!events.length) {
    return (
      <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
        No events have an open evaluation window for your account. Events from other organizations are not shown to organization officers.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex max-w-xl flex-col gap-2">
        <label htmlFor="officer-event" className="text-sm font-medium">Event</label>
        <Select
          items={events.map((event) => ({
            value: event.event_id,
            label: eventLabel(event),
          }))}
          value={eventId}
          onValueChange={(value) => onEventIdChange(value ?? "")}
        >
          <SelectTrigger id="officer-event" className="w-full"><SelectValue placeholder="Select event" /></SelectTrigger>
          <SelectPopup>
            {events.map((event) => (
              <SelectItem key={event.event_id} value={event.event_id}>
                {eventLabel(event)}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>
      {eventId ? <EventPostEvalPanel key={eventId} eventId={eventId} /> : null}
    </div>
  );
}

function eventLabel(event: ApexPublishedEvent): string {
  const title = event.title ?? "Untitled event";
  return event.organization_name ? `${title} — ${event.organization_name}` : title;
}
