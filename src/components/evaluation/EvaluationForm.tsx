"use client";

import { useState, useSyncExternalStore, useTransition, type FormEvent } from "react";

import { CommentsSection } from "@/components/evaluation/CommentsSection";
import { DiscoverySection } from "@/components/evaluation/DiscoverySection";
import { IdentitySection } from "@/components/evaluation/IdentitySection";
import { ParticipationSection } from "@/components/evaluation/ParticipationSection";
import { RatingsSection } from "@/components/evaluation/RatingsSection";
import { EVALUATION_CRITERIA } from "@/lib/evaluation/criteria";
import {
  countAnsweredRatings,
  validateEvaluationDraft,
  type ValidationResult,
} from "@/lib/evaluation/validate";
import { useEvaluationStore } from "@/store/useEvaluationStore";

function useHasHydrated() {
  return useSyncExternalStore(
    (onStoreChange) =>
      useEvaluationStore.persist.onFinishHydration(onStoreChange),
    () => useEvaluationStore.persist.hasHydrated(),
    () => false,
  );
}

export function EvaluationForm() {
  const hasHydrated = useHasHydrated();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const draft = useEvaluationStore((state) => state.draft);
  const identity = useEvaluationStore((state) => state.identity);
  const reset = useEvaluationStore((state) => state.reset);

  const participatedYes = draft.participated === "yes";
  const answeredRatings = countAnsweredRatings(draft);
  const totalRatings = EVALUATION_CRITERIA.length;
  const progressLabel = participatedYes
    ? `${answeredRatings} of ${totalRatings} ratings`
    : "Participation";

  if (!hasHydrated) {
    return (
      <div
        className="rounded-lg border border-stone-200 bg-white p-8 text-sm text-stone-500"
        aria-busy="true"
      >
        Loading saved draft…
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);

    startTransition(async () => {
      const result = validateEvaluationDraft(draft, identity);
      setValidation(result);

      if (!result.ok || !identity) {
        setSubmitMessage("Please fix the highlighted fields before submitting.");
        return;
      }

      try {
        const response = await fetch("/api/evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft, identity }),
        });
        const data: unknown = await response.json().catch(() => null);
        const errorMessage =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to store the evaluation PDF";

        if (!response.ok) {
          if (
            typeof data === "object" &&
            data !== null &&
            "errors" in data &&
            data.errors &&
            typeof data.errors === "object"
          ) {
            setValidation({
              ok: false,
              errors: data.errors as ValidationResult["errors"],
              missingRatingCount: result.missingRatingCount,
            });
          }
          setSubmitMessage(errorMessage);
          return;
        }

        const key =
          typeof data === "object" &&
          data !== null &&
          "key" in data &&
          typeof data.key === "string"
            ? data.key
            : null;
        setSubmitMessage(
          key
            ? `Submitted. PDF stored as ${key}.`
            : "Submitted. PDF stored in S3.",
        );
      } catch {
        setSubmitMessage("Could not reach the server. Try again.");
      }
    });
  }

  function handleReset() {
    reset();
    setValidation(null);
    setSubmitMessage(null);
  }

  const errors = validation?.errors ?? {};

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <p className="text-xs tracking-wide text-stone-500 uppercase">
            FM-SA-05-01
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
            Student Activity Evaluation Form
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Office of Student Affairs — evaluate a program or activity you
            participated in.
          </p>
        </div>
        <p className="text-sm text-stone-500">{progressLabel}</p>
      </div>

      <IdentitySection
        errors={{
          studentId: errors.studentId,
          department: errors.department,
        }}
      />

      <ParticipationSection
        errors={{
          participated: errors.participated,
          recentActivity: errors.recentActivity,
        }}
      />

      {participatedYes ? (
        <>
          <DiscoverySection
            errors={{
              discoverySources: errors.discoverySources,
              othersSpecify: errors.othersSpecify,
            }}
          />
          <RatingsSection error={errors.ratings} />
          <CommentsSection />
        </>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {submitMessage ? (
            <p
              className={
                validation?.ok ? "text-emerald-800" : "text-red-700"
              }
              role="status"
            >
              {submitMessage}
            </p>
          ) : (
            <p className="text-stone-500">
              Your answers are saved locally in this browser until reset.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-md bg-sky-900 px-5 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
}
