"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage, getFieldErrors } from "@/lib/axios";
import * as workspaceService from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FieldError } from "@/components/ui/field-error";
import { Modal } from "@/components/workspace/Modal";
import type {
  Milestone,
  ProjectMemberEntry,
  Task,
  TaskFormValues,
} from "@/types";

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

export function TaskForm({
  projectId,
  members,
  milestones,
  existing,
  onClose,
  onSaved,
}: {
  projectId: number;
  members: ProjectMemberEntry[];
  milestones: Milestone[];
  existing?: Task;
  onClose: () => void;
  onSaved: (task: Task, isNew: boolean) => void;
}) {
  const isEdit = !!existing;

  const [form, setForm] = useState<TaskFormValues>({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    status: existing?.status ?? "TODO",
    priority: existing?.priority ?? "MEDIUM",
    dueDate: existing ? toDateInput(existing.dueDate) : "",
    assigneeId: existing?.assigneeId ?? null,
    milestoneId: existing?.milestoneId ?? null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof TaskFormValues>(
    key: K,
    val: TaskFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 3) {
      setErrors({ title: "Give the task a clear title" });
      return;
    }

    setSaving(true);
    try {
      const payload: TaskFormValues = {
        ...form,
        dueDate: form.dueDate || null,
      };
      const task = isEdit
        ? await workspaceService.updateTask(existing!.taskId, payload)
        : await workspaceService.createTask(projectId, payload);
      toast.success(isEdit ? "Task updated" : "Task created");
      onSaved(task, !isEdit);
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Collect the training dataset"
            error={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What exactly needs doing?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as TaskFormValues["status"])}
            >
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              value={form.priority}
              onChange={(e) =>
                set("priority", e.target.value as TaskFormValues["priority"])
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assign to</Label>
            <Select
              id="assignee"
              value={form.assigneeId ?? ""}
              onChange={(e) =>
                set("assigneeId", e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.fullName}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="milestone">Milestone</Label>
          <Select
            id="milestone"
            value={form.milestoneId ?? ""}
            onChange={(e) =>
              set("milestoneId", e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">None</option>
            {milestones.map((m) => (
              <option key={m.milestoneId} value={m.milestoneId}>
                {m.title}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
