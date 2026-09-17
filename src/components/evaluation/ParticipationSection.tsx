"use client";

import { TextField } from "@/components/evaluation/TextField";
import { useEvaluationStore } from "@/store/useEvaluationStore";

type ParticipationSectionProps = {
  errors: Partial<Record<"participated" | "recentActivity", string>>;
};

export function ParticipationSection({ errors }: ParticipationSectionProps) {
  const participated = useEvaluationStore((state) => state.draft.participated);
  const recentActivity = useEvaluationStore(
    (state) => state.draft.recentActivity,
  );
  const dateParticipated = useEvaluationStore(
    (state) => state.draft.dateParticipated,
  );
  const setParticipated = useEvaluationStore((state) => state.setParticipated);
  const setRecentActivity = useEvaluationStore(
    (state) => state.setRecentActivity,
  );
  const setDateParticipated = useEvaluationStore(
    (state) => state.setDateParticipated,
  );

  const showActivityFields = participated === "yes";

  return (
    <section className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-sm font-medium text-stone-800">
          Have you participated in any of the programs or activities provided by
          the Office of Student Affairs in the past?
        </legend>
        <div
          role="radiogroup"
          aria-required="true"
          aria-invalid={errors.participated ? true : undefined}
          className="mt-3 flex flex-wrap gap-4"
        >
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-800">
            <input
              type="radio"
              name="participated"
              value="yes"
              checked={participated === "yes"}
              onChange={() => setParticipated("yes")}
              className="size-4 accent-sky-800"
            />
            Yes
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-800">
            <input
              type="radio"
              name="participated"
              value="no"
              checked={participated === "no"}
              onChange={() => setParticipated("no")}
              className="size-4 accent-sky-800"
            />
            No
          </label>
        </div>
        {errors.participated ? (
          <p className="mt-2 text-xs text-red-700">{errors.participated}</p>
        ) : null}
      </fieldset>

      {showActivityFields ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="eval-recent-activity"
            label="What activity or program did you participate in recently?"
            value={recentActivity}
            error={errors.recentActivity}
            onChange={setRecentActivity}
          />
          <TextField
            id="eval-date-participated"
            label="Date participated (if applicable)"
            value={dateParticipated}
            placeholder="e.g. 2026-03-15"
            onChange={setDateParticipated}
          />
        </div>
      ) : null}
    </section>
  );
}
