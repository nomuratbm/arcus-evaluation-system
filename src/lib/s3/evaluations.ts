import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { readEnv } from "@/lib/dynamodb/env";

let client: S3Client | undefined;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: readEnv("AWS_REGION"),
    });
  }
  return client;
}

export function s3BucketName(): string | undefined {
  return readEnv("AWS_S3_BUCKET_NAME");
}

export async function putEvaluationPdf(input: {
  studentId: string;
  body: Uint8Array;
}): Promise<{ bucket: string; key: string }> {
  const bucket = s3BucketName();
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  const key = `evaluations/${input.studentId}/${new Date().toISOString().replaceAll(":", "-")}.pdf`;

  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.body,
      ContentType: "application/pdf",
      ContentDisposition: `attachment; filename="${input.studentId}-evaluation.pdf"`,
    }),
  );

  return { bucket, key };
}

export async function getEvaluationPdf(input: {
  bucket: string;
  key: string;
}): Promise<Uint8Array> {
  const result = await s3().send(
    new GetObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
    }),
  );

  if (!result.Body) {
    throw new Error("Evaluation PDF object was empty");
  }

  return new Uint8Array(await result.Body.transformToByteArray());
}
