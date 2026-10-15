"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApexEventPostEval } from "@/lib/apex/client";

export function EventPostEvalPanel({ eventId }: { eventId: string }) {
  const [data, setData] = useState<ApexEventPostEval | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setData(null);
      setError(null);
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/post-eval`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load this event.");
        if (!controller.signal.aborted) setData(payload);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load this event.");
      }
    }
    void load();
    return () => controller.abort();
  }, [eventId, revision]);

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Event post-evaluation</h2>
      <Button type="button" variant="outline" size="sm" onClick={() => setRevision((value) => value + 1)}>Refresh status</Button>
    </div>
    {error ? <p role="alert" className="text-sm text-destructive">{error} Use Refresh status to retry.</p> : !data ? <div aria-label="Loading attendance and post-evaluation" className="space-y-3" role="status"><Skeleton className="h-4 w-72 max-w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : <>
      <p className="text-sm">{data.attendance_count} attendance records · {data.evaluation_count} participant evaluations</p>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-medium">Apex review: {data.post_eval.status === "none" ? "Not submitted" : data.post_eval.status}</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          {([["Submitted", data.post_eval.submitted_at], ["Approved", data.post_eval.approved_at], ["Denied", data.post_eval.denied_at]] as const).map(([label, value]) => <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value ? new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "—"}</dd>
          </div>)}
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">Submit and review the organization’s POSTEVAL in Mapúa Apex. OSAAR approval there completes the event; participant evaluations here do not change its review status.</p>
      </div>
      <h3 className="font-medium">Participant responses</h3>
      {data.evaluations.length === 0 ? <p className="text-sm text-muted-foreground">No participant evaluations have been filed for this event yet.</p> :
        <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Participated</TableHead><TableHead>Filed</TableHead></TableRow></TableHeader>
          <TableBody>{data.evaluations.map((row) => <TableRow key={row.evaluation_id}>
            <TableCell><p>{row.full_name || row.student_id}</p><p className="text-xs text-muted-foreground">{row.student_id}</p></TableCell>
            <TableCell>{row.participated ? "Yes" : "No"}</TableCell>
            <TableCell>{row.filed_at ? new Date(row.filed_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "—"}</TableCell>
          </TableRow>)}</TableBody>
        </Table>}
    </>}
  </section>;
}
