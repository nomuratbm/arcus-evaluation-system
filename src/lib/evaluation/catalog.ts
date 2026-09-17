import type {
  EvaluationIndex,
  EvaluationListFilters,
  EvaluationRecord,
  OfficerDashboardStatus,
} from "@/lib/evaluation/catalog-types";
import { dynamoEvaluationIndex } from "@/lib/dynamodb/evaluations";
import { getEvaluationPdf, s3BucketName } from "@/lib/s3/evaluations";

export type EvaluationCatalogPorts = {
  index: EvaluationIndex;
  isStorageConfigured: () => boolean;
  fetchPdf: (input: {
    bucket: string;
    key: string;
  }) => Promise<Uint8Array>;
};

const productionPorts: EvaluationCatalogPorts = {
  index: dynamoEvaluationIndex,
  isStorageConfigured: () => Boolean(s3BucketName()),
  fetchPdf: getEvaluationPdf,
};

function startOfTodayIso(now = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekIso(now = new Date()): string {
  const d = new Date(now);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.toISOString();
}

/** List filed evaluations for Data export. */
export async function listFiledEvaluations(
  filters?: EvaluationListFilters,
  ports: EvaluationCatalogPorts = productionPorts,
): Promise<
  | { status: "misconfigured" }
  | { status: "ok"; evaluations: EvaluationRecord[] }
> {
  if (!ports.index.isConfigured()) {
    return { status: "misconfigured" };
  }

  const evaluations = await ports.index.list(filters);
  return { status: "ok", evaluations };
}

/** Load PDF bytes for an evaluation id. */
export async function downloadFiledEvaluation(
  evaluationId: string,
  ports: EvaluationCatalogPorts = productionPorts,
): Promise<
  | { status: "misconfigured" }
  | { status: "not_found" }
  | { status: "ok"; record: EvaluationRecord; pdf: Uint8Array }
> {
  if (!ports.index.isConfigured() || !ports.isStorageConfigured()) {
    return { status: "misconfigured" };
  }

  const record = await ports.index.get(evaluationId);
  if (!record) {
    return { status: "not_found" };
  }

  const pdf = await ports.fetchPdf({
    bucket: record.s3Bucket,
    key: record.s3Key,
  });

  return { status: "ok", record, pdf };
}

/** Officer landing status snapshot. */
export async function getOfficerDashboard(
  ports: EvaluationCatalogPorts = productionPorts,
): Promise<OfficerDashboardStatus> {
  const indexConfigured = ports.index.isConfigured();
  const storageConfigured = ports.isStorageConfigured();

  if (!indexConfigured) {
    return {
      totalFiled: 0,
      filedToday: 0,
      filedThisWeek: 0,
      recent: [],
      storageConfigured,
      indexConfigured,
    };
  }

  const evaluations = await ports.index.list({ limit: 100 });
  const today = startOfTodayIso();
  const week = startOfWeekIso();

  let filedToday = 0;
  let filedThisWeek = 0;
  for (const evaluation of evaluations) {
    if (evaluation.filedAt >= today) {
      filedToday += 1;
    }
    if (evaluation.filedAt >= week) {
      filedThisWeek += 1;
    }
  }

  return {
    totalFiled: evaluations.length,
    filedToday,
    filedThisWeek,
    recent: evaluations.slice(0, 5),
    storageConfigured,
    indexConfigured,
  };
}
