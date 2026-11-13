"use client";

import { Calendar, Pencil, Trash2, Flag, Milestone as MilestoneIcon } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { Task, TaskPriority, TaskStatus } from "@/types";

const priorityVariant: Record<
  TaskPriority,
  "default" | "secondary" | "muted"
> = {
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "muted",
};

const priorityLabel: Record<TaskPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onMove,
  busy,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, status: TaskStatus) => void;
  busy?: boolean;
}) {
  const overdue =
    task.dueDate &&
    task.status !== "DONE" &&
    new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug">{task.title}</h4>
        <Badge variant={priorityVariant[task.priority]} className="shrink-0 gap-1">
          <Flag className="h-3 w-3" />
          {priorityLabel[task.priority]}
        </Badge>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {task.milestone && (
          <span className="inline-flex items-center gap-1">
            <MilestoneIcon className="h-3 w-3" />
            {task.milestone.title}
          </span>
        )}
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1 ${
              overdue ? "font-medium text-destructive" : ""
            }`}
          >
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {task.assignee ? (
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
              {getInitials(task.assignee.fullName)}
            </span>
            <span className="text-muted-foreground">
              {task.assignee.fullName.split(" ")[0]}
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label="Delete task"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Select
        value={task.status}
        disabled={busy}
        onChange={(e) => onMove(task, e.target.value as TaskStatus)}
        className="mt-2 h-8 text-xs"
      >
        <option value="TODO">To do</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="DONE">Done</option>
      </Select>
    </div>
  );
}
