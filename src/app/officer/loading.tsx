import { Skeleton } from "@/components/ui/skeleton";

export default function OfficerLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
    >
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="mt-2 h-4 w-48" />
      <Skeleton className="mt-8 h-10 w-full max-w-xl" />
      <div
        aria-label="Loading event post-evaluation"
        className="mt-8 space-y-3"
        role="status"
      >
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </main>
  );
}
