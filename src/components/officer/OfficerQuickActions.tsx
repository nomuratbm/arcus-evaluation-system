"use client";

import { ScanLineIcon, DownloadIcon, ClipboardListIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OfficerQuickActions() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = studentId.trim();
    if (!trimmed) {
      setScanMessage("Enter or scan a student number.");
      return;
    }

    startTransition(async () => {
      setScanMessage(null);
      try {
        const response = await fetch(
          `/api/student?student_id=${encodeURIComponent(trimmed)}`,
        );
        const data: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "Student lookup failed.";
          setScanMessage(message);
          return;
        }

        const student =
          typeof data === "object" &&
          data &&
          "student" in data &&
          typeof data.student === "object" &&
          data.student &&
          "fullName" in data.student &&
          typeof data.student.fullName === "string"
            ? data.student.fullName
            : trimmed;

        setScanMessage(`Found ${student}. Opening evaluation form…`);
        router.push(`/forms?studentId=${encodeURIComponent(trimmed)}`);
      } catch {
        setScanMessage("Could not reach the server. Try again.");
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLineIcon aria-hidden className="size-4" />
            Scan student ID
          </CardTitle>
          <CardDescription>
            Look up a student number, then open the evaluation form.
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <form onSubmit={handleScan} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="officer-scan-sn">Student number</Label>
              <Input
                id="officer-scan-sn"
                name="studentId"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Scan or type SN"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
            </div>
            <Button type="submit" loading={isPending}>
              Scan & open form
            </Button>
            {scanMessage ? (
              <p className="text-xs text-muted-foreground" role="status">
                {scanMessage}
              </p>
            ) : null}
          </form>
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DownloadIcon aria-hidden className="size-4" />
            Data export
          </CardTitle>
          <CardDescription>
            List filed evaluations from DynamoDB and download PDFs from S3.
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <Button render={<Link href="/export" />}>Open Data export</Button>
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardListIcon aria-hidden className="size-4" />
            Evaluation form
          </CardTitle>
          <CardDescription>
            Open the student FM-SA-05-01 form (kiosk / assisted entry).
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <Button variant="outline" render={<Link href="/forms" />}>
            Open form
          </Button>
        </CardPanel>
      </Card>
    </div>
  );
}
