"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GAP_TYPES } from "@/lib/constants/gap-types";
import { TEAMS } from "@/lib/constants/teams";

const ALL = "__all__";
const MINE = "mine";
const filterSelectContentProps = {
  position: "popper" as const,
  side: "bottom" as const,
  align: "start" as const,
  sideOffset: 4,
  avoidCollisions: true,
};

export type FilterOptions = {
  teams: string[];
  components: string[];
};

export function SubmissionsFilters({
  options,
  initial,
  signedInUserId,
}: {
  options: FilterOptions;
  initial: {
    q: string;
    team: string;
    component: string;
    gapType: string;
    scope: "all" | "mine";
  };
  signedInUserId: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initial.q);

  // Debounced search-text URL update.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(params?.toString() ?? "");
      if (query.trim()) {
        next.set("q", query.trim());
      } else {
        next.delete("q");
      }
      startTransition(() => {
        router.replace(`?${next.toString()}`);
      });
    }, 250);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (!value || value === ALL) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    startTransition(() => {
      router.replace(`?${next.toString()}`);
    });
  }

  function clearAll() {
    setQuery("");
    startTransition(() => {
      router.replace("?");
    });
  }

  const hasAnyFilter =
    Boolean(query) ||
    initial.team ||
    initial.component ||
    initial.gapType ||
    initial.scope === "mine";

  return (
    <div className="space-y-3" aria-busy={pending}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, problem, or use case..."
          aria-label="Search submissions"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={initial.team || ALL}
          onValueChange={(value) => updateParam("team", value)}
        >
          <SelectTrigger
            className="w-[220px]"
            aria-label="Filter by team / product area"
          >
            <SelectValue placeholder="All teams / products" />
          </SelectTrigger>
          <SelectContent {...filterSelectContentProps}>
            <SelectItem value={ALL}>All teams / products</SelectItem>
            {TEAMS.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={initial.component || ALL}
          onValueChange={(value) => updateParam("component", value)}
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by component">
            <SelectValue placeholder="All components" />
          </SelectTrigger>
          <SelectContent {...filterSelectContentProps}>
            <SelectItem value={ALL}>All components</SelectItem>
            {options.components.map((component) => (
              <SelectItem key={component} value={component}>
                {component}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={initial.gapType || ALL}
          onValueChange={(value) => updateParam("gap_type", value)}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by gap type">
            <SelectValue placeholder="All gap types" />
          </SelectTrigger>
          <SelectContent {...filterSelectContentProps}>
            <SelectItem value={ALL}>All gap types</SelectItem>
            {GAP_TYPES.map((gap) => (
              <SelectItem key={gap.value} value={gap.value}>
                {gap.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {signedInUserId ? (
          <Select
            value={initial.scope}
            onValueChange={(value) => updateParam("scope", value)}
          >
            <SelectTrigger className="w-[150px]" aria-label="Scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent {...filterSelectContentProps}>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value={MINE}>Just mine</SelectItem>
            </SelectContent>
          </Select>
        ) : null}

        {hasAnyFilter ? (
          <Button size="sm" variant="ghost" onClick={clearAll}>
            <X className="mr-1 size-3.5" aria-hidden />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
