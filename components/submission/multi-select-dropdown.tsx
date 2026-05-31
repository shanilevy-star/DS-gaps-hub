"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

type MultiSelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export function MultiSelectDropdown<TValue extends string>({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search options...",
  searchable = true,
  ariaLabel,
  ariaInvalid,
}: {
  value: TValue[];
  onChange: (next: TValue[]) => void;
  options: ReadonlyArray<MultiSelectOption<TValue>>;
  placeholder: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  ariaLabel?: string;
  ariaInvalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );

  function toggle(nextValue: TValue) {
    if (value.includes(nextValue)) {
      onChange(value.filter((current) => current !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid || undefined}
          className={cn(
            "min-h-10 w-full justify-between px-3 py-2 font-normal",
            selectedOptions.length === 0 && "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-left">
            {selectedOptions.length > 0
              ? selectedOptions.map((option) => (
                  <Badge key={option.value} variant="secondary">
                    {option.label}
                  </Badge>
                ))
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          {searchable ? <CommandInput placeholder={searchPlaceholder} /> : null}
          <CommandList>
            <CommandEmpty>No gap types found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                    className={cn(
                      "gap-2.5 px-2.5 py-2",
                      isSelected && "bg-muted text-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors",
                        isSelected &&
                          "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {isSelected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
