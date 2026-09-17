import { isMatchingIdentity, type StudentIdentity } from "@/lib/student-identity";

import { EVALUATION_CRITERIA } from "./criteria";
import type { EvaluationDraft } from "./schema";

export type FieldErrorKey =
  | "studentId"
  | "department"
  | "participated"
  | "recentActivity"
  | "discoverySources"
  | "othersSpecify"
  | "ratings"
  | "comments";

export type ValidationResult = {
  ok: boolean;
  errors: Partial<Record<FieldErrorKey, string>>;
  missingRatingCount: number;
};

function hasSelectedDiscoverySource(draft: EvaluationDraft): boolean {
  return Object.values(draft.discoverySources).some(Boolean);
}

/**
 * Validates a student evaluation draft.
 * A registered member must be resolved from the typed student number.
 * Department is entered on this form, not taken from the registry.
 * Ratings and recent-activity details are required only when the respondent
 * participated in an OSA program/activity.
 */
export function validateEvaluationDraft(
  draft: EvaluationDraft,
  identity: StudentIdentity | null,
): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  if (!draft.studentId.trim()) {
    errors.studentId = "Enter your student number.";
  } else if (!isMatchingIdentity(identity, draft.studentId)) {
    errors.studentId = "Look up a registered student number before submitting.";
  }

  if (!draft.department.trim()) {
    errors.department = "Enter your department.";
  }

  if (draft.participated == null) {
    errors.participated = "Please select Yes or No.";
  }

  let missingRatingCount = 0;

  if (draft.participated === "yes") {
    if (!draft.recentActivity.trim()) {
      errors.recentActivity = "Please name the activity you participated in.";
    }
    if (!hasSelectedDiscoverySource(draft)) {
      errors.discoverySources = "Select at least one discovery source.";
    }
    if (draft.discoverySources.others && !draft.othersSpecify.trim()) {
      errors.othersSpecify = "Please specify how you found out.";
    }

    for (const criterion of EVALUATION_CRITERIA) {
      if (draft.ratings[criterion.id] == null) {
        missingRatingCount += 1;
      }
    }
    if (missingRatingCount > 0) {
      errors.ratings = `${missingRatingCount} satisfaction rating${missingRatingCount === 1 ? "" : "s"} still needed.`;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    missingRatingCount,
  };
}

export function countAnsweredRatings(draft: EvaluationDraft): number {
  let count = 0;
  for (const criterion of EVALUATION_CRITERIA) {
    if (draft.ratings[criterion.id] != null) {
      count += 1;
    }
  }
  return count;
}
