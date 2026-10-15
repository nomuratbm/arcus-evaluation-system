import { Skeleton } from "@/components/ui/skeleton";

export default function FormsLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12"
    >
      <Skeleton className="mb-5 h-4 w-28" />
      <div
        aria-label="Loading evaluation form"
        className="space-y-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"
        role="status"
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </main>
  );
}
