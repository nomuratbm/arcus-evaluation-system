import { Suspense } from "react";

import { EvaluationForm } from "@/components/evaluation/EvaluationForm";

export const metadata = {
  title: "Student Activity Evaluation Form",
  description:
    "Evaluate Office of Student Affairs programs and activities (FM-SA-05-01).",
};

export default function FormsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <Suspense
          fallback={
            <div className="p-8 text-sm text-stone-500">Loading form…</div>
          }
        >
          <EvaluationForm />
        </Suspense>
      </div>
    </main>
  );
}
