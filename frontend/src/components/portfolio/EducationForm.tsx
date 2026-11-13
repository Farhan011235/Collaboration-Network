"use client";

import { useState } from "react";
import { getFieldErrors } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import type { EducationEntry, EducationFormValues } from "@/types";

const yearOrNull = (v: string) => (v.trim() ? Number(v) : null);

export function EducationForm({
  existing,
  onSubmit,
  onCancel,
}: {
  existing?: EducationEntry;
  onSubmit: (values: EducationFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    degree: existing?.degree ?? "",
    fieldOfStudy: existing?.fieldOfStudy ?? "",
    institution: existing?.institution ?? "",
    startYear: existing?.startYear ? String(existing.startYear) : "",
    endYear: existing?.endYear ? String(existing.endYear) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.degree.trim().length < 2) next.degree = "Enter the degree";
    if (form.fieldOfStudy.trim().length < 2)
      next.fieldOfStudy = "Enter the field of study";
    if (form.institution.trim().length < 2)
      next.institution = "Enter the institution";
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
        degree: form.degree.trim(),
        fieldOfStudy: form.fieldOfStudy.trim(),
        institution: form.institution.trim(),
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="degree">Degree</Label>
          <Input
            id="degree"
            value={form.degree}
            onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))}
            placeholder="MSc"
            error={!!errors.degree}
          />
          <FieldError message={errors.degree} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="field">Field of study</Label>
          <Input
            id="field"
            value={form.fieldOfStudy}
            onChange={(e) =>
              setForm((f) => ({ ...f, fieldOfStudy: e.target.value }))
            }
            placeholder="Computer Science"
            error={!!errors.fieldOfStudy}
          />
          <FieldError message={errors.fieldOfStudy} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="institution">Institution</Label>
        <Input
          id="institution"
          value={form.institution}
          onChange={(e) =>
            setForm((f) => ({ ...f, institution: e.target.value }))
          }
          placeholder="BRAC University"
          error={!!errors.institution}
        />
        <FieldError message={errors.institution} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startYear">Start year</Label>
          <Input
            id="startYear"
            type="number"
            value={form.startYear}
            onChange={(e) =>
              setForm((f) => ({ ...f, startYear: e.target.value }))
            }
            placeholder="2020"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endYear">End year</Label>
          <Input
            id="endYear"
            type="number"
            value={form.endYear}
            onChange={(e) => setForm((f) => ({ ...f, endYear: e.target.value }))}
            placeholder="2022"
            error={!!errors.endYear}
          />
          <FieldError message={errors.endYear} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving}>
          {existing ? "Save changes" : "Add education"}
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
