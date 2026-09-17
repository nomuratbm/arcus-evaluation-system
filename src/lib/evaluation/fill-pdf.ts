import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { PDFDocument, type PDFCheckBox, type PDFForm } from "pdf-lib";

import type { CriterionId, RatingValue } from "@/lib/evaluation/criteria";
import type { EvaluationDraft } from "@/lib/evaluation/schema";
import {
  organizationDisplayName,
  type StudentIdentity,
} from "@/lib/student-identity";

/** Template identity and student-body fields. Staff AVERAGE/header fields stay empty. */
const TEXT_FIELDS = {
  name: "Name",
  programAndYear: "Program and Year",
  organization: "Organization",
  studentNumber: "SN",
  recentActivity: "What activity or program did you participate in recently",
  dateParticipated: "Date participated if applicable",
  othersSpecify: "undefined",
  comments: "Comments and suggestions",
} as const;

const PARTICIPATED_YES = "Check Box15";
const PARTICIPATED_NO = "Check Box16";

const DISCOVERY_CHECKBOXES = {
  classmateSchoolmate: "Classmate  schoolmate",
  faculty: "Faculty",
  others: "Others",
  onlineMitWebsite: "Online MIT website",
  referenceMaterialsPromotion: "Reference Materials  Promotion",
} as const;

/** Each row is Excellent→Poor (5→1), matching the PDF grid from left to right. */
const RATING_CHECKBOX_ROWS: Record<
  CriterionId,
  readonly [string, string, string, string, string]
> = {
  meaningfulness: [
    "Check Box17",
    "Check Box18",
    "Check Box19",
    "Check Box20",
    "Check Box21",
  ],
  promotion: [
    "Check Box22",
    "Check Box23",
    "Check Box24",
    "Check Box25",
    "Check Box26",
  ],
  materials: [
    "Check Box27",
    "Check Box28",
    "Check Box29",
    "Check Box30",
    "Check Box31",
  ],
  production: [
    "Check Box32",
    "Check Box33",
    "Check Box34",
    "Check Box35",
    "Check Box36",
  ],
  flow: [
    "Check Box37",
    "Check Box38",
    "Check Box39",
    "Check Box40",
    "Check Box41",
  ],
  eventDate: [
    "Check Box42",
    "Check Box43",
    "Check Box44",
    "Check Box45",
    "Check Box46",
  ],
  venue: [
    "Check Box47",
    "Check Box48",
    "Check Box49",
    "Check Box50",
    "Check Box51",
  ],
  transportation: [
    "Check Box52",
    "Check Box53",
    "Check Box54",
    "Check Box55",
    "Check Box56",
  ],
  otherBenefits: [
    "Check Box57",
    "Check Box58",
    "Check Box59",
    "Check Box60",
    "Check Box61",
  ],
  effectiveness: [
    "Check Box62",
    "Check Box63",
    "Check Box64",
    "Check Box65",
    "Check Box66",
  ],
  mastery: [
    "Check Box67",
    "Check Box68",
    "Check Box69",
    "Check Box70",
    "Check Box71",
  ],
  attentiveness: [
    "Check Box72",
    "Check Box73",
    "Check Box74",
    "Check Box75",
    "Check Box76",
  ],
  fairness: [
    "Check Box77",
    "Check Box78",
    "Check Box79",
    "Check Box80",
    "Check Box81",
  ],
  communication: [
    "Check Box82",
    "Check Box83",
    "Check Box84",
    "Check Box85",
    "Check Box86",
  ],
  grooming: [
    "Check Box87",
    "Check Box88",
    "Check Box89",
    "Check Box90",
    "Check Box91",
  ],
  punctuality: [
    "Check Box92",
    "Check Box93",
    "Check Box94",
    "Check Box95",
    "Check Box96",
  ],
  objectiveMet: [
    "Check Box97",
    "Check Box98",
    "Check Box99",
    "Check Box100",
    "Check Box101",
  ],
  mapuanCoreValues: [
    "Check Box102",
    "Check Box103",
    "Check Box104",
    "Check Box105",
    "Check Box106",
  ],
  overallSatisfaction: [
    "Check Box107",
    "Check Box108",
    "Check Box109",
    "Check Box110",
    "Check Box111",
  ],
  impact: [
    "Check Box112",
    "Check Box113",
    "Check Box114",
    "Check Box115",
    "Check Box116",
  ],
  missionAdherence: [
    "Check Box117",
    "Check Box118",
    "Check Box119",
    "Check Box120",
    "Check Box121",
  ],
  peoAdherence: [
    "Check Box122",
    "Check Box123",
    "Check Box124",
    "Check Box125",
    "Check Box126",
  ],
  poAdherence: [
    "Check Box127",
    "Check Box128",
    "Check Box129",
    "Check Box130",
    "Check Box131",
  ],
};

