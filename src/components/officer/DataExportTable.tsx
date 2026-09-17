"use client";

import { DownloadIcon } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EvaluationRecord } from "@/lib/evaluation/catalog-types";

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

export function DataExportTable() {
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(() => {
    startLoading(async () => {
      setError(null);
      const params = new URLSearchParams();
      if (studentId.trim()) params.set("studentId", studentId.trim());
      if (department.trim()) params.set("department", department.trim());
      if (activityQuery.trim()) params.set("activity", activityQuery.trim());

      try {
        const response = await fetch(
          `/api/export/evaluations?${params.toString()}`,
        );
        const data: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "Failed to load evaluations";
          setError(message);
          setEvaluations([]);
          return;
        }

        const rows =
          typeof data === "object" &&
          data &&
          "evaluations" in data &&
          Array.isArray(data.evaluations)
            ? (data.evaluations as EvaluationRecord[])
            : [];
        setEvaluations(rows);
      } catch {
        setError("Could not reach the server.");
        setEvaluations([]);
      }
    });
  }, [activityQuery, department, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDownload(evaluationId: string) {
    setDownloadingId(evaluationId);
    setError(null);
    try {
      const response = await fetch(
        `/api/export/evaluations/${encodeURIComponent(evaluationId)}/pdf`,
      );
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        const message =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Download failed";
        setError(message);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${evaluationId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download the PDF.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        className="grid gap-3 sm:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="export-student-id">Student number</Label>
          <Input
            id="export-student-id"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="export-department">Department</Label>
          <Input
            id="export-department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="export-activity">Activity</Label>
          <Input
            id="export-activity"
            value={activityQuery}
            onChange={(event) => setActivityQuery(event.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" loading={isLoading}>
            Apply filters
          </Button>
        </div>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {evaluations.length === 0 && !isLoading ? (
        <Empty className="rounded-2xl border">
          <EmptyHeader>
            <EmptyTitle>No evaluations found</EmptyTitle>
            <EmptyDescription>
              Filed evaluations appear here after students submit FM-SA-05-01.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Filed</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((row) => (
              <TableRow key={row.evaluationId}>
                <TableCell>
                  <div className="font-medium">{row.fullName}</div>
                  <div className="text-muted-foreground text-xs">
                    {row.studentId} · {row.programYear}
                  </div>
                </TableCell>
                <TableCell>
                  {row.recentActivity || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{row.department || "—"}</TableCell>
                <TableCell className="tabular-nums text-xs">
                  {formatFiledAt(row.filedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={downloadingId === row.evaluationId}
                    onClick={() => handleDownload(row.evaluationId)}
                  >
                    <DownloadIcon aria-hidden />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
