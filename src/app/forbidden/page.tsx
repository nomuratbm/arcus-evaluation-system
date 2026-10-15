import Link from "next/link";

export default function ForbiddenPage() {
  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
    <h1 className="text-2xl font-semibold text-stone-950">Officer access required</h1>
    <p className="mt-3 text-stone-600">Your account cannot access this page. You can still complete evaluations for events you attended.</p>
    <Link href="/" className="mt-6 inline-block text-primary underline underline-offset-4">Go to your events</Link>
  </main>;
}
