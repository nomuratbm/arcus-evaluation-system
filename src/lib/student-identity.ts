export const MAX_STUDENT_NUMBER_LENGTH = 10;

/** Student numbers follow the convention ####$$$$$$ (4-digit year + 6 digits). */
export const STUDENT_NUMBER_LENGTH = 10;
export const SCHOOL_YEAR_DIGITS = 4;

/** A school year is accepted from (currentYear - 9) up to the current year. */
export const SCHOOL_YEAR_RANGE = 9;

export const NO_ORGANIZATION_LABEL = "No organization";

export type StudentIdentity = {
  studentId: string;
  fullName: string;
  programYear: string;
  organizationName: string;
};

export type StudentLookupResult =
  | { status: "invalid" }
  | { status: "not_found" }
  | { status: "found"; student: StudentIdentity };

export type StudentNumberIssue =
  | { code: "empty" }
  | { code: "not_numeric" }
  | { code: "too_short"; length: number }
  | { code: "too_long"; length: number }
  | {
      code: "year_out_of_range";
      year: number;
      minYear: number;
      maxYear: number;
    }
  | { code: "ok"; studentId: string; schoolYear: number };

/**
 * Analyze a raw student number against the ####$$$$$$ convention without
 * throwing. Used by both client-side field messaging and server-side parsing.
 */
export function analyzeStudentNumber(
  value: string,
  now: Date = new Date(),
): StudentNumberIssue {
  const trimmed = value.trim();

  if (!trimmed) {
    return { code: "empty" };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { code: "not_numeric" };
  }
  if (trimmed.length < STUDENT_NUMBER_LENGTH) {
    return { code: "too_short", length: trimmed.length };
  }
  if (trimmed.length > STUDENT_NUMBER_LENGTH) {
    return { code: "too_long", length: trimmed.length };
  }

  const currentYear = now.getFullYear();
  const minYear = currentYear - SCHOOL_YEAR_RANGE;
  const schoolYear = Number(trimmed.slice(0, SCHOOL_YEAR_DIGITS));

  if (schoolYear < minYear || schoolYear > currentYear) {
    return { code: "year_out_of_range", year: schoolYear, minYear, maxYear: currentYear };
  }

  return { code: "ok", studentId: trimmed, schoolYear };
}

/** Human-readable message for a student-number issue, or null when valid. */
export function describeStudentNumberIssue(
  issue: StudentNumberIssue,
): string | null {
  switch (issue.code) {
    case "empty":
      return "Enter your student number.";
    case "not_numeric":
      return "Student number must contain digits only.";
    case "too_short":
    case "too_long":
      return `Student number must be exactly ${STUDENT_NUMBER_LENGTH} digits.`;
    case "year_out_of_range":
      return `School year must be between ${issue.minYear} and ${issue.maxYear}.`;
    case "ok":
      return null;
  }
}

export function parseStudentNumber(
  value: string,
  now: Date = new Date(),
): string | null {
  const issue = analyzeStudentNumber(value, now);
  return issue.code === "ok" ? issue.studentId : null;
}

export function organizationDisplayName(organizationName: string): string {
  const trimmed = organizationName.trim();
  return trimmed ? trimmed : NO_ORGANIZATION_LABEL;
}

export function isMatchingIdentity(
  identity: StudentIdentity | null,
  studentId: string,
): identity is StudentIdentity {
  const parsed = parseStudentNumber(studentId);
  return Boolean(identity && parsed && identity.studentId === parsed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function studentIdentityFromUnknown(
  value: unknown,
): StudentIdentity | null {
  if (!isRecord(value)) {
    return null;
  }

  const studentId =
    typeof value.studentId === "string" ? value.studentId.trim() : "";
  const fullName =
    typeof value.fullName === "string" ? value.fullName.trim() : "";
  const programYear =
    typeof value.programYear === "string" ? value.programYear.trim() : "";
  const organizationName =
    typeof value.organizationName === "string" ? value.organizationName : "";

  if (!studentId || !fullName || !programYear) {
    return null;
  }

  return {
    studentId,
    fullName,
    programYear,
    organizationName: organizationName.trim(),
  };
}
