import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataSufficiency } from "@/lib/ai/types";

const STYLES: Record<DataSufficiency, { tone: string; icon: React.ReactNode }> =
  {
    low: {
      tone: "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
      icon: <AlertTriangle className="size-4" aria-hidden />,
    },
    medium: {
      tone: "border-border bg-card text-foreground",
      icon: <Info className="size-4" aria-hidden />,
    },
    high: {
      tone: "border-emerald-300/60 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/5 dark:text-emerald-200",
      icon: <CheckCircle2 className="size-4" aria-hidden />,
    },
  };

export function SufficiencyCallout({
  sufficiency,
  note,
}: {
  sufficiency: DataSufficiency;
  note: string;
}) {
  const style = STYLES[sufficiency];
  const labels: Record<DataSufficiency, string> = {
    low: "Low confidence",
    medium: "Some confidence",
    high: "Reasonable confidence",
  };
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        style.tone,
      )}
      role="note"
    >
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div>
        <p className="font-medium">{labels[sufficiency]}</p>
        <p className="mt-0.5 leading-relaxed opacity-90">{note}</p>
      </div>
    </div>
  );
}
