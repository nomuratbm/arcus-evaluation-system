"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CriterionId, DiscoverySourceId, RatingValue } from "@/lib/evaluation/criteria";
import {
  createEmptyDraft,
  type EvaluationDraft,
  type YesNo,
} from "@/lib/evaluation/schema";
import type { StudentIdentity } from "@/lib/student-identity";

type EvaluationStore = {
  draft: EvaluationDraft;
  identity: StudentIdentity | null;
  setStudentId: (value: string) => void;
  setDepartment: (value: string) => void;
  setIdentity: (identity: StudentIdentity | null) => void;
  setParticipated: (value: YesNo) => void;
  setRecentActivity: (value: string) => void;
  setDateParticipated: (value: string) => void;
  toggleDiscoverySource: (source: DiscoverySourceId) => void;
  setOthersSpecify: (value: string) => void;
  setRating: (criterionId: CriterionId, value: RatingValue) => void;
  setComments: (value: string) => void;
  reset: () => void;
};

/** Bumped when student identity lookup was added to the draft. */
export const EVALUATION_DRAFT_STORAGE_KEY = "evaluationDraft:v3";

export const useEvaluationStore = create<EvaluationStore>()(
  persist(
    (set) => ({
      draft: createEmptyDraft(),
      identity: null,

      setStudentId: (value) =>
        set((state) => {
          const trimmed = value.trim();
          const identityMatches =
            state.identity !== null && state.identity.studentId === trimmed;
          return {
            draft: { ...state.draft, studentId: value },
            identity: identityMatches ? state.identity : null,
          };
        }),

      setDepartment: (value) =>
        set((state) => ({
          draft: { ...state.draft, department: value },
        })),

      setIdentity: (identity) => set({ identity }),

      setParticipated: (value) =>
        set((state) => {
          if (value === "no") {
            return {
              draft: {
                ...state.draft,
                participated: value,
                recentActivity: "",
                dateParticipated: "",
                discoverySources: createEmptyDraft().discoverySources,
                othersSpecify: "",
                ratings: {},
              },
            };
          }
          return {
            draft: { ...state.draft, participated: value },
          };
        }),

      setRecentActivity: (value) =>
        set((state) => ({
          draft: { ...state.draft, recentActivity: value },
        })),

      setDateParticipated: (value) =>
        set((state) => ({
          draft: { ...state.draft, dateParticipated: value },
        })),

      toggleDiscoverySource: (source) =>
        set((state) => {
          const nextChecked = !state.draft.discoverySources[source];
          return {
            draft: {
              ...state.draft,
              discoverySources: {
                ...state.draft.discoverySources,
                [source]: nextChecked,
              },
              othersSpecify:
                source === "others" && !nextChecked
                  ? ""
                  : state.draft.othersSpecify,
            },
          };
        }),

      setOthersSpecify: (value) =>
        set((state) => ({
          draft: { ...state.draft, othersSpecify: value },
        })),

      setRating: (criterionId, value) =>
        set((state) => ({
          draft: {
            ...state.draft,
            ratings: { ...state.draft.ratings, [criterionId]: value },
          },
        })),

      setComments: (value) =>
        set((state) => ({
          draft: { ...state.draft, comments: value },
        })),

      reset: () => set({ draft: createEmptyDraft(), identity: null }),
    }),
    {
      name: EVALUATION_DRAFT_STORAGE_KEY,
      partialize: (state) => ({
        draft: state.draft,
        identity: state.identity,
      }),
    },
  ),
);
