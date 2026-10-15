import { Skeleton } from "@/components/ui/skeleton";

export default function SubmittedLoading() {
  return (
    <Skeleton
      aria-label="Loading"
      className="fixed inset-x-0 top-0 z-50 h-1 rounded-none"
      role="status"
    />
  );
}
