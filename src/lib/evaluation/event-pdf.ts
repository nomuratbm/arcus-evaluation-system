import { PDFDocument } from "pdf-lib";

import type { EvaluationRecord } from "@/lib/evaluation/catalog-types";
import { fillEvaluationPdf } from "@/lib/evaluation/fill-pdf";

type ExportableEvaluation = EvaluationRecord & {
  ratings: NonNullable<EvaluationRecord["ratings"]>;
  discoverySources: NonNullable<EvaluationRecord["discoverySources"]>;
};

function isExportable(record: EvaluationRecord): record is ExportableEvaluation {
  return record.ratings !== null && record.discoverySources !== null;
}

/** One PDF, oldest filing first, with one FM-SA-05-01 per stored evaluation. */
export async function buildEventEvaluationsPdf(records: EvaluationRecord[]): Promise<{
  pdf: Uint8Array;
  included: number;
  skipped: number;
}> {
  const included = records.filter(isExportable).sort((a, b) => a.filedAt.localeCompare(b.filedAt));
  const skipped = records.length - included.length;
  if (included.length === 0) {
    throw new Error(
      records.length === 0
        ? "This event has no filed evaluations."
        : "This event's evaluations cannot be exported. Older filings do not include the responses needed to rebuild the form.",
    );
  }

  const merged = await PDFDocument.create();
  for (const record of included) {
    const bytes = await fillEvaluationPdf(record, record);
    const form = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(form, form.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }

  return { pdf: await merged.save(), included: included.length, skipped };
}
