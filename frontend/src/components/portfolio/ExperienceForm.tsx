"use client";

import { useState } from "react";
import { getFieldErrors } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import type { ExperienceEntry, ExperienceFormValues } from "@/types";

const yearOrNull = (v: string) => (v.trim() ? Number(v) : null);

export function ExperienceForm({
  existing,
  onSubmit,
  onCancel,
}: {
  existing?: ExperienceEntry;
  onSubmit: (values: ExperienceFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    role: existing?.role ?? "",
    organization: existing?.organization ?? "",
    description: existing?.description ?? "",
    startYear: existing?.startYear ? String(existing.startYear) : "",
    endYear: existing?.endYear ? String(existing.endYear) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.title.trim().length < 3) next.title = "Enter the project title";
    const s = yearOrNull(form.startYear);
    const en = yearOrNull(form.endYear);
    if (s && en && en < s) next.endYear = "End year cannot be before start year";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        role: form.role.trim() || undefined,
        organization: form.organization.trim() || undefined,
        description: form.description.trim() || undefined,
        startYear: s,
        endYear: en,
      });
    } catch (error) {
      setErrors(getFieldErrors(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-md border border-border bg-background p-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="expTitle">Project title</Label>
        <Input
          id="expTitle"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Bangla OCR Pipeline"
          error={!!errors.title}
        />
        <FieldError message={errors.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">
            Your role <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="Research Assistant"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org">
            Organization <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="org"
            value={form.organization}
            onChange={(e) =>
              setForm((f) => ({ ...f, organization: e.target.value }))
            }
            placeholder="BRAC University"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expStart">Start year</Label>
          <Input
            id="expStart"
            type="number"
            value={form.startYear}
            onChange={(e) =>
              setForm((f) => ({ ...f, startYear: e.target.value }))
            }
            placeholder="2019"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expEnd">End year</Label>
          <Input
            id="expEnd"
            type="number"
            value={form.endYear}
            onChange={(e) => setForm((f) => ({ ...f, endYear: e.target.value }))}
            placeholder="2021"
            error={!!errors.endYear}
          />
          <FieldError message={errors.endYear} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expDesc">
          What you did <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="expDesc"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Built an OCR pipeline for printed Bangla documents."
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving}>
          {existing ? "Save changes" : "Add experience"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
