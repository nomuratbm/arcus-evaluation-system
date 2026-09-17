"use client";

import { DISCOVERY_SOURCES } from "@/lib/evaluation/criteria";
import { useEvaluationStore } from "@/store/useEvaluationStore";

type DiscoverySectionProps = {
  errors: Partial<Record<"discoverySources" | "othersSpecify", string>>;
};

export function DiscoverySection({ errors }: DiscoverySectionProps) {
  const discoverySources = useEvaluationStore(
    (state) => state.draft.discoverySources,
  );
  const othersSpecify = useEvaluationStore((state) => state.draft.othersSpecify);
  const toggleDiscoverySource = useEvaluationStore(
    (state) => state.toggleDiscoverySource,
  );
  const setOthersSpecify = useEvaluationStore(
    (state) => state.setOthersSpecify,
  );

  return (
    <section className="flex flex-col gap-3">
      <fieldset>
        <legend className="text-sm font-medium text-stone-800">
          How did you find out about the activity?
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {DISCOVERY_SOURCES.map((source) => (
            <label
              key={source.id}
              className="inline-flex cursor-pointer items-start gap-2 text-sm text-stone-800"
            >
              <input
                type="checkbox"
                checked={discoverySources[source.id]}
                onChange={() => toggleDiscoverySource(source.id)}
                className="mt-0.5 size-4 accent-sky-800"
              />
              <span>{source.label}</span>
            </label>
          ))}
        </div>
        {errors.discoverySources ? (
          <p className="mt-2 text-xs text-red-700">{errors.discoverySources}</p>
        ) : null}
      </fieldset>

      {discoverySources.others ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="eval-others-specify"
            className="text-sm font-medium text-stone-800"
          >
            Others (please specify)
          </label>
          <input
            id="eval-others-specify"
            type="text"
            value={othersSpecify}
            onChange={(event) => setOthersSpecify(event.target.value)}
            aria-invalid={errors.othersSpecify ? true : undefined}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-sky-700 focus:ring-2 focus:ring-sky-700/20"
          />
          {errors.othersSpecify ? (
            <p className="text-xs text-red-700">{errors.othersSpecify}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
