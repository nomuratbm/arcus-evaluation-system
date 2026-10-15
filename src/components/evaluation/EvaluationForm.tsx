"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";

import { CommentsSection } from "@/components/evaluation/CommentsSection";
import { DiscoverySection } from "@/components/evaluation/DiscoverySection";
import { EvaluationPdfPreview } from "@/components/evaluation/EvaluationPdfPreview";
import { IdentitySection } from "@/components/evaluation/IdentitySection";
import { ParticipationSection } from "@/components/evaluation/ParticipationSection";
import { RatingsSection } from "@/components/evaluation/RatingsSection";
import { EVALUATION_CRITERIA } from "@/lib/evaluation/criteria";
import {
  countAnsweredRatings,
  validateEvaluationDraft,
  type ValidationResult,
} from "@/lib/evaluation/validate";
import type { StudentIdentity } from "@/lib/student-identity";
import { useEvaluationStore } from "@/store/useEvaluationStore";

function useHasHydrated() {
  return useSyncExternalStore(
    (onStoreChange) =>
      useEvaluationStore.persist.onFinishHydration(onStoreChange),
    () => useEvaluationStore.persist.hasHydrated(),
    () => false,
  );
}

function parseErrorPayload(
  data: unknown,
  fallback: string,
): { message: string; errors?: ValidationResult["errors"] } {
  if (typeof data !== "object" || data === null) {
    return { message: fallback };
  }

  const message =
    "error" in data && typeof data.error === "string" ? data.error : fallback;
  const errors =
    "errors" in data && data.errors && typeof data.errors === "object"
      ? (data.errors as ValidationResult["errors"])
      : undefined;

  return { message, errors };
}

export function EvaluationForm({ userId, eventId, eventTitle, student }: {
  userId: string; eventId: string; eventTitle: string; student: StudentIdentity;
}) {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPending, startPreview] = useTransition();
  const [isFilePending, startFile] = useTransition();

  const draft = useEvaluationStore((state) => state.draft);
  const identity = useEvaluationStore((state) => state.identity);
  const reset = useEvaluationStore((state) => state.reset);
  const initialize = useEvaluationStore((state) => state.initialize);
  const contextKey = useEvaluationStore((state) => state.contextKey);

  const participatedYes = draft.participated === "yes";
  const answeredRatings = countAnsweredRatings(draft);
  const totalRatings = EVALUATION_CRITERIA.length;
  const progressLabel = participatedYes
    ? `${answeredRatings} of ${totalRatings} ratings`
    : "Participation";
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Attribute this filing to the apex event passed in the URL (from the officer
  // dashboard's "Evaluate" link). Applied once, after the persisted draft has
  // hydrated, so the event context is not clobbered by rehydration.
  useEffect(() => {
    if (!hasHydrated) return;
    initialize(userId, eventId, eventTitle, student);
  }, [hasHydrated, userId, eventId, eventTitle, student, initialize]);

  if (!hasHydrated || !identity || contextKey !== JSON.stringify([userId, student.studentId, eventId])) {
    return (
      <div
        className="rounded-lg border border-stone-200 bg-white p-8 text-sm text-stone-500"
        aria-busy="true"
      >
        Loading saved draft…
      </div>
    );
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);

    startPreview(async () => {
      const result = validateEvaluationDraft(draft, identity);
      setValidation(result);

      if (!result.ok || !identity) {
        setSubmitMessage("Please fix the highlighted fields before submitting.");
        return;
      }

      try {
        const { fillEvaluationPdf } = await import("@/lib/evaluation/fill-pdf");
        const pdf = await fillEvaluationPdf(draft, identity);
        const blob = new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
        setPreviewUrl(URL.createObjectURL(blob));
        setPreviewOpen(true);
      } catch {
        setSubmitMessage("Could not reach the server. Try again.");
      }
    });
  }

  function handleFile() {
    setSubmitMessage(null);

    startFile(async () => {
      const result = validateEvaluationDraft(draft, identity);
      setValidation(result);

      if (!result.ok || !identity) {
        setPreviewOpen(false);
        setSubmitMessage("Please fix the highlighted fields before submitting.");
        return;
      }

      try {
        const response = await fetch("/api/evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft }),
        });
        const data: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const payload = parseErrorPayload(
            data,
            "Failed to file the evaluation"
          );
          if (payload.errors) {
            setValidation({
              ok: false,
              errors: payload.errors,
              missingRatingCount: result.missingRatingCount,
            });
          }
          setPreviewOpen(false);
          setSubmitMessage(payload.message);
          return;
        }

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewOpen(false);
        setPreviewUrl(null);
        reset();
        router.push("/forms/submitted");
      } catch {
        setSubmitMessage("Could not reach the server. Try again.");
      }
    });
  }

  function handleReset() {
    reset();
    setValidation(null);
    setSubmitMessage(null);
    setPreviewOpen(false);
    setPreviewUrl(null);
  }

  function handlePreviewOpenChange(open: boolean) {
    setPreviewOpen(open);
    if (!open) {
      setPreviewUrl(null);
    }
  }

  const errors = validation?.errors ?? {};
  const isBusy = isPreviewPending || isFilePending;

  return (
    <>
      <form onSubmit={handlePreview} className="flex flex-col gap-8" noValidate>
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

        {draft.eventId ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <span className="font-medium">Evaluating event:</span>{" "}
            {draft.eventTitle || draft.eventId}
          </div>
        ) : null}

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
            dateParticipated: errors.dateParticipated,
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
            <CommentsSection error={errors.comments} />
          </>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {submitMessage ? (
              <p className="text-red-700" role="status">
                {submitMessage}
              </p>
            ) : (
              <p className="text-stone-500">
                Review the filled form before it is stored.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isBusy}
              className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="h-10 rounded-md bg-sky-900 px-5 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPreviewPending ? "Preparing preview…" : "Review PDF"}
            </button>
          </div>
        </div>
      </form>

      <EvaluationPdfPreview
        open={previewOpen}
        previewUrl={previewUrl}
        isFiling={isFilePending}
        onOpenChange={handlePreviewOpenChange}
        onConfirm={handleFile}
      />
    </>
  );
}
