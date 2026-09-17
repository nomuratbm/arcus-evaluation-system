import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { loadServerEnv, readEnv } from "@/lib/dynamodb/env";

loadServerEnv();

export const dynamodb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: readEnv("AWS_REGION"),
  }),
);

export function tableName(): string {
  const name = readEnv("DYNAMODB_TABLE_NAME");
  if (!name) {
    throw new Error("DYNAMODB_TABLE_NAME environment variable is not set");
  }
  return name;
}

export function hasDynamoTableConfig(): boolean {
  return Boolean(readEnv("DYNAMODB_TABLE_NAME"));
}