const templateBytesPromise = readFile(
  join(process.cwd(), "public/templates/evaluation-template.pdf"),
);

function toPdfText(value: string): string {
  return value
    .replaceAll("Ú", "U")
    .replaceAll("ú", "u")
    .replaceAll("Ñ", "N")
    .replaceAll("ñ", "n")
    .normalize("NFKD")
    .replaceAll(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function setText(form: PDFForm, name: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  form.getTextField(name).setText(toPdfText(trimmed));
}

function setChecked(form: PDFForm, name: string, checked: boolean) {
  const field: PDFCheckBox = form.getCheckBox(name);
  if (checked) {
    field.check();
    return;
  }
  field.uncheck();
}

function checkRating(form: PDFForm, boxes: readonly string[], value: RatingValue) {
  const selectedIndex = 5 - value;
  for (let index = 0; index < boxes.length; index += 1) {
    setChecked(form, boxes[index], index === selectedIndex);
  }
}

function programAndYearText(identity: StudentIdentity, department: string): string {
  const departmentLabel = department.trim();
  if (!departmentLabel) {
    return identity.programYear;
  }
  return `${identity.programYear} (${departmentLabel})`;
}

export async function fillEvaluationPdf(
  draft: EvaluationDraft,
  identity: StudentIdentity,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await templateBytesPromise);
  const form = pdf.getForm();

  setText(form, TEXT_FIELDS.name, identity.fullName);
  setText(
    form,
    TEXT_FIELDS.programAndYear,
    programAndYearText(identity, draft.department),
  );
  setText(
    form,
    TEXT_FIELDS.organization,
    organizationDisplayName(identity.organizationName),
  );
  setText(form, TEXT_FIELDS.studentNumber, identity.studentId);

  setChecked(form, PARTICIPATED_YES, draft.participated === "yes");
  setChecked(form, PARTICIPATED_NO, draft.participated === "no");

  if (draft.participated === "yes") {
    setText(form, TEXT_FIELDS.recentActivity, draft.recentActivity);
    setText(form, TEXT_FIELDS.dateParticipated, draft.dateParticipated);
    setChecked(
      form,
      DISCOVERY_CHECKBOXES.classmateSchoolmate,
      draft.discoverySources.classmateSchoolmate,
    );
    setChecked(form, DISCOVERY_CHECKBOXES.faculty, draft.discoverySources.faculty);
    setChecked(form, DISCOVERY_CHECKBOXES.others, draft.discoverySources.others);
    setChecked(
      form,
      DISCOVERY_CHECKBOXES.onlineMitWebsite,
      draft.discoverySources.onlineMitWebsite,
    );
    setChecked(
      form,
      DISCOVERY_CHECKBOXES.referenceMaterialsPromotion,
      draft.discoverySources.referenceMaterialsPromotion,
    );
    if (draft.discoverySources.others) {
      setText(form, TEXT_FIELDS.othersSpecify, draft.othersSpecify);
    }

    for (const [criterionId, boxes] of Object.entries(RATING_CHECKBOX_ROWS) as [
      CriterionId,
      readonly [string, string, string, string, string],
    ][]) {
      const rating = draft.ratings[criterionId];
      if (rating) {
        checkRating(form, boxes, rating);
      }
    }
  }

  setText(form, TEXT_FIELDS.comments, draft.comments);

  try {
    form.flatten();
  } catch {
    form.updateFieldAppearances();
  }

  return pdf.save();
}
