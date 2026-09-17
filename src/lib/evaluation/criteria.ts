export type CriterionId =
  | "meaningfulness"
  | "promotion"
  | "materials"
  | "production"
  | "flow"
  | "eventDate"
  | "venue"
  | "transportation"
  | "otherBenefits"
  | "effectiveness"
  | "mastery"
  | "attentiveness"
  | "fairness"
  | "communication"
  | "grooming"
  | "punctuality"
  | "objectiveMet"
  | "mapuanCoreValues"
  | "overallSatisfaction"
  | "impact"
  | "missionAdherence"
  | "peoAdherence"
  | "poAdherence";

export type CriterionGroup =
  | "general"
  | "execution"
  | "schedule"
  | "organizer"
  | "outcomes";

export type EvaluationCriterion = {
  id: CriterionId;
  number: number;
  label: string;
  group: CriterionGroup;
};

export const RATING_SCALE = [
  { value: 5, label: "Excellent" },
  { value: 4, label: "Very Good" },
  { value: 3, label: "Good" },
  { value: 2, label: "Fair" },
  { value: 1, label: "Poor" },
] as const;

export type RatingValue = (typeof RATING_SCALE)[number]["value"];

export const EVALUATION_CRITERIA: readonly EvaluationCriterion[] = [
  {
    id: "meaningfulness",
    number: 1,
    label: "Meaningfulness and relevance of the activity to your student life",
    group: "general",
  },
  {
    id: "promotion",
    number: 2,
    label: "Promotion of the activity / event",
    group: "general",
  },
  {
    id: "materials",
    number: 3,
    label: "Materials, equipment or resources used during the event",
    group: "execution",
  },
  {
    id: "production",
    number: 4,
    label: "Production (student appeal and aesthetics)",
    group: "execution",
  },
  {
    id: "flow",
    number: 5,
    label: "Flow of activity / module from start to finish",
    group: "schedule",
  },
  {
    id: "eventDate",
    number: 6,
    label: "Event date",
    group: "schedule",
  },
  {
    id: "venue",
    number: 7,
    label: "Venue: Neatness, space, accessibility",
    group: "schedule",
  },
  {
    id: "transportation",
    number: 8,
    label: "Transportation",
    group: "schedule",
  },
  {
    id: "otherBenefits",
    number: 9,
    label: "Other benefits: Allowance / Free bees",
    group: "schedule",
  },
  {
    id: "effectiveness",
    number: 10,
    label: "Effectiveness",
    group: "organizer",
  },
  {
    id: "mastery",
    number: 11,
    label: "Mastery of the subject matter",
    group: "organizer",
  },
  {
    id: "attentiveness",
    number: 12,
    label: "Attentiveness to participants or audience",
    group: "organizer",
  },
  {
    id: "fairness",
    number: 13,
    label: "Fairness and impartiality to students or subject matter",
    group: "organizer",
  },
  {
    id: "communication",
    number: 14,
    label: "Communication skills",
    group: "organizer",
  },
  {
    id: "grooming",
    number: 15,
    label: "Grooming",
    group: "organizer",
  },
  {
    id: "punctuality",
    number: 16,
    label: "Punctuality",
    group: "organizer",
  },
  {
    id: "objectiveMet",
    number: 17,
    label: "Was the objective of the activity met?",
    group: "outcomes",
  },
  {
    id: "mapuanCoreValues",
    number: 18,
    label: "Did the activity impart any of the MAPÚAN core values – DECIR?",
    group: "outcomes",
  },
  {
    id: "overallSatisfaction",
    number: 19,
    label: "Overall satisfaction",
    group: "outcomes",
  },
  {
    id: "impact",
    number: 20,
    label: "Impact / Importance of the activity",
    group: "outcomes",
  },
  {
    id: "missionAdherence",
    number: 21,
    label: "Level of adherence to any of the Mission Statements of the Institute",
    group: "outcomes",
  },
  {
    id: "peoAdherence",
    number: 22,
    label: "Level of adherence to the enumerated PEOs",
    group: "outcomes",
  },
  {
    id: "poAdherence",
    number: 23,
    label: "Level of adherence to the enumerated POs",
    group: "outcomes",
  },
] as const;

export const CRITERION_GROUP_LABELS: Record<CriterionGroup, string | null> = {
  general: null,
  execution: "Execution",
  schedule: "Schedule",
  organizer: "Organizer, Host or Presenter",
  outcomes: null,
};

export const DISCOVERY_SOURCES = [
  { id: "classmateSchoolmate", label: "Classmate / schoolmate" },
  { id: "faculty", label: "Faculty" },
  { id: "others", label: "Others" },
  { id: "onlineMitWebsite", label: "Online MIT website" },
  { id: "referenceMaterialsPromotion", label: "Reference Materials / Promotion" },
] as const;

export type DiscoverySourceId = (typeof DISCOVERY_SOURCES)[number]["id"];
