"use client";

import { useState } from "react";
import {
  ListChecks,
  CheckCircle2,
  MessageSquare,
  FileText,
  CalendarDays,
  Star,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage, getFieldErrors } from "@/lib/axios";
import { getInitials } from "@/lib/utils";
import * as teamService from "@/services/team.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import type { AssignableRole, TeamMember } from "@/types";

const ASSIGNABLE: { value: AssignableRole; label: string }[] = [
  { value: "RESEARCH_LEAD", label: "Research Lead" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "DATA_ANALYST", label: "Data Analyst" },
  { value: "WRITER", label: "Writer" },
  { value: "MEMBER", label: "Member" },
];

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ListChecks;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export function TeamMemberCard({
  member,
  projectId,
  isOwner,
  isSelf,
  onChanged,
}: {
  member: TeamMember;
  projectId: number;
  isOwner: boolean;
  isSelf: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const isProjectOwnerRow = member.role === "OWNER";
  // The owner assigns responsibilities to everyone except themself.
  const canManage = isOwner && !isProjectOwnerRow;

  const [editingRole, setEditingRole] = useState(false);
  const [editingEval, setEditingEval] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [roleForm, setRoleForm] = useState({
    role: (member.role === "OWNER" ? "MEMBER" : member.role) as AssignableRole,
    responsibilities: member.responsibilities ?? "",
  });
  const [evalForm, setEvalForm] = useState({
    contributionScore:
      member.evaluation?.contributionScore != null
        ? String(member.evaluation.contributionScore)
        : "",
    contributionNotes: member.evaluation?.contributionNotes ?? "",
  });

  const a = member.activity;

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teamService.updateMemberRole(projectId, member.userId, {
        role: roleForm.role,
        responsibilities: roleForm.responsibilities,
      });
      setEditingRole(false);
      await onChanged();
      toast.success("Responsibility updated");
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveEval = async (e: React.FormEvent) => {
    e.preventDefault();
    const score = evalForm.contributionScore.trim();
    if (score && (Number(score) < 0 || Number(score) > 100)) {
      setErrors({ contributionScore: "Score must be between 0 and 100" });
      return;
    }
    setSaving(true);
    try {
      await teamService.updateMemberEvaluation(projectId, member.userId, {
        contributionScore: score ? Number(score) : null,
        contributionNotes: evalForm.contributionNotes,
      });
      setEditingEval(false);
      await onChanged();
      toast.success("Evaluation saved");
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-lg border border-border bg-card p-5">
      {/* identity + role */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {getInitials(member.user.fullName)}
          </span>
          <div className="min-w-0">
            <p className="font-medium">
              {member.user.fullName}
              {isSelf && (
                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {member.user.designation || "Researcher"}
              {member.user.institution ? ` · ${member.user.institution}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isProjectOwnerRow ? "default" : "secondary"}>
            {member.roleLabel}
          </Badge>
          {canManage && !editingRole && (
            <button
              type="button"
              onClick={() => setEditingRole(true)}
              aria-label="Assign responsibility"
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* responsibilities */}
      {editingRole ? (
        <form onSubmit={saveRole} className="mt-4 space-y-3" noValidate>
          <div className="space-y-2">
            <Label htmlFor={`role-${member.userId}`}>Project role</Label>
            <Select
              id={`role-${member.userId}`}
              value={roleForm.role}
              onChange={(e) =>
                setRoleForm((f) => ({
                  ...f,
                  role: e.target.value as AssignableRole,
                }))
              }
              className="h-9"
            >
              {ASSIGNABLE.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.role} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`resp-${member.userId}`}>Responsibilities</Label>
            <Textarea
              id={`resp-${member.userId}`}
              rows={2}
              value={roleForm.responsibilities}
              onChange={(e) =>
                setRoleForm((f) => ({ ...f, responsibilities: e.target.value }))
              }
              placeholder="What is this person accountable for?"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingRole(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        member.responsibilities && (
          <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">
            {member.responsibilities}
          </p>
        )
      )}

      {/* activity - objective, derived from what they actually did */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs">
        <Stat icon={ListChecks} label="assigned" value={a.tasksAssigned} />
        <Stat icon={CheckCircle2} label="done" value={a.tasksCompleted} />
        <Stat icon={MessageSquare} label="posts" value={a.threads + a.comments} />
        <Stat icon={FileText} label="docs" value={a.documents} />
        <Stat icon={CalendarDays} label="meetings" value={a.meetings} />
        <span className="ml-auto text-muted-foreground">
          activity score{" "}
          <span className="font-semibold text-foreground">
            {a.activityScore}
          </span>{" "}
          ({a.sharePercent}%)
        </span>
      </div>

      {/* owner's evaluation */}
      {member.evaluation && !isProjectOwnerRow && (
        <div className="mt-3 rounded-md border border-border bg-background p-3">
          {editingEval ? (
            <form onSubmit={saveEval} className="space-y-3" noValidate>
              <div className="space-y-2">
                <Label htmlFor={`score-${member.userId}`}>
                  Contribution score (0–100)
                </Label>
                <Input
                  id={`score-${member.userId}`}
                  type="number"
                  value={evalForm.contributionScore}
                  onChange={(e) =>
                    setEvalForm((f) => ({
                      ...f,
                      contributionScore: e.target.value,
                    }))
                  }
                  placeholder="82"
                  error={!!errors.contributionScore}
                />
                <FieldError message={errors.contributionScore} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`notes-${member.userId}`}>Notes</Label>
                <Textarea
                  id={`notes-${member.userId}`}
                  rows={2}
                  value={evalForm.contributionNotes}
                  onChange={(e) =>
                    setEvalForm((f) => ({
                      ...f,
                      contributionNotes: e.target.value,
                    }))
                  }
                  placeholder="How have they contributed?"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={saving}>
                  Save evaluation
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingEval(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  {member.evaluation.contributionScore != null
                    ? `Owner's rating: ${member.evaluation.contributionScore}/100`
                    : "Not evaluated yet"}
                </p>
                {member.evaluation.contributionNotes && (
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {member.evaluation.contributionNotes}
                  </p>
                )}
                {member.evaluation.evaluatedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reviewed{" "}
                    {new Date(member.evaluation.evaluatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingEval(true)}
                >
                  {member.evaluation.contributionScore != null
                    ? "Update"
                    : "Evaluate"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
