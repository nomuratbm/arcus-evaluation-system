import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

import { dynamodb, hasDynamoTableConfig, tableName } from "@/lib/dynamodb/client";
import type {
  EvaluationIndex,
  EvaluationListFilters,
  EvaluationRecord,
} from "@/lib/evaluation/catalog-types";

const LIST_PK = "EVALUATION";

function detailKeys(evaluationId: string) {
  const key = `EVALUATION#${evaluationId}`;
  return { PK: key, SK: key };
}

/** apex EVENT partition key for a bare (or already-prefixed) event id. */
function eventPartitionKey(eventId: string): string {
  const value = eventId.trim();
  return value.startsWith("EVENT#") ? value : `EVENT#${value}`;
}

function listSk(filedAt: string, evaluationId: string) {
  return `${filedAt}#${evaluationId}`;
}

function recordFromItem(item: Record<string, unknown>): EvaluationRecord | null {
  const evaluationId =
    typeof item.evaluationId === "string" ? item.evaluationId : "";
  const studentId = typeof item.studentId === "string" ? item.studentId : "";
  const s3Bucket = typeof item.s3Bucket === "string" ? item.s3Bucket : "";
  const s3Key = typeof item.s3Key === "string" ? item.s3Key : "";
  const filedAt = typeof item.filedAt === "string" ? item.filedAt : "";
  const participated =
    item.participated === "yes" || item.participated === "no"
      ? item.participated
      : null;

  if (!evaluationId || !studentId || !s3Bucket || !s3Key || !filedAt || !participated) {
    return null;
  }

  return {
    evaluationId,
    studentId,
    fullName: typeof item.fullName === "string" ? item.fullName : "",
    programYear: typeof item.programYear === "string" ? item.programYear : "",
    organizationName:
      typeof item.organizationName === "string" ? item.organizationName : "",
    department: typeof item.department === "string" ? item.department : "",
    recentActivity:
      typeof item.recentActivity === "string" ? item.recentActivity : "",
    dateParticipated:
      typeof item.dateParticipated === "string" ? item.dateParticipated : "",
    participated,
    s3Bucket,
    s3Key,
    filedAt,
    eventId: typeof item.eventId === "string" ? item.eventId : "",
  };
}

function toItemAttributes(record: EvaluationRecord) {
  return {
    entityType: "evaluation",
    evaluationId: record.evaluationId,
    studentId: record.studentId,
    fullName: record.fullName,
    programYear: record.programYear,
    organizationName: record.organizationName,
    department: record.department,
    recentActivity: record.recentActivity,
    dateParticipated: record.dateParticipated,
    participated: record.participated,
    s3Bucket: record.s3Bucket,
    s3Key: record.s3Key,
    filedAt: record.filedAt,
    eventId: record.eventId,
  };
}

function matchesFilters(
  record: EvaluationRecord,
  filters: EvaluationListFilters | undefined,
): boolean {
  if (!filters) {
    return true;
  }

  if (filters.studentId && record.studentId !== filters.studentId.trim()) {
    return false;
  }

  if (
    filters.department &&
    !record.department.toLowerCase().includes(filters.department.trim().toLowerCase())
  ) {
    return false;
  }

  if (filters.activityQuery) {
    const q = filters.activityQuery.trim().toLowerCase();
    if (!record.recentActivity.toLowerCase().includes(q)) {
      return false;
    }
  }

  return true;
}

export function createEvaluationId(): string {
  return randomUUID();
}

export const dynamoEvaluationIndex: EvaluationIndex = {
  isConfigured() {
    return hasDynamoTableConfig();
  },

  async put(record) {
    const table = tableName();
    const attrs = toItemAttributes(record);
    const detail = detailKeys(record.evaluationId);

    const writes = [
      new PutCommand({
        TableName: table,
        Item: { ...detail, ...attrs },
      }),
      new PutCommand({
        TableName: table,
        Item: {
          PK: LIST_PK,
          SK: listSk(record.filedAt, record.evaluationId),
          ...attrs,
        },
      }),
    ];

    // Per-event index item so mapua-apex can aggregate this filing under the
    // shared EVENT#{eventId} partition (post-evaluation Section 3) using
    // begins_with(SK, "EVALUATION#"). Skipped when the filing has no event.
    const eventId = record.eventId.trim();
    if (eventId) {
      writes.push(
        new PutCommand({
          TableName: table,
          Item: {
            PK: eventPartitionKey(eventId),
            SK: detail.PK,
            ...attrs,
          },
        }),
      );
    }

    await Promise.all(writes.map((command) => dynamodb.send(command)));
  },

  async list(filters) {
    const limit = Math.min(Math.max(filters?.limit ?? 100, 1), 200);
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName(),
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": LIST_PK },
        ScanIndexForward: false,
        Limit: Math.min(limit * 3, 300),
      }),
    );

    const records: EvaluationRecord[] = [];
    for (const item of result.Items ?? []) {
      const record = recordFromItem(item as Record<string, unknown>);
      if (!record || !matchesFilters(record, filters)) {
        continue;
      }
      records.push(record);
      if (records.length >= limit) {
        break;
      }
    }
    return records;
  },

  async get(evaluationId) {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName(),
        Key: detailKeys(evaluationId),
      }),
    );
    if (!result.Item) {
      return null;
    }
    return recordFromItem(result.Item as Record<string, unknown>);
  },
};
