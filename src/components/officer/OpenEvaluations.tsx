import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import type { ApexPublishedEvent } from "@/lib/apex/client";

type OpenEvaluationsProps = {
  events: ApexPublishedEvent[];
  error: string | null;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }
  try {
    return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
      new Date(`${value}T00:00:00`),
    );
  } catch {
    return value;
  }
}

/**
 * Build the evaluation-form link for an apex event, attributing every filing to
 * that event so mapua-apex can aggregate it under `EVENT#{event_id}`.
 */
function evaluateHref(event: ApexPublishedEvent): string {
  const params = new URLSearchParams({ eventId: event.event_id });
  if (event.title) {
    params.set("eventTitle", event.title);
  }
  return `/forms?${params.toString()}`;
}

export function OpenEvaluations({ events, error }: OpenEvaluationsProps) {
  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold text-foreground">
        Happening today
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Approved events taking place today. Open the evaluation form to capture
        participant responses — each filing is attributed to its event so the
        organizer can post-evaluate it in mapua-apex.
      </p>

      {error ? (
        <Card className="mt-4">
          <CardPanel className="py-6 text-sm text-destructive" role="alert">
            {error}
          </CardPanel>
        </Card>
      ) : events.length === 0 ? (
        <Card className="mt-4">
          <CardPanel className="py-8 text-sm text-muted-foreground">
            No approved events are happening today.
          </CardPanel>
        </Card>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-2xl border bg-card">
          {events.map((event) => {
            const finished = event.status === "finished";
            return (
              <li
                key={event.submission_id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {event.title || event.event_id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      event.organization_name,
                      formatDate(event.date_of_event),
                      event.venue,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={finished ? "success" : "warning"}>
                    {finished ? "Finished" : "Today"}
                  </Badge>
                  <Button
                    render={<Link href={evaluateHref(event)} />}
                    size="sm"
                    variant="outline"
                  >
                    Evaluate
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
