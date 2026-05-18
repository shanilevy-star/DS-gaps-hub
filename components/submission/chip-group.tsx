"use client";

import { cn } from "@/lib/utils";

type ChipOption = {
  value: string;
  label: string;
  description?: string;
};

export function ChipGroup({
  name,
  options,
  value,
  onChange,
  ariaLabel,
}: {
  name: string;
  options: ReadonlyArray<ChipOption>;
  value: string | null | undefined;
  onChange: (next: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "group flex max-w-full flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:border-foreground/40",
            )}
          >
            <span className="text-sm font-medium leading-none">
              {option.label}
            </span>
            {option.description ? (
              <span
                className={cn(
                  "text-xs leading-snug",
                  isActive
                    ? "text-background/80"
                    : "text-muted-foreground",
                )}
              >
                {option.description}
              </span>
            ) : null}
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isActive}
              readOnly
              tabIndex={-1}
              className="sr-only"
            />
          </button>
        );
      })}
    </div>
  );
}
