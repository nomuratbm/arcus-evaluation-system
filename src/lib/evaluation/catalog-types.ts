import type { DiscoverySources, RatingsMap } from "@/lib/evaluation/schema";

export type EvaluationRecord = {
  evaluationId: string;
  studentId: string;
  fullName: string;
  programYear: string;
  organizationName: string;
  department: string;
  recentActivity: string;
  dateParticipated: string;
  participated: "yes" | "no";
  schemaVersion: number;
  eventTitle: string;
  ratings: RatingsMap | null;
  discoverySources: DiscoverySources | null;
  comments: string;
  othersSpecify: string;
  filedAt: string;
  /** apex event id this filing is attributed to ("" when unattributed). */
  eventId: string;
};

export type EvaluationListFilters = {
  eventId: string;
  studentId?: string;
  department?: string;
  activityQuery?: string;
  limit?: number;
};

export type EvaluationIndex = {
  isConfigured(): boolean;
  put(record: EvaluationRecord): Promise<void>;
  list(filters: EvaluationListFilters): Promise<EvaluationRecord[]>;
  get(evaluationId: string): Promise<EvaluationRecord | null>;
};
