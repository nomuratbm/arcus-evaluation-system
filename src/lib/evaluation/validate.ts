import {
  analyzeStudentNumber,
  describeStudentNumberIssue,
  isMatchingIdentity,
  type StudentIdentity,
} from "@/lib/student-identity";
import { isKnownDepartment } from "@/lib/departments";

import { EVALUATION_CRITERIA } from "./criteria";
import type { EvaluationDraft } from "./schema";

export type FieldErrorKey =
  | "studentId"
  | "department"
  | "participated"
  | "recentActivity"
  | "dateParticipated"
  | "discoverySources"
  | "othersSpecify"
  | "ratings"
  | "comments";

/** Input limits enforced across the form (client hints + server validation). */
export const FIELD_LIMITS = {
  recentActivity: { min: 3, max: 120 },
  othersSpecify: { max: 120 },
  comments: { max: 2000 },
} as const;

export type ValidationResult = {
  ok: boolean;
  errors: Partial<Record<FieldErrorKey, string>>;
  missingRatingCount: number;
};

function hasSelectedDiscoverySource(draft: EvaluationDraft): boolean {
  return Object.values(draft.discoverySources).some(Boolean);
}

/**
 * Validate an optional "date participated" value. Accepts an empty string
 * (field is optional) or a real calendar date in YYYY-MM-DD form that is not in
 * the future. Returns an error message, or null when acceptable.
 */
function validateDateParticipated(value: string, now: Date = new Date()): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Use the format YYYY-MM-DD.";
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Enter a valid calendar date.";
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (parsed.getTime() > today.getTime()) {
    return "Date participated cannot be in the future.";
  }

  return null;
}

/**
 * Validates a student evaluation draft.
 * A registered member must be resolved from the typed student number.
 * Department is selected on this form, not taken from the registry.
 * Ratings and recent-activity details are required only when the respondent
 * participated in an OSA program/activity.
 */
export function validateEvaluationDraft(
  draft: EvaluationDraft,
  identity: StudentIdentity | null,
  now: Date = new Date(),
): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  const studentNumberIssue = analyzeStudentNumber(draft.studentId, now);
  const studentNumberMessage = describeStudentNumberIssue(studentNumberIssue);
  if (studentNumberMessage) {
    errors.studentId = studentNumberMessage;
  } else if (!isMatchingIdentity(identity, draft.studentId)) {
    errors.studentId = "Look up a registered student number before submitting.";
  }

  const department = draft.department.trim();
  if (!department) {
    errors.department = "Select your department.";
  } else if (!isKnownDepartment(department)) {
    errors.department = "Select a department from the list.";
  }

  if (draft.participated == null) {
    errors.participated = "Please select Yes or No.";
  }

  let missingRatingCount = 0;

  if (draft.participated === "yes") {
    const recentActivity = draft.recentActivity.trim();
    if (!recentActivity) {
      errors.recentActivity = "Please name the activity you participated in.";
    } else if (recentActivity.length < FIELD_LIMITS.recentActivity.min) {
      errors.recentActivity = `Enter at least ${FIELD_LIMITS.recentActivity.min} characters.`;
    } else if (recentActivity.length > FIELD_LIMITS.recentActivity.max) {
      errors.recentActivity = `Keep this under ${FIELD_LIMITS.recentActivity.max} characters.`;
    }

    const dateError = validateDateParticipated(draft.dateParticipated, now);
    if (dateError) {
      errors.dateParticipated = dateError;
    }

    if (!hasSelectedDiscoverySource(draft)) {
      errors.discoverySources = "Select at least one discovery source.";
    }
    if (draft.discoverySources.others) {
      const others = draft.othersSpecify.trim();
      if (!others) {
        errors.othersSpecify = "Please specify how you found out.";
      } else if (others.length > FIELD_LIMITS.othersSpecify.max) {
        errors.othersSpecify = `Keep this under ${FIELD_LIMITS.othersSpecify.max} characters.`;
      }
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

  if (draft.comments.trim().length > FIELD_LIMITS.comments.max) {
    errors.comments = `Keep comments under ${FIELD_LIMITS.comments.max} characters.`;
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
