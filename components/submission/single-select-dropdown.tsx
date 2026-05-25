"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SingleSelectOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
};

export function SingleSelectDropdown<TValue extends string>({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  ariaInvalid,
}: {
  value: TValue | undefined;
  onChange: (next: TValue) => void;
  options: ReadonlyArray<SingleSelectOption<TValue>>;
  placeholder: string;
  ariaLabel?: string;
  ariaInvalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

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
            !selectedOption && "text-muted-foreground",
          )}
        >
          <span className="min-w-0 truncate text-left">
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
      >
        <Command>
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="items-start px-2.5 py-2.5"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 size-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium leading-none">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="text-xs leading-snug text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
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
