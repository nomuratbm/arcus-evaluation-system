import type { EvaluationIndex, EvaluationListFilters } from "@/lib/evaluation/catalog-types";
import { dynamoEvaluationIndex } from "@/lib/dynamodb/evaluations";

/** The caller must authorize this event against the verified officer session. */
export async function listFiledEvaluations(
  filters: EvaluationListFilters,
  index: EvaluationIndex = dynamoEvaluationIndex,
) {
  if (!index.isConfigured()) return { status: "misconfigured" as const };
  return { status: "ok" as const, evaluations: await index.list(filters) };
}
