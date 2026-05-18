import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CountEntry } from "@/lib/analytics";

export function CountBars({
  title,
  entries,
  emptyLabel,
  linkBuilder,
  className,
}: {
  title: string;
  entries: CountEntry[];
  emptyLabel?: string;
  linkBuilder?: (entry: CountEntry) => string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <h3 className="text-sm font-medium">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {emptyLabel ?? "Not enough data yet."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {entries.map((entry) => {
            const sharePct = Math.max(1, Math.round(entry.share * 100));
            const label = (
              <>
                <span className="truncate">{entry.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {entry.count}
                </span>
              </>
            );
            return (
              <li key={entry.name} className="space-y-1">
                {linkBuilder ? (
                  <Link
                    href={linkBuilder(entry)}
                    className="flex items-center justify-between gap-3 text-sm hover:underline"
                  >
                    {label}
                  </Link>
                ) : (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    {label}
                  </div>
                )}
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/80"
                    style={{ width: `${sharePct}%` }}
                    aria-hidden
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
