import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 pb-28">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-7 w-40" />
        <Skeleton className="mx-auto h-4 w-80 max-w-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
