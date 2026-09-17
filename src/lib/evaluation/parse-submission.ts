import {
  DISCOVERY_SOURCES,
  EVALUATION_CRITERIA,
  type CriterionId,
  type DiscoverySourceId,
  type RatingValue,
} from "@/lib/evaluation/criteria";
import {
  createEmptyDraft,
  type EvaluationDraft,
  type YesNo,
} from "@/lib/evaluation/schema";
import {
  studentIdentityFromUnknown,
  type StudentIdentity,
} from "@/lib/student-identity";

export type EvaluationSubmission = {
  draft: EvaluationDraft;
  identity: StudentIdentity;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseYesNo(value: unknown): YesNo | null {
  return value === "yes" || value === "no" ? value : null;
}

function parseRating(value: unknown): RatingValue | undefined {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : undefined;
}

export function parseEvaluationSubmission(
  value: unknown,
): EvaluationSubmission | null {
  if (!isRecord(value)) {
    return null;
  }

  const identity = studentIdentityFromUnknown(value.identity);
  if (!identity) {
    return null;
  }

  if (!isRecord(value.draft)) {
    return null;
  }

  const raw = value.draft;
  const draft = createEmptyDraft();
  draft.studentId =
    typeof raw.studentId === "string" ? raw.studentId : "";
  draft.department =
    typeof raw.department === "string" ? raw.department : "";
  draft.participated = parseYesNo(raw.participated);
  draft.recentActivity =
    typeof raw.recentActivity === "string" ? raw.recentActivity : "";
  draft.dateParticipated =
    typeof raw.dateParticipated === "string" ? raw.dateParticipated : "";
  draft.othersSpecify =
    typeof raw.othersSpecify === "string" ? raw.othersSpecify : "";
  draft.comments = typeof raw.comments === "string" ? raw.comments : "";

  if (isRecord(raw.discoverySources)) {
    for (const source of DISCOVERY_SOURCES) {
      const id: DiscoverySourceId = source.id;
      draft.discoverySources[id] = raw.discoverySources[id] === true;
    }
  }

  if (isRecord(raw.ratings)) {
    for (const criterion of EVALUATION_CRITERIA) {
      const id: CriterionId = criterion.id;
      const rating = parseRating(raw.ratings[id]);
      if (rating !== undefined) {
        draft.ratings[id] = rating;
      }
    }
  }

  return { draft, identity };
}
