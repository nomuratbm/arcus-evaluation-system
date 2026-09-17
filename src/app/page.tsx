import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="text-xs tracking-wide text-stone-500 uppercase">
        Arcus Evaluation System
      </p>
      <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
        Student activity evaluations
      </h1>
      <p className="mt-3 max-w-lg text-base leading-relaxed text-stone-600">
        Capture feedback on Office of Student Affairs programs and activities
        using the FM-SA-05-01 evaluation form.
      </p>
      <div className="mt-8">
        <Link
          href="/forms"
          className="inline-flex h-11 items-center justify-center rounded-md bg-sky-900 px-5 text-sm font-medium text-white transition hover:bg-sky-800"
        >
          Open evaluation form
        </Link>
      </div>
    </main>
  );
}
