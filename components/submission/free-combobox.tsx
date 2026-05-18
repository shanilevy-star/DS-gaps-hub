"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Combobox that allows picking from a known list OR typing a brand-new value.
// Submitting an unknown value is allowed and surfaced visually so the DS team
// can review new component names that didn't exist in the seed list.

export function FreeCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  id,
  ariaLabel,
  ariaInvalid,
}: {
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<string>;
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  id?: string;
  ariaLabel?: string;
  ariaInvalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const exactMatch = options.find(
    (o) => o.toLowerCase() === trimmed.toLowerCase(),
  );
  const showCustomOption = trimmed.length > 0 && !exactMatch;
  const isKnown =
    value === "" || options.some((o) => o.toLowerCase() === value.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid || undefined}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <span className="truncate">{value || placeholder}</span>
            {value && !isKnown ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">
                new
              </span>
            ) : null}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter>
          <CommandInput
            placeholder={searchPlaceholder ?? "Search or type new..."}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {trimmed.length > 0
                ? "No matches. Use the option below to add it."
                : (emptyLabel ?? "No options")}
            </CommandEmpty>
            <CommandGroup heading="Existing">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value.toLowerCase() === option.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
            {showCustomOption ? (
              <CommandGroup heading="Add new">
                <CommandItem
                  value={`__custom__${trimmed}`}
                  onSelect={() => {
                    onChange(trimmed);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  Use &quot;{trimmed}&quot; as a new entry
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
