"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { aiPriorityLabel, type AiPriority } from "@/lib/constants/priority";
import { formatRelativeShort } from "@/lib/format";
import {
  TASK_STATUS_VALUES,
  taskStatusLabel,
  type DesignTask,
  type TaskStatus,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

const PRIORITY_BADGE_CLASS: Record<AiPriority, string> = {
  critical:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  high:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  medium:
    "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
  low: "border-border bg-muted text-muted-foreground",
};

export function TasksTable({ tasks }: { tasks: DesignTask[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(tasks);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  function startTitleEdit(task: DesignTask) {
    setEditingTaskId(task.id);
    setDraftTitle(task.title);
    setTitleError(null);
  }

  function cancelTitleEdit() {
    setEditingTaskId(null);
    setDraftTitle("");
    setTitleError(null);
  }

  async function saveTitle(task: DesignTask) {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setTitleError("Task title cannot be empty.");
      return;
    }
    if (nextTitle === task.title) {
      cancelTitleEdit();
      return;
    }

    setSavingTaskId(task.id);
    try {
      const updated = await updateTask(task.id, { title: nextTitle });
      setRows((current) =>
        current.map((row) => (row.id === task.id ? updated : row)),
      );
      cancelTitleEdit();
      toast.success("Task title updated.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update task title.",
      );
    } finally {
      setSavingTaskId(null);
    }
  }

  async function updateStatus(task: DesignTask, status: TaskStatus) {
    if (status === task.status) return;

    setSavingTaskId(task.id);
    try {
      const updated = await updateTask(task.id, { status });
      setRows((current) =>
        current.map((row) => (row.id === task.id ? updated : row)),
      );
      toast.success("Task status updated.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update task status.",
      );
    } finally {
      setSavingTaskId(null);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-right text-[11px] text-muted-foreground/70">
        Scroll to view more
      </p>
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        <Table className="min-w-[980px] border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[42%]">Task title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Jira</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="align-top">
                  {editingTaskId === task.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={draftTitle}
                          onChange={(event) => {
                            setDraftTitle(event.target.value);
                            setTitleError(null);
                          }}
                          aria-invalid={Boolean(titleError)}
                          disabled={savingTaskId === task.id}
                        />
                        <Button
                          type="button"
                          size="icon-sm"
                          aria-label="Save task title"
                          disabled={savingTaskId === task.id}
                          onClick={() => saveTitle(task)}
                        >
                          <Check className="size-4" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          aria-label="Cancel task title edit"
                          disabled={savingTaskId === task.id}
                          onClick={cancelTitleEdit}
                        >
                          <X className="size-4" aria-hidden />
                        </Button>
                      </div>
                      {titleError ? (
                        <p className="text-xs text-destructive">{titleError}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium leading-snug">{task.title}</p>
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {task.rationale}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Edit task title for ${task.title}`}
                        onClick={() => startTitleEdit(task)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] uppercase",
                      PRIORITY_BADGE_CLASS[task.priority],
                    )}
                  >
                    {aiPriorityLabel(task.priority)}
                  </Badge>
                </TableCell>
                <TableCell className="align-top">
                  <Select
                    value={task.status}
                    disabled={savingTaskId === task.id}
                    onValueChange={(value) =>
                      updateStatus(task, value as TaskStatus)
                    }
                  >
                    <SelectTrigger size="sm" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS_VALUES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {taskStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  {task.related_group_ids.length === 0
                    ? "No linked groups"
                    : `${task.related_group_ids.length} related group${
                        task.related_group_ids.length === 1 ? "" : "s"
                      }`}
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  {task.jira_issue_key ? task.jira_issue_key : "Not connected"}
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
                  {formatRelativeShort(task.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

async function updateTask(
  taskId: string,
  body: { title?: string; status?: TaskStatus },
): Promise<DesignTask> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    task?: DesignTask;
    error?: string;
  };

  if (!response.ok || !payload.task) {
    throw new Error(payload.error ?? "Could not update task.");
  }

  return payload.task;
}
