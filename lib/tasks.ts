import type { AiPriority } from "@/lib/constants/priority";
import type { Database } from "@/lib/supabase/database.types";

export const TASK_STATUS_VALUES = [
  "open",
  "planned",
  "in_review",
  "done",
  "dismissed",
] as const;

export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];
export type DesignTask = Database["public"]["Tables"]["tasks"]["Row"];

export const TASK_PRIORITY_RANK: Record<AiPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function taskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "planned":
      return "Planned";
    case "in_review":
      return "In review";
    case "done":
      return "Done";
    case "dismissed":
      return "Dismissed";
  }
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUS_VALUES as readonly string[]).includes(value)
  );
}

export function isAiPriority(value: unknown): value is AiPriority {
  return (
    value === "critical" ||
    value === "high" ||
    value === "medium" ||
    value === "low"
  );
}

export function compareTasksByPriority(a: DesignTask, b: DesignTask): number {
  const priorityDelta = TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority];
  if (priorityDelta !== 0) return priorityDelta;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function toActionableTaskTitle(title: string, rationale: string): string {
  const trimmedTitle = normalizeWhitespace(title);
  const fallback = normalizeWhitespace(rationale).slice(0, 96);
  const source = trimmedTitle || fallback || "Review design system recommendation";

  if (startsWithActionVerb(source)) {
    return source;
  }

  return `Review ${lowercaseFirst(source)}`;
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function startsWithActionVerb(value: string): boolean {
  return /^(add|audit|create|document|fix|improve|review|update|validate)\b/i.test(
    value,
  );
}

function lowercaseFirst(value: string): string {
  if (!value) return value;
  return `${value[0].toLowerCase()}${value.slice(1)}`;
}
