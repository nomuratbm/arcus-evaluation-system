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
  s3Bucket: string;
  s3Key: string;
  filedAt: string;
};

export type EvaluationListFilters = {
  studentId?: string;
  department?: string;
  activityQuery?: string;
  limit?: number;
};

export type EvaluationIndex = {
  isConfigured(): boolean;
  put(record: EvaluationRecord): Promise<void>;
  list(filters?: EvaluationListFilters): Promise<EvaluationRecord[]>;
  get(evaluationId: string): Promise<EvaluationRecord | null>;
};

export type OfficerDashboardStatus = {
  totalFiled: number;
  filedToday: number;
  filedThisWeek: number;
  recent: EvaluationRecord[];
  storageConfigured: boolean;
  indexConfigured: boolean;
};
