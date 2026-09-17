import {
  DISCOVERY_SOURCES,
  EVALUATION_CRITERIA,
  type CriterionId,
  type DiscoverySourceId,
  type RatingValue,
} from "./criteria";

export type YesNo = "yes" | "no";

export type RatingsMap = Partial<Record<CriterionId, RatingValue>>;

export type DiscoverySources = Record<DiscoverySourceId, boolean>;

export type EvaluationDraft = {
  studentId: string;
  department: string;
  participated: YesNo | null;
  recentActivity: string;
  dateParticipated: string;
  discoverySources: DiscoverySources;
  othersSpecify: string;
  ratings: RatingsMap;
  comments: string;
};

function emptyDiscoverySources(): DiscoverySources {
  const sources = {} as DiscoverySources;
  for (const source of DISCOVERY_SOURCES) {
    sources[source.id] = false;
  }
  return sources;
}

export function createEmptyDraft(): EvaluationDraft {
  return {
    studentId: "",
    department: "",
    participated: null,
    recentActivity: "",
    dateParticipated: "",
    discoverySources: emptyDiscoverySources(),
    othersSpecify: "",
    ratings: {},
    comments: "",
  };
}

export function criterionIds(): CriterionId[] {
  return EVALUATION_CRITERIA.map((criterion) => criterion.id);
}
