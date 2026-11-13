"use client";

import { useState } from "react";
import { getFieldErrors } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import type { PublicationEntry, PublicationFormValues } from "@/types";

export function PublicationForm({
  existing,
  onSubmit,
  onCancel,
}: {
  existing?: PublicationEntry;
  onSubmit: (values: PublicationFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    authors: existing?.authors ?? "",
    venue: existing?.venue ?? "",
    doi: existing?.doi ?? "",
    year: existing?.year ? String(existing.year) : "",
    citationCount: existing ? String(existing.citationCount) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 3) {
      setErrors({ title: "Enter the publication title" });
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        authors: form.authors.trim() || undefined,
        venue: form.venue.trim() || undefined,
        doi: form.doi.trim() || undefined,
        year: form.year.trim() ? Number(form.year) : null,
        citationCount: form.citationCount.trim()
          ? Number(form.citationCount)
          : undefined,
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
        <Label htmlFor="pubTitle">Title</Label>
        <Input
          id="pubTitle"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="A Survey of Bengali NLP Resources"
          error={!!errors.title}
        />
        <FieldError message={errors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="authors">
          Authors <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="authors"
          value={form.authors}
          onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))}
          placeholder="A. Rahman, B. Karim"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venue">
            Venue <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="venue"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            placeholder="Journal of Language Resources"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doi">
            DOI <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="doi"
            value={form.doi}
            onChange={(e) => setForm((f) => ({ ...f, doi: e.target.value }))}
            placeholder="10.1234/example.2024"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pubYear">Year</Label>
          <Input
            id="pubYear"
            type="number"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            placeholder="2024"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cites">Citations</Label>
          <Input
            id="cites"
            type="number"
            value={form.citationCount}
            onChange={(e) =>
              setForm((f) => ({ ...f, citationCount: e.target.value }))
            }
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving}>
          {existing ? "Save changes" : "Add publication"}
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
