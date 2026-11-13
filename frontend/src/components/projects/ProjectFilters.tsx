"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { getSkills, getResearchDomains } from "@/services/taxonomy.service";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type {
  CollaborationType,
  ProjectSearchFilters,
  Skill,
} from "@/types";

// The filter sidebar for the discovery page. It owns the reference data
// (domains + skills) and reports changes up through onChange.
export function ProjectFilters({
  value,
  onChange,
  onClear,
}: {
  value: ProjectSearchFilters;
  onChange: (patch: Partial<ProjectSearchFilters>) => void;
  onClear: () => void;
}) {
  const [domains, setDomains] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillQuery, setSkillQuery] = useState("");

  useEffect(() => {
    getResearchDomains()
      .then(setDomains)
      .catch(() => setDomains([]));
    getSkills()
      .then(setSkills)
      .catch(() => setSkills([]));
  }, []);

  const skillById = useMemo(
    () => new Map(skills.map((s) => [s.skillId, s])),
    [skills]
  );

  const selectedSkillIds = value.skillIds ?? [];

  const skillResults = useMemo(() => {
    if (!skillQuery.trim()) return [];
    const q = skillQuery.toLowerCase();
    return skills
      .filter(
        (s) =>
          !selectedSkillIds.includes(s.skillId) &&
          s.name.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [skillQuery, skills, selectedSkillIds]);

  const addSkill = (skillId: number) => {
    onChange({ skillIds: [...selectedSkillIds, skillId] });
    setSkillQuery("");
  };

  const removeSkill = (skillId: number) => {
    onChange({ skillIds: selectedSkillIds.filter((id) => id !== skillId) });
  };

  const hasActiveFilters =
    !!value.researchDomain ||
    !!value.collaborationType ||
    selectedSkillIds.length > 0 ||
    !!value.minDuration ||
    !!value.maxDuration;

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-medium">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Research domain */}
      <div className="space-y-1.5">
        <Label>Research domain</Label>
        <Select
          value={value.researchDomain ?? ""}
          onChange={(e) =>
            onChange({ researchDomain: e.target.value || undefined })
          }
        >
          <option value="">Any domain</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </div>

      {/* Collaboration type */}
      <div className="space-y-1.5">
        <Label>Collaboration</Label>
        <Select
          value={value.collaborationType ?? ""}
          onChange={(e) =>
            onChange({
              collaborationType:
                (e.target.value as CollaborationType) || undefined,
            })
          }
        >
          <option value="">Any type</option>
          <option value="REMOTE">Remote</option>
          <option value="ONSITE">On campus</option>
          <option value="HYBRID">Hybrid</option>
        </Select>
      </div>

      {/* Required skills */}
      <div className="space-y-1.5">
        <Label>Skills</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={skillQuery}
            onChange={(e) => setSkillQuery(e.target.value)}
            placeholder="Search skills"
            className="pl-9"
          />
          {skillResults.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-md">
              {skillResults.map((skill) => (
                <li key={skill.skillId}>
                  <button
                    type="button"
                    onClick={() => addSkill(skill.skillId)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span>{skill.name}</span>
                    {skill.category && (
                      <span className="text-xs text-muted-foreground">
                        {skill.category}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedSkillIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedSkillIds.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1">
                {skillById.get(id)?.name ?? `Skill ${id}`}
                <button
                  type="button"
                  onClick={() => removeSkill(id)}
                  aria-label="Remove skill"
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Matches projects needing any selected skill.
        </p>
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <Label>Duration (months)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={120}
            placeholder="Min"
            value={value.minDuration ?? ""}
            onChange={(e) =>
              onChange({
                minDuration: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={1}
            max={120}
            placeholder="Max"
            value={value.maxDuration ?? ""}
            onChange={(e) =>
              onChange({
                maxDuration: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
