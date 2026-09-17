"use client";

import { RatingRow } from "@/components/evaluation/RatingRow";
import {
  CRITERION_GROUP_LABELS,
  EVALUATION_CRITERIA,
  RATING_SCALE,
  type CriterionGroup,
  type EvaluationCriterion,
} from "@/lib/evaluation/criteria";

type RatingsSectionProps = {
  error?: string;
};

type CriteriaChunk = {
  group: CriterionGroup;
  items: EvaluationCriterion[];
};

function groupCriteria(): CriteriaChunk[] {
  const chunks: CriteriaChunk[] = [];

  for (const criterion of EVALUATION_CRITERIA) {
    const last = chunks[chunks.length - 1];
    if (last && last.group === criterion.group) {
      last.items.push(criterion);
      continue;
    }
    chunks.push({ group: criterion.group, items: [criterion] });
  }

  return chunks;
}

const CRITERIA_CHUNKS = groupCriteria();

export function RatingsSection({ error }: RatingsSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">
          Program / activity evaluation
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Indicate your level of satisfaction for the program or activity you
          participated in recently. Select one rating per item.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
          {RATING_SCALE.map((option) => (
            <span key={option.value}>
              <span className="font-semibold text-stone-700">{option.value}</span>{" "}
              {option.label}
            </span>
          ))}
        </div>
        {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50/60 px-3 sm:px-4">
        {CRITERIA_CHUNKS.map((chunk) => {
          const groupLabel = CRITERION_GROUP_LABELS[chunk.group];
          return (
            <div key={chunk.group} className="py-1">
              {groupLabel ? (
                <h3 className="pt-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                  {groupLabel}
                </h3>
              ) : null}
              {chunk.items.map((criterion) => (
                <RatingRow key={criterion.id} criterion={criterion} />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
