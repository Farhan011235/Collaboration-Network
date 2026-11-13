"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage, getFieldErrors } from "@/lib/axios";
import * as meetingService from "@/services/meeting.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { Modal } from "@/components/workspace/Modal";
import type { Meeting, MeetingFormValues } from "@/types";

// datetime-local <-> ISO helpers. The input works in the user's local time;
// we store/send UTC ISO strings.
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};
const toISO = (local: string) => (local ? new Date(local).toISOString() : "");

export function MeetingForm({
  projectId,
  existing,
  onClose,
  onSaved,
}: {
  projectId: number;
  existing?: Meeting;
  onClose: () => void;
  onSaved: (meeting: Meeting, isNew: boolean) => void;
}) {
  const isEdit = !!existing;

  const [form, setForm] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    location: existing?.location ?? "",
    meetingLink: existing?.meetingLink ?? "",
    startTime: toLocalInput(existing?.startTime),
    endTime: toLocalInput(existing?.endTime),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (form.title.trim().length < 3) next.title = "Give the meeting a title";
    if (!form.startTime) next.startTime = "Pick a start time";
    if (!form.endTime) next.endTime = "Pick an end time";
    if (
      form.startTime &&
      form.endTime &&
      new Date(form.endTime) <= new Date(form.startTime)
    ) {
      next.endTime = "End time must be after the start time";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      const payload: MeetingFormValues = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        meetingLink: form.meetingLink.trim() || undefined,
        startTime: toISO(form.startTime),
        endTime: toISO(form.endTime),
      };
      const meeting = isEdit
        ? await meetingService.updateMeeting(existing!.meetingId, payload)
        : await meetingService.createMeeting(projectId, payload);
      toast.success(isEdit ? "Meeting updated" : "Meeting scheduled");
      onSaved(meeting, !isEdit);
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit meeting" : "Schedule a meeting"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="mtitle">Title</Label>
          <Input
            id="mtitle"
            value={form.title}
            onChange={(e) => {
              setForm((f) => ({ ...f, title: e.target.value }));
              setErrors((x) => ({ ...x, title: "" }));
            }}
            placeholder="Weekly research sync"
            error={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mstart">Starts</Label>
            <Input
              id="mstart"
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => {
                setForm((f) => ({ ...f, startTime: e.target.value }));
                setErrors((x) => ({ ...x, startTime: "" }));
              }}
              error={!!errors.startTime}
            />
            <FieldError message={errors.startTime} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mend">Ends</Label>
            <Input
              id="mend"
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => {
                setForm((f) => ({ ...f, endTime: e.target.value }));
                setErrors((x) => ({ ...x, endTime: "" }));
              }}
              error={!!errors.endTime}
            />
            <FieldError message={errors.endTime} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mloc">
            Location <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="mloc"
            value={form.location}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
            placeholder="Lab 3B, or 'Online'"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mlink">
            Meeting link <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="mlink"
            value={form.meetingLink}
            onChange={(e) => {
              setForm((f) => ({ ...f, meetingLink: e.target.value }));
              setErrors((x) => ({ ...x, meetingLink: "" }));
            }}
            placeholder="https://meet.google.com/…"
            error={!!errors.meetingLink}
          />
          <FieldError message={errors.meetingLink} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mdesc">
            Agenda <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="mdesc"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="What will the team cover?"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Schedule meeting"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
