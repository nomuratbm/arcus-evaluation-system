"use client";

import { FIELD_LIMITS } from "@/lib/evaluation/validate";
import { useEvaluationStore } from "@/store/useEvaluationStore";

type CommentsSectionProps = {
  error?: string;
};

export function CommentsSection({ error }: CommentsSectionProps) {
  const comments = useEvaluationStore((state) => state.draft.comments);
  const setComments = useEvaluationStore((state) => state.setComments);

  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor="eval-comments"
          className="text-sm font-medium text-stone-800"
        >
          Comments and suggestions
        </label>
        <span className="text-xs text-stone-500">
          {comments.length}/{FIELD_LIMITS.comments.max}
        </span>
      </div>
      <textarea
        id="eval-comments"
        value={comments}
        rows={5}
        maxLength={FIELD_LIMITS.comments.max}
        onChange={(event) => setComments(event.target.value)}
        placeholder="Optional feedback for the Office of Student Affairs"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "eval-comments-error" : undefined}
        className="resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-sky-700 focus:ring-2 focus:ring-sky-700/20"
      />
      {error ? (
        <p id="eval-comments-error" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}