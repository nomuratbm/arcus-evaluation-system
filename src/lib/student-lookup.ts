import { GetCommand } from "@aws-sdk/lib-dynamodb";

import { dynamodb, tableName } from "@/lib/dynamodb/client";
import {
  parseStudentNumber,
  type StudentIdentity,
  type StudentLookupResult,
} from "@/lib/student-identity";

type MemberRecord = {
  studentId: string;
  fullName: string;
  programYear: string;
  organizationId: string;
};

function memberItemKey(studentId: string): string {
  return studentId.startsWith("MEMBER#") ? studentId : `MEMBER#${studentId}`;
}

function studentIdFromMemberKey(key: string): string {
  return key.startsWith("MEMBER#") ? key.slice("MEMBER#".length) : key;
}

function organizationItemKey(organizationId: string): string {
  return organizationId.startsWith("ORGANIZATION#")
    ? organizationId
    : `ORGANIZATION#${organizationId}`;
}

async function getItemByKey(key: string): Promise<Record<string, unknown> | null> {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: key, SK: key },
    }),
  );

  return result.Item ? (result.Item as Record<string, unknown>) : null;
}

function memberFromRecord(item: Record<string, unknown>): MemberRecord | null {
  const pk = typeof item.PK === "string" ? item.PK : "";
  if (!pk) {
    return null;
  }

  const studentId =
    typeof item.student_id === "string" && item.student_id.trim()
      ? item.student_id.trim()
      : studentIdFromMemberKey(pk);

  if (!studentId) {
    return null;
  }

  return {
    studentId,
    fullName: typeof item.full_name === "string" ? item.full_name.trim() : "",
    programYear: typeof item.course === "string" ? item.course.trim() : "",
    organizationId:
      typeof item.current_organization === "string"
        ? item.current_organization.trim()
        : "",
  };
}

async function getMember(studentId: string): Promise<MemberRecord | null> {
  const keyed = memberItemKey(studentId);
  const keyedItem = await getItemByKey(keyed);
  if (keyedItem) {
    return memberFromRecord(keyedItem);
  }

  if (keyed !== studentId) {
    const fallbackItem = await getItemByKey(studentId);
    return fallbackItem ? memberFromRecord(fallbackItem) : null;
  }

  return null;
}

async function getOrganizationName(organizationId: string): Promise<string> {
  const key = organizationItemKey(organizationId);
  const item = await getItemByKey(key);
  if (!item) {
    return "";
  }

  return typeof item.org_name === "string" ? item.org_name.trim() : "";
}

function toStudentIdentity(member: MemberRecord, organizationName: string): StudentIdentity {
  return {
    studentId: member.studentId,
    fullName: member.fullName,
    programYear: member.programYear,
    organizationName,
  };
}

/**
 * Resolve a typed student number to display identity from the shared
 * attendance table. Callers never see DynamoDB keys or membership lists.
 */
export async function lookupStudent(
  studentId: string,
): Promise<StudentLookupResult> {
  const parsed = parseStudentNumber(studentId);
  if (!parsed) {
    return { status: "invalid" };
  }

  const member = await getMember(parsed);
  if (!member || !member.fullName || !member.programYear) {
    return { status: "not_found" };
  }

  const organizationName = member.organizationId
    ? await getOrganizationName(member.organizationId)
    : "";

  return {
    status: "found",
    student: toStudentIdentity(member, organizationName),
  };
}
