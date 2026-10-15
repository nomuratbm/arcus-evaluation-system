import "server-only";

import { readEnv } from "@/lib/dynamodb/env";

export type ApexEventWindow = "attendance" | "evaluation";

export type ApexWindowInfo = {
  opens_at: string | null;
  closes_at: string | null;
  is_open: boolean;
};

export type ApexPublishedEvent = {
  event_id: string;
  submission_id: string;
  organization_id: string | null;
  organization_name: string | null;
  status: string | null;
  title: string | null;
  venue: string | null;
  date_of_event: string | null;
  day_of_event: string | null;
  time_of_event: string | null;
  finished_at: string | null;
  attendance: ApexWindowInfo;
  evaluation: ApexWindowInfo;
};

function apiBaseUrl(): string {
  const value = readEnv("APEX_API_BASE_URL")?.replace(/\/$/, "");
  if (!value) {
    throw new Error("APEX_API_BASE_URL environment variable is not set");
  }
  return value;
}

function serviceToken(): string {
  const value = readEnv("ARCUS_SERVICE_TOKEN");
  if (!value) {
    throw new Error("ARCUS_SERVICE_TOKEN environment variable is not set");
  }
  return value;
}

function authHeaders(organizationId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Arcus-Service-Token": serviceToken(),
  };
  if (organizationId) {
    headers["X-Arcus-Organization-Id"] = organizationId;
  }
  return headers;
}

/**
 * Published (approved/finished) events whose window is open, from mapua-apex.
 * Server-side only. `organizationId` scopes to one org (org_submitter); omit it
 * for admins who act across every org.
 */
export async function fetchPublishedEvents(
  options: {
    organizationId?: string | null;
    window?: ApexEventWindow;
  } = {},
): Promise<ApexPublishedEvent[]> {
  const url = new URL(`${apiBaseUrl()}/arcus/events`);
  url.searchParams.set("window", options.window ?? "attendance");

  const response = await fetch(url, {
    headers: authHeaders(options.organizationId),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Apex events request failed (${response.status})`);
  }

  const payload = (await response.json()) as { data?: ApexPublishedEvent[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

export type ApexEventPostEval = {
  event_id: string;
  submission_id: string;
  organization_id: string | null;
  attendance_count: number;
  evaluation_count: number;
  attendance: { student_id: string; full_name: string }[];
  evaluations: { evaluation_id: string; student_id: string; full_name: string; participated: boolean; filed_at: string | null }[];
  post_eval: {
    posteval_id: string | null;
    status: string;
    submitted_at: string | null;
    approved_at: string | null;
    denied_at: string | null;
  };
};

export async function fetchStudentEvents(studentId: string): Promise<ApexPublishedEvent[]> {
  const response = await fetch(`${apiBaseUrl()}/arcus/students/${encodeURIComponent(studentId)}/events?window=evaluation`, {
    headers: authHeaders(), cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Apex student events request failed (${response.status})`);
  const payload = await response.json() as { data?: ApexPublishedEvent[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function fetchEventPostEval(eventId: string, organizationId?: string): Promise<ApexEventPostEval> {
  const response = await fetch(`${apiBaseUrl()}/arcus/events/${encodeURIComponent(eventId)}/post-eval`, {
    headers: authHeaders(organizationId), cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Apex post-evaluation request failed (${response.status})`);
  return await response.json() as ApexEventPostEval;
}