"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage, getFieldErrors } from "@/lib/axios";
import * as documentService from "@/services/document.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import type { ProjectDocument } from "@/types";

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.png,.jpg,.jpeg,.zip";

export function DocumentForm({
  projectId,
  existing,
  onSaved,
  onCancel,
}: {
  projectId: number;
  existing?: ProjectDocument;
  onSaved: (doc: ProjectDocument, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setErrors({ title: "Give the document a title" });
      return;
    }
    if (!isEdit && !file) {
      setErrors({ file: "Choose a file to upload" });
      return;
    }

    setSaving(true);
    try {
      const payload = { title, category, description, file };
      const doc = isEdit
        ? await documentService.updateDocument(existing!.documentId, payload)
        : await documentService.uploadDocument(projectId, payload);
      toast.success(isEdit ? "Document updated" : "Document uploaded");
      onSaved(doc, !isEdit);
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Literature review draft"
            error={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="category"
            list="doc-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Paper, Dataset, Notes…"
          />
          <datalist id="doc-categories">
            <option value="Paper" />
            <option value="Dataset" />
            <option value="Notes" />
            <option value="Report" />
            <option value="Reference" />
            <option value="Presentation" />
          </datalist>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this document?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">
          {isEdit ? "Replace file (optional)" : "File"}
        </Label>
        <input
          id="file"
          type="file"
          accept={ACCEPT}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
        />
        <FieldError message={errors.file} />
        {isEdit && (
          <p className="text-xs text-muted-foreground">
            Leave empty to keep the current file. Uploading a new one bumps the
            version.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" loading={saving}>
          {isEdit ? "Save changes" : "Upload"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
