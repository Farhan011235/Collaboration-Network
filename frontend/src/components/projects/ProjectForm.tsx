"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage, getFieldErrors } from "@/lib/axios";
import * as projectService from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FieldError } from "@/components/ui/field-error";
import { SkillPicker } from "@/components/projects/SkillPicker";
import type { CollaborationType, Project, ProjectFormValues } from "@/types";

const emptyForm: ProjectFormValues = {
  title: "",
  description: "",
  objectives: "",
  expectedOutcomes: "",
  researchDomain: "",
  collaborationType: "REMOTE",
  durationMonths: null,
  teamSizeLimit: null,
  skills: [],
};

function toFormValues(project: Project): ProjectFormValues {
  return {
    title: project.title,
    description: project.description,
    objectives: project.objectives ?? "",
    expectedOutcomes: project.expectedOutcomes ?? "",
    researchDomain: project.researchDomain,
    collaborationType: project.collaborationType,
    durationMonths: project.durationMonths ?? null,
    teamSizeLimit: project.teamSizeLimit ?? null,
    skills: project.skillRequirements.map((r) => ({
      skillId: r.skillId,
      importanceLevel: r.importanceLevel,
    })),
  };
}

export function ProjectForm({ existing }: { existing?: Project }) {
  const router = useRouter();
  const isEdit = !!existing;

  const [form, setForm] = useState<ProjectFormValues>(
    existing ? toFormValues(existing) : emptyForm
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProjectFormValues>(key: K, val: ProjectFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 5) next.title = "Give the project a clear title";
    if (form.description.trim().length < 30)
      next.description = "Describe the project in at least 30 characters";
    if (form.researchDomain.trim().length < 2)
      next.researchDomain = "Enter the research domain";
    if (form.durationMonths != null && (form.durationMonths < 1 || form.durationMonths > 120))
      next.durationMonths = "Enter a duration between 1 and 120 months";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const saved = isEdit
        ? await projectService.updateProject(existing!.projectId, form)
        : await projectService.createProject(form);

      toast.success(isEdit ? "Changes saved" : "Draft saved");
      router.push(`/projects/${saved.projectId}`);
      router.refresh();
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Project title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Bengali speech recognition for low-resource dialects"
            error={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What is the problem, and what will the team actually build or study?"
            error={!!errors.description}
          />
          <FieldError message={errors.description} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objectives">
            Objectives <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="objectives"
            rows={3}
            value={form.objectives}
            onChange={(e) => set("objectives", e.target.value)}
            placeholder="List what the project aims to achieve."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedOutcomes">
            Expected outcomes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="expectedOutcomes"
            rows={3}
            value={form.expectedOutcomes}
            onChange={(e) => set("expectedOutcomes", e.target.value)}
            placeholder="A paper, a dataset, a working prototype?"
          />
        </div>
      </section>

      <section className="space-y-5 border-t border-border pt-8">
        <h2 className="font-display text-lg font-medium">Scope</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="researchDomain">Research domain</Label>
            <Input
              id="researchDomain"
              value={form.researchDomain}
              onChange={(e) => set("researchDomain", e.target.value)}
              placeholder="Natural Language Processing"
              error={!!errors.researchDomain}
            />
            <FieldError message={errors.researchDomain} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collaborationType">Collaboration type</Label>
            <Select
              id="collaborationType"
              value={form.collaborationType}
              onChange={(e) => set("collaborationType", e.target.value as CollaborationType)}
            >
              <option value="REMOTE">Remote</option>
              <option value="ONSITE">On campus</option>
              <option value="HYBRID">Hybrid</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationMonths">
              Expected duration <span className="text-muted-foreground">(months)</span>
            </Label>
            <Input
              id="durationMonths"
              type="number"
              min={1}
              max={120}
              value={form.durationMonths ?? ""}
              onChange={(e) =>
                set("durationMonths", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="6"
              error={!!errors.durationMonths}
            />
            <FieldError message={errors.durationMonths} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamSizeLimit">
              Team size limit <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="teamSizeLimit"
              type="number"
              min={1}
              max={50}
              value={form.teamSizeLimit ?? ""}
              onChange={(e) =>
                set("teamSizeLimit", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="4"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <div>
          <h2 className="font-display text-lg font-medium">Required skills</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mark how important each one is to the work.
          </p>
        </div>
        <SkillPicker value={form.skills} onChange={(skills) => set("skills", skills)} />
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-8">
        <Button type="submit" loading={saving}>
          {isEdit ? "Save changes" : "Save draft"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        {!isEdit && (
          <p className="w-full text-xs text-muted-foreground">
            Saved as a draft first. You can publish it once you are happy with it.
          </p>
        )}
      </div>
    </form>
  );
}
