import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6"
    >
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <div
        aria-label="Loading events"
        className="mt-8 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white"
        role="status"
      >
        {[0, 1, 2].map((row) => (
          <div key={row} className="space-y-2 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
