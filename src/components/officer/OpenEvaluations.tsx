"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardPanel,
} from "@/components/ui/card";
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

export function OpenEvaluations({ events, error }: OpenEvaluationsProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFinish(event: ApexPublishedEvent) {
    const key = event.submission_id;
    setBusyId(key);
    setMessage(null);
    try {
      const response = await fetch("/api/apex/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.event_id,
          submissionId: event.submission_id,
        }),
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const text =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to mark the event complete.";
        setMessage(text);
        return;
      }

      setDoneIds((previous) => Array.from(new Set([...previous, key])));
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold text-foreground">
        Open for post-evaluation
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Approved events within their 3-day post-evaluation window. Mark an event
        complete once its post-evaluation is filed — this sets the mapua-apex
        submission to <span className="font-medium">finished</span>.
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
            No approved events are in their post-evaluation window right now.
          </CardPanel>
        </Card>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-2xl border bg-card">
          {events.map((event) => {
            const finished =
              event.status === "finished" || doneIds.includes(event.submission_id);
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
                    {finished ? "Finished" : "Open"}
                  </Badge>
                  <Button
                    disabled={finished || busyId === event.submission_id}
                    loading={busyId === event.submission_id}
                    onClick={() => handleFinish(event)}
                    size="sm"
                    variant="outline"
                  >
                    {finished ? "Completed" : "Mark complete"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {message ? (
        <p className="mt-3 text-xs text-destructive" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}