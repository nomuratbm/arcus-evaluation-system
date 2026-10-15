"use client";

import { DownloadIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { EvaluationRecord } from "@/lib/evaluation/catalog-types";

export function ExportEvaluationsButton({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const response = await fetch(
        `/api/export/evaluations?${new URLSearchParams({ eventId, limit: "200" })}`,
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof data === "object" && data && "error" in data && typeof data.error === "string"
            ? data.error
            : "Evaluations could not be exported.";
        throw new Error(message);
      }
      const evaluations =
        typeof data === "object" && data && "evaluations" in data && Array.isArray(data.evaluations)
          ? (data.evaluations as EvaluationRecord[])
          : [];
      const { buildEventEvaluationsPdf } = await import("@/lib/evaluation/event-pdf");
      const result = await buildEventEvaluationsPdf(evaluations);
      savePdf(result.pdf, pdfFilename(eventTitle));
      if (result.skipped > 0) {
        setNote(
          `Downloaded ${result.included} evaluations. ${result.skipped} older filings were left out because their responses were not stored.`,
        );
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Evaluations could not be exported.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex max-w-sm flex-col items-end gap-2">
      <Button type="button" variant="outline" loading={pending} disabled={!eventId || pending} onClick={() => void download()}>
        <DownloadIcon aria-hidden />
        Export evaluations
      </Button>
      {error ? <p role="alert" className="text-right text-sm text-destructive">{error}</p> : null}
      {note ? <p role="status" className="text-right text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function pdfFilename(title: string): string {
  const base = title.trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "event";
  return `${base}-evaluations.pdf`;
}

function savePdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
