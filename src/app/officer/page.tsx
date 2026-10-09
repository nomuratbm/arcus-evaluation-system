import Link from "next/link";
import { redirect } from "next/navigation";

import { OfficerQuickActions } from "@/components/officer/OfficerQuickActions";
import { OpenEvaluations } from "@/components/officer/OpenEvaluations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchPublishedEvents,
  type ApexPublishedEvent,
} from "@/lib/apex/client";
import { requireAdmin } from "@/lib/auth/session";
import { getOfficerDashboard } from "@/lib/evaluation/catalog";

export const metadata = {
  title: "Officer dashboard",
  description: "Office of Student Affairs evaluation status and quick access.",
};

export const dynamic = "force-dynamic";

function formatFiledAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function OfficerDashboardPage() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/");
  }

  const status = await getOfficerDashboard();

  let openEvents: ApexPublishedEvent[] = [];
  let eventsError: string | null = null;
  try {
    openEvents = await fetchPublishedEvents({
      organizationId: auth.session.organizationId,
      window: "evaluation",
    });
  } catch (error) {
    eventsError =
      error instanceof Error
        ? error.message
        : "Could not load events from mapua-apex.";
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      // ... existing code ...
      <section className="mt-8">
        <h2 className="text-base font-semibold text-foreground">
          Quick access
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan a student number or jump to Data export.
        </p>
        <div className="mt-4">
          <OfficerQuickActions />
        </div>
      </section>

      <OpenEvaluations events={openEvents} error={eventsError} />

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">
            Recent filings
          </h2>
          <Button
            render={<Link href="/export" />}
            size="sm"
            variant="outline"
          >
            Open Data export
          </Button>
        </div>

        {status.recent.length === 0 ? (
          <Card className="mt-4">
            <CardPanel className="py-8 text-sm text-muted-foreground">
              No filed evaluations in the index yet.
            </CardPanel>
          </Card>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border bg-card">
            {status.recent.map((row) => (
              <li
                key={row.evaluationId}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {row.fullName}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({row.studentId})
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {row.recentActivity || "No recent activity listed"} ·{" "}
                    {row.department}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatFiledAt(row.filedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
