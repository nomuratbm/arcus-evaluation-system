"use client";

import {
  RATING_SCALE,
  type CriterionId,
  type EvaluationCriterion,
  type RatingValue,
} from "@/lib/evaluation/criteria";
import { useEvaluationStore } from "@/store/useEvaluationStore";

type RatingRowProps = {
  criterion: EvaluationCriterion;
};

export function RatingRow({ criterion }: RatingRowProps) {
  const value = useEvaluationStore(
    (state) => state.draft.ratings[criterion.id],
  );
  const setRating = useEvaluationStore((state) => state.setRating);

  return (
    <fieldset className="rating-row border-b border-stone-200 py-4 last:border-b-0">
      <legend className="mb-3 pr-2 text-sm text-stone-800">
        <span className="mr-2 font-semibold text-stone-900">
          {criterion.number}.
        </span>
        {criterion.label}
      </legend>
      <div
        role="radiogroup"
        aria-label={`Satisfaction rating for item ${criterion.number}`}
        className="grid grid-cols-5 gap-2 sm:max-w-xl"
      >
        {RATING_SCALE.map((option) => (
          <RatingOption
            key={option.value}
            criterionId={criterion.id}
            criterionNumber={criterion.number}
            optionValue={option.value}
            optionLabel={option.label}
            checked={value === option.value}
            onSelect={setRating}
          />
        ))}
      </div>
    </fieldset>
  );
}

type RatingOptionProps = {
  criterionId: CriterionId;
  criterionNumber: number;
  optionValue: RatingValue;
  optionLabel: string;
  checked: boolean;
  onSelect: (criterionId: CriterionId, value: RatingValue) => void;
};

function RatingOption({
  criterionId,
  criterionNumber,
  optionValue,
  optionLabel,
  checked,
  onSelect,
}: RatingOptionProps) {
  const inputId = `rating-${criterionId}-${optionValue}`;

  return (
    <label
      htmlFor={inputId}
      className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border px-1 py-2 text-center transition ${
        checked
          ? "border-sky-800 bg-sky-50 text-sky-950"
          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
      }`}
    >
      <input
        id={inputId}
        type="radio"
        name={`rating-${criterionId}`}
        value={optionValue}
        checked={checked}
        onChange={() => onSelect(criterionId, optionValue)}
        className="sr-only"
        aria-label={`${optionLabel} (${optionValue}) for item ${criterionNumber}`}
      />
      <span className="text-base font-semibold tabular-nums">{optionValue}</span>
      <span className="hidden text-[10px] leading-tight sm:block">
        {optionLabel}
      </span>
    </label>
  );
}
