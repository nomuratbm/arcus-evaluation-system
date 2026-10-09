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
  url.searchParams.set("window", options.window ?? "evaluation");

  const response = await fetch(url, {
    headers: authHeaders(options.organizationId),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Apex events request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { data?: ApexPublishedEvent[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

/**
 * Mark an event's post-evaluation complete: mapua-apex flips the approved
 * submission to terminal `finished`. Idempotent server-side. The org scope must
 * match the submission's org or the backend returns 404.
 */
export async function finishEvent(options: {
  eventId: string;
  submissionId: string;
  organizationId?: string | null;
}): Promise<ApexPublishedEvent> {
  const url = new URL(
    `${apiBaseUrl()}/arcus/events/${encodeURIComponent(options.eventId)}/submissions/${encodeURIComponent(options.submissionId)}/finish`,
  );

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(options.organizationId),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: ApexPublishedEvent; message?: string }
    | null;

  if (!response.ok || !payload?.data) {
    const message =
      payload?.message ?? `Finish request failed (${response.status})`;
    throw new Error(message);
  }

  return payload.data;
}