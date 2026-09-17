import Link from "next/link";
import { redirect } from "next/navigation";

import { OfficerQuickActions } from "@/components/officer/OfficerQuickActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { requireOfficer } from "@/lib/auth/session";
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
  const auth = await requireOfficer();
  if (!auth.ok) {
    redirect("/");
  }

  const status = await getOfficerDashboard();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Officer dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filing status and quick access for OSA officers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={status.indexConfigured ? "success" : "warning"}>
            DynamoDB {status.indexConfigured ? "ready" : "not configured"}
          </Badge>
          <Badge variant={status.storageConfigured ? "success" : "warning"}>
            S3 {status.storageConfigured ? "ready" : "not configured"}
          </Badge>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Filed today</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {status.filedToday}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>This week</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {status.filedThisWeek}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Listed in index</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {status.totalFiled}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

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
