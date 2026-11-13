"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  UserCircle,
  Pencil,
  Trash2,
  X,
  GraduationCap,
  BookText,
  Briefcase,
  Link2,
  Quote,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage, getFieldErrors } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import * as portfolioService from "@/services/portfolio.service";
import * as taxonomyService from "@/services/taxonomy.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";
import { TaxonomyAdder } from "@/components/portfolio/TaxonomyAdder";
import { EducationForm } from "@/components/portfolio/EducationForm";
import { PublicationForm } from "@/components/portfolio/PublicationForm";
import { ExperienceForm } from "@/components/portfolio/ExperienceForm";
import type {
  EducationEntry,
  ExperienceEntry,
  Interest,
  Portfolio,
  ProficiencyLevel,
  PublicationEntry,
  Skill,
} from "@/types";

const PROFICIENCIES: ProficiencyLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
];

const years = (a?: number | null, b?: number | null) => {
  if (a && b) return `${a} – ${b}`;
  if (a) return `${a} – present`;
  if (b) return `until ${b}`;
  return "";
};

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [busy, setBusy] = useState(false);

  // one open editor at a time per section
  const [editingProfile, setEditingProfile] = useState(false);
  const [eduForm, setEduForm] = useState<{ open: boolean; editing?: EducationEntry }>({ open: false });
  const [pubForm, setPubForm] = useState<{ open: boolean; editing?: PublicationEntry }>({ open: false });
  const [expForm, setExpForm] = useState<{ open: boolean; editing?: ExperienceEntry }>({ open: false });

  const load = useCallback(async () => {
    setPortfolio(await portfolioService.getMyPortfolio());
  }, []);

  useEffect(() => {
    Promise.all([
      portfolioService.getMyPortfolio(),
      taxonomyService.getSkills(),
      taxonomyService.getInterests(),
    ])
      .then(([p, s, i]) => {
        setPortfolio(p);
        setSkills(s);
        setInterests(i);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  // Proficiency changes happen constantly while filling in a portfolio, so
  // they update the UI immediately and save in the background. A failure puts
  // the old value back.
  const setProficiency = async (
    skillId: number,
    proficiencyLevel: ProficiencyLevel
  ) => {
    const previous = portfolio;
    setPortfolio((p) =>
      p
        ? {
            ...p,
            skills: p.skills.map((s) =>
              s.skillId === skillId ? { ...s, proficiencyLevel } : s
            ),
          }
        : p
    );
    try {
      await portfolioService.addSkill(skillId, proficiencyLevel);
    } catch (error) {
      setPortfolio(previous);
      toast.error(getErrorMessage(error));
    }
  };

  // Wraps a mutation: run it, refresh the portfolio, surface errors.
  const run = async (fn: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
      if (success) toast.success(success);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-3xl flex-1 py-10">
          {loading || !portfolio ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <h1 className="inline-flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
                  <UserCircle className="h-6 w-6 text-primary" />
                  Research portfolio
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your interests, skills, academic background, publications and
                  past project experience. Project owners see this when you
                  request to collaborate, and it sharpens your recommendations.
                </p>
              </div>

              <div className="mt-8 space-y-5">
                {/* ---------- profile ---------- */}
                <PortfolioSection
                  title="About you"
                  onAdd={editingProfile ? undefined : () => setEditingProfile(true)}
                  addLabel="Edit"
                >
                  {editingProfile ? (
                    <ProfileEditor
                      portfolio={portfolio}
                      onCancel={() => setEditingProfile(false)}
                      onSaved={async () => {
                        setEditingProfile(false);
                        // Refresh the portfolio AND the auth user, so the
                        // navbar and dashboard update without a reload.
                        await Promise.all([load(), refreshUser()]);
                        toast.success("Profile updated");
                      }}
                    />
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p className="text-base font-medium">{portfolio.fullName}</p>
                      <p className="text-muted-foreground">
                        {portfolio.designation || "No designation"}
                        {portfolio.institution ? ` · ${portfolio.institution}` : ""}
                      </p>
                      {portfolio.bio ? (
                        <p className="whitespace-pre-line text-foreground/90">
                          {portfolio.bio}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">No bio yet.</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
                        {portfolio.orcidId && (
                          <span className="inline-flex items-center gap-1">
                            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                            ORCID {portfolio.orcidId}
                          </span>
                        )}
                        {portfolio.websiteUrl && (
                          <a
                            href={portfolio.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            Website
                          </a>
                        )}
                        <Badge variant={portfolio.openToCollaboration ? "default" : "muted"}>
                          {portfolio.openToCollaboration
                            ? "Open to collaboration"
                            : "Not looking right now"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </PortfolioSection>

                {/* ---------- research interests ---------- */}
                <PortfolioSection
                  title="Research interests"
                  description="Used to match you with relevant projects."
                >
                  <TaxonomyAdder
                    placeholder="Search interests to add…"
                    options={interests.map((i) => ({ id: i.interestId, name: i.name }))}
                    excludeIds={portfolio.interests.map((i) => i.interestId)}
                    busy={busy}
                    onAdd={(id) =>
                      run(() => portfolioService.addInterest(id), "Interest added")
                    }
                  />
                  {portfolio.interests.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No interests yet.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {portfolio.interests.map((i) => (
                        <span
                          key={i.interestId}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm"
                        >
                          {i.interest.name}
                          <button
                            type="button"
                            aria-label={`Remove ${i.interest.name}`}
                            onClick={() =>
                              run(
                                () => portfolioService.removeInterest(i.interestId),
                                "Interest removed"
                              )
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </PortfolioSection>

                {/* ---------- skills ---------- */}
                <PortfolioSection
                  title="Skills"
                  description="Add a skill, then set how strong you are with it."
                >
                  <TaxonomyAdder
                    placeholder="Search skills to add…"
                    options={skills.map((s) => ({ id: s.skillId, name: s.name }))}
                    excludeIds={portfolio.skills.map((s) => s.skillId)}
                    busy={busy}
                    onAdd={(id) =>
                      run(
                        () => portfolioService.addSkill(id, "INTERMEDIATE"),
                        "Skill added"
                      )
                    }
                  />
                  {portfolio.skills.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No skills yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {portfolio.skills.map((s) => (
                        <li
                          key={s.skillId}
                          className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {s.skill.name}
                          </span>
                          <label
                            htmlFor={`prof-${s.skillId}`}
                            className="shrink-0 text-xs text-muted-foreground"
                          >
                            Level
                          </label>
                          <Select
                            id={`prof-${s.skillId}`}
                            value={s.proficiencyLevel}
                            onChange={(e) =>
                              setProficiency(
                                s.skillId,
                                e.target.value as ProficiencyLevel
                              )
                            }
                            className="h-9 w-36 bg-background"
                          >
                            {PROFICIENCIES.map((p) => (
                              <option key={p} value={p}>
                                {p.charAt(0) + p.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </Select>
                          <button
                            type="button"
                            aria-label={`Remove ${s.skill.name}`}
                            onClick={() =>
                              run(
                                () => portfolioService.removeSkill(s.skillId),
                                "Skill removed"
                              )
                            }
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </PortfolioSection>

                {/* ---------- academic background ---------- */}
                <PortfolioSection
                  title="Academic background"
                  onAdd={() => setEduForm({ open: true })}
                  adding={eduForm.open}
                  addLabel="Add education"
                >
                  {eduForm.open && (
                    <div className="mb-4">
                      <EducationForm
                        existing={eduForm.editing}
                        onCancel={() => setEduForm({ open: false })}
                        onSubmit={async (values) => {
                          if (eduForm.editing) {
                            await portfolioService.updateEducation(
                              eduForm.editing.educationId,
                              values
                            );
                          } else {
                            await portfolioService.addEducation(values);
                          }
                          setEduForm({ open: false });
                          await load();
                          toast.success("Education saved");
                        }}
                      />
                    </div>
                  )}
                  {portfolio.educations.length === 0 && !eduForm.open ? (
                    <p className="text-sm text-muted-foreground">
                      No education added yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {portfolio.educations.map((e) => (
                        <li
                          key={e.educationId}
                          className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
                        >
                          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {e.degree} in {e.fieldOfStudy}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {e.institution}
                              {years(e.startYear, e.endYear)
                                ? ` · ${years(e.startYear, e.endYear)}`
                                : ""}
                            </p>
                          </div>
                          <RowActions
                            onEdit={() => setEduForm({ open: true, editing: e })}
                            onDelete={() =>
                              run(
                                () => portfolioService.deleteEducation(e.educationId),
                                "Education removed"
                              )
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </PortfolioSection>

                {/* ---------- publications ---------- */}
                <PortfolioSection
                  title="Publications"
                  description="Add manually, or import from the Papers search."
                  onAdd={() => setPubForm({ open: true })}
                  adding={pubForm.open}
                  addLabel="Add publication"
                >
                  {pubForm.open && (
                    <div className="mb-4">
                      <PublicationForm
                        existing={pubForm.editing}
                        onCancel={() => setPubForm({ open: false })}
                        onSubmit={async (values) => {
                          if (pubForm.editing) {
                            await portfolioService.updatePublication(
                              pubForm.editing.publicationId,
                              values
                            );
                          } else {
                            await portfolioService.addPublication(values);
                          }
                          setPubForm({ open: false });
                          await load();
                          toast.success("Publication saved");
                        }}
                      />
                    </div>
                  )}
                  {portfolio.publications.length === 0 && !pubForm.open ? (
                    <p className="text-sm text-muted-foreground">
                      No publications yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {portfolio.publications.map((p) => (
                        <li
                          key={p.publicationId}
                          className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
                        >
                          <BookText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{p.title}</p>
                            {p.authors && (
                              <p className="text-xs text-muted-foreground">
                                {p.authors}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {p.year && <span>{p.year}</span>}
                              {p.venue && <span className="truncate">{p.venue}</span>}
                              <span className="inline-flex items-center gap-1">
                                <Quote className="h-3 w-3" />
                                {p.citationCount}
                              </span>
                              {p.doi && <span className="truncate">DOI {p.doi}</span>}
                              {p.sourceApi !== "manual" && (
                                <Badge variant="muted">{p.sourceApi}</Badge>
                              )}
                            </div>
                          </div>
                          <RowActions
                            onEdit={() => setPubForm({ open: true, editing: p })}
                            onDelete={() =>
                              run(
                                () =>
                                  portfolioService.deletePublication(p.publicationId),
                                "Publication removed"
                              )
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </PortfolioSection>

                {/* ---------- previous project experience ---------- */}
                <PortfolioSection
                  title="Previous project experience"
                  description="Research work you did outside this platform."
                  onAdd={() => setExpForm({ open: true })}
                  adding={expForm.open}
                  addLabel="Add experience"
                >
                  {expForm.open && (
                    <div className="mb-4">
                      <ExperienceForm
                        existing={expForm.editing}
                        onCancel={() => setExpForm({ open: false })}
                        onSubmit={async (values) => {
                          if (expForm.editing) {
                            await portfolioService.updateExperience(
                              expForm.editing.experienceId,
                              values
                            );
                          } else {
                            await portfolioService.addExperience(values);
                          }
                          setExpForm({ open: false });
                          await load();
                          toast.success("Experience saved");
                        }}
                      />
                    </div>
                  )}
                  {portfolio.projectExperiences.length === 0 && !expForm.open ? (
                    <p className="text-sm text-muted-foreground">
                      No previous projects added yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {portfolio.projectExperiences.map((x) => (
                        <li
                          key={x.experienceId}
                          className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
                        >
                          <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{x.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {[x.role, x.organization].filter(Boolean).join(" · ")}
                              {years(x.startYear, x.endYear)
                                ? `${x.role || x.organization ? " · " : ""}${years(
                                    x.startYear,
                                    x.endYear
                                  )}`
                                : ""}
                            </p>
                            {x.description && (
                              <p className="mt-1 text-xs text-foreground/80">
                                {x.description}
                              </p>
                            )}
                          </div>
                          <RowActions
                            onEdit={() => setExpForm({ open: true, editing: x })}
                            onDelete={() =>
                              run(
                                () =>
                                  portfolioService.deleteExperience(x.experienceId),
                                "Experience removed"
                              )
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </PortfolioSection>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* ---------- small local pieces ---------- */

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit"
        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete"
        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProfileEditor({
  portfolio,
  onCancel,
  onSaved,
}: {
  portfolio: Portfolio;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    fullName: portfolio.fullName,
    designation: portfolio.designation ?? "",
    institution: portfolio.institution ?? "",
    bio: portfolio.bio ?? "",
    orcidId: portfolio.orcidId ?? "",
    websiteUrl: portfolio.websiteUrl ?? "",
    openToCollaboration: portfolio.openToCollaboration,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) {
      setErrors({ fullName: "Enter your full name" });
      return;
    }
    setSaving(true);
    try {
      await portfolioService.updateProfile({
        fullName: form.fullName.trim(),
        designation: form.designation,
        institution: form.institution,
        bio: form.bio,
        orcidId: form.orcidId,
        websiteUrl: form.websiteUrl,
        openToCollaboration: form.openToCollaboration,
      });
      await onSaved();
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          error={!!errors.fullName}
        />
        <FieldError message={errors.fullName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="designation">Designation</Label>
          <Input
            id="designation"
            value={form.designation}
            onChange={(e) =>
              setForm((f) => ({ ...f, designation: e.target.value }))
            }
            placeholder="Lecturer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inst">Institution</Label>
          <Input
            id="inst"
            value={form.institution}
            onChange={(e) =>
              setForm((f) => ({ ...f, institution: e.target.value }))
            }
            placeholder="BRAC University"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          placeholder="What do you research?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="orcid">ORCID iD</Label>
          <Input
            id="orcid"
            value={form.orcidId}
            onChange={(e) => setForm((f) => ({ ...f, orcidId: e.target.value }))}
            placeholder="0000-0002-1825-0097"
            error={!!errors.orcidId}
          />
          <FieldError message={errors.orcidId} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site">Website</Label>
          <Input
            id="site"
            value={form.websiteUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, websiteUrl: e.target.value }))
            }
            placeholder="https://your-site.org"
            error={!!errors.websiteUrl}
          />
          <FieldError message={errors.websiteUrl} />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.openToCollaboration}
          onChange={(e) =>
            setForm((f) => ({ ...f, openToCollaboration: e.target.checked }))
          }
          className="h-4 w-4 rounded border-border"
        />
        Open to collaboration
      </label>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving}>
          Save profile
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
