import Link from "next/link";

export const metadata = {
  title: "Evaluation submitted",
  description: "Your student activity evaluation has been filed.",
};

export default function EvaluationSubmittedPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-xs tracking-wide text-emerald-800 uppercase">
          Evaluation filed
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
          Submitted, Your evaluation has been filed. Thank you!
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          The Office of Student Affairs has received your response.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-sky-900 px-5 text-sm font-medium text-white transition hover:bg-sky-800"
          >
            Back to home
          </Link>
          <Link
            href="/forms"
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            Submit another
          </Link>
        </div>
      </div>
    </main>
  );
}
