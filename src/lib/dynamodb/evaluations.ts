import { BatchGetCommand, GetCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

import { dynamodb, hasDynamoTableConfig, tableName } from "@/lib/dynamodb/client";
import type { EvaluationIndex, EvaluationRecord } from "@/lib/evaluation/catalog-types";
import { parseEvaluationSubmission } from "@/lib/evaluation/parse-submission";

function detailKeys(evaluationId: string) {
  const key = `EVALUATION#${evaluationId}`;
  return { PK: key, SK: key };
}

export function recordFromItem(item: Record<string, unknown>): EvaluationRecord | null {
  const text = (key: string) => typeof item[key] === "string" ? item[key] as string : "";
  const participated = item.participated === "yes" || item.participated === "no" ? item.participated : null;
  if (!text("evaluationId") || !text("studentId") || !text("filedAt") || !participated) return null;
  const parsed = parseEvaluationSubmission({ draft: item })!;
  const complete = item.schemaVersion === 2 && typeof item.ratings === "object" && item.ratings !== null
    && typeof item.discoverySources === "object" && item.discoverySources !== null;
  return {
    ...parsed.draft,
    evaluationId: text("evaluationId"),
    studentId: text("studentId"),
    fullName: text("fullName"),
    programYear: text("programYear"),
    organizationName: text("organizationName"),
    participated,
    filedAt: text("filedAt"),
    schemaVersion: complete ? 2 : 1,
    ratings: complete ? parsed.draft.ratings : null,
    discoverySources: complete ? parsed.draft.discoverySources : null,
  };
}

export function createEvaluationId(): string { return randomUUID(); }

export const dynamoEvaluationIndex: EvaluationIndex = {
  isConfigured: hasDynamoTableConfig,
  async put(record) {
    const table = tableName();
    const attributes = { ...record, entityType: "evaluation" };
    const items = [
      { ...detailKeys(record.evaluationId), ...attributes },
      { PK: "EVALUATION", SK: `${record.filedAt}#${record.evaluationId}`, ...attributes },
      {
        PK: `EVENT#${record.eventId}`, SK: `EVALUATION#${record.evaluationId}`,
        entityType: "evaluation", evaluationId: record.evaluationId,
        eventId: record.eventId, studentId: record.studentId,
        fullName: record.fullName, participated: record.participated, filedAt: record.filedAt,
      },
    ];
    await dynamodb.send(new TransactWriteCommand({
      TransactItems: items.map((Item) => ({ Put: {
        TableName: table, Item, ConditionExpression: "attribute_not_exists(PK)",
      } })),
    }));
  },
  async list(filters) {
    if (!filters.eventId) return [];
    const table = tableName();
    const ids = new Set<string>();
    let cursor: Record<string, unknown> | undefined;
    do {
      const page = await dynamodb.send(new QueryCommand({
        TableName: table, KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: { ":pk": `EVENT#${filters.eventId}`, ":prefix": "EVALUATION#" },
        ProjectionExpression: "evaluationId", ExclusiveStartKey: cursor,
        ConsistentRead: true,
      }));
      for (const item of page.Items ?? []) {
        if (typeof item.evaluationId === "string") ids.add(item.evaluationId);
      }
      cursor = page.LastEvaluatedKey;
    } while (cursor);
    const keys = [...ids].map(detailKeys);
    const records: EvaluationRecord[] = [];
    for (let offset = 0; offset < keys.length; offset += 100) {
      let pending = keys.slice(offset, offset + 100);
      for (let attempt = 0; pending.length; attempt++) {
        if (attempt >= 5) throw new Error("Evaluation detail reads were throttled; retry the request");
        if (attempt) await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
        const batch = await dynamodb.send(new BatchGetCommand({
          RequestItems: { [table]: { Keys: pending, ConsistentRead: true } },
        }));
        for (const item of batch.Responses?.[table] ?? []) {
          const record = recordFromItem(item);
          if (!record || record.eventId !== filters.eventId) continue;
          if (filters.studentId && record.studentId !== filters.studentId.trim()) continue;
          if (filters.department && !record.department.toLowerCase().includes(filters.department.trim().toLowerCase())) continue;
          if (filters.activityQuery && !record.recentActivity.toLowerCase().includes(filters.activityQuery.trim().toLowerCase())) continue;
          records.push(record);
        }
        pending = (batch.UnprocessedKeys?.[table]?.Keys ?? []) as typeof pending;
      }
    }
    return records.sort((a, b) => b.filedAt.localeCompare(a.filedAt)).slice(0, Math.min(Math.max(filters.limit ?? 100, 1), 200));
  },
  async get(evaluationId) {
    const result = await dynamodb.send(new GetCommand({
      TableName: tableName(), Key: detailKeys(evaluationId), ConsistentRead: true,
    }));
    return result.Item ? recordFromItem(result.Item) : null;
  },
};
