export const MAX_STUDENT_NUMBER_LENGTH = 10;

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

export function parseStudentNumber(value: string): string | null {
  const studentId = value.trim();
  if (!studentId || studentId.length > MAX_STUDENT_NUMBER_LENGTH) {
    return null;
  }
  return studentId;
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
