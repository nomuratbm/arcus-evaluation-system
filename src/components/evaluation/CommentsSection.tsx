"use client";

import { useEvaluationStore } from "@/store/useEvaluationStore";

export function CommentsSection() {
  const comments = useEvaluationStore((state) => state.draft.comments);
  const setComments = useEvaluationStore((state) => state.setComments);

  return (
    <section className="flex flex-col gap-1.5">
      <label
        htmlFor="eval-comments"
        className="text-sm font-medium text-stone-800"
      >
        Comments and suggestions
      </label>
      <textarea
        id="eval-comments"
        value={comments}
        rows={5}
        onChange={(event) => setComments(event.target.value)}
        placeholder="Optional feedback for the Office of Student Affairs"
        className="resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-sky-700 focus:ring-2 focus:ring-sky-700/20"
      />
    </section>
  );
}
