"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage, getFieldErrors } from "@/lib/axios";
import * as workspaceService from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { Modal } from "@/components/workspace/Modal";
import type { Milestone, MilestoneFormValues } from "@/types";

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

export function MilestoneForm({
  projectId,
  existing,
  onClose,
  onSaved,
}: {
  projectId: number;
  existing?: Milestone;
  onClose: () => void;
  onSaved: (milestone: Milestone, isNew: boolean) => void;
}) {
  const isEdit = !!existing;

  const [form, setForm] = useState<MilestoneFormValues>({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    dueDate: existing ? toDateInput(existing.dueDate) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 3) {
      setErrors({ title: "Give the milestone a clear title" });
      return;
    }

    setSaving(true);
    try {
      const payload: MilestoneFormValues = {
        ...form,
        dueDate: form.dueDate || null,
      };
      const milestone = isEdit
        ? await workspaceService.updateMilestone(existing!.milestoneId, payload)
        : await workspaceService.createMilestone(projectId, payload);
      toast.success(isEdit ? "Milestone updated" : "Milestone added");
      onSaved(milestone, !isEdit);
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit milestone" : "New milestone"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="mtitle">Title</Label>
          <Input
            id="mtitle"
            value={form.title}
            onChange={(e) => {
              setForm((f) => ({ ...f, title: e.target.value }));
              setErrors({});
            }}
            placeholder="Phase 1: Data collection"
            error={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mdesc">
            Description <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="mdesc"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="What does reaching this milestone mean?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mdue">Target date</Label>
          <Input
            id="mdue"
            type="date"
            value={form.dueDate ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, dueDate: e.target.value }))
            }
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Add milestone"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
