import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <article className="space-y-8">
      <Skeleton className="h-8 w-40" />
      <header className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </header>
      <Skeleton className="h-px w-full" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </article>
  );
}
