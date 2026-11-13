"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSkills } from "@/services/taxonomy.service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { ImportanceLevel, Skill } from "@/types";

interface Selected {
  skillId: number;
  importanceLevel: ImportanceLevel;
}

export function SkillPicker({
  value,
  onChange,
}: {
  value: Selected[];
  onChange: (next: Selected[]) => void;
}) {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSkills()
      .then(setAllSkills)
      .catch(() => setAllSkills([]))
      .finally(() => setLoading(false));
  }, []);

  const skillById = useMemo(
    () => new Map(allSkills.map((s) => [s.skillId, s])),
    [allSkills]
  );

  const selectedIds = new Set(value.map((v) => v.skillId));

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allSkills
      .filter((s) => !selectedIds.has(s.skillId) && s.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, allSkills, value]);

  const add = (skillId: number) => {
    onChange([...value, { skillId, importanceLevel: "REQUIRED" }]);
    setQuery("");
  };

  const remove = (skillId: number) => {
    onChange(value.filter((v) => v.skillId !== skillId));
  };

  const setImportance = (skillId: number, importanceLevel: ImportanceLevel) => {
    onChange(value.map((v) => (v.skillId === skillId ? { ...v, importanceLevel } : v)));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? "Loading skills..." : "Search skills to add"}
          disabled={loading}
          className="pl-9"
        />

        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-md">
            {results.map((skill) => (
              <li key={skill.skillId}>
                <button
                  type="button"
                  onClick={() => add(skill.skillId)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span>{skill.name}</span>
                  {skill.category && (
                    <span className="text-xs text-muted-foreground">{skill.category}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No skills added yet. Applicants use these to judge whether they are a fit.
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((item) => (
            <li
              key={item.skillId}
              className={cn(
                "flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
              )}
            >
              <Badge variant="secondary" className="shrink-0">
                {skillById.get(item.skillId)?.name ?? `Skill ${item.skillId}`}
              </Badge>

              <Select
                value={item.importanceLevel}
                onChange={(e) =>
                  setImportance(item.skillId, e.target.value as ImportanceLevel)
                }
                className="ml-auto h-8 w-36 text-xs"
              >
                <option value="REQUIRED">Required</option>
                <option value="PREFERRED">Preferred</option>
                <option value="OPTIONAL">Nice to have</option>
              </Select>

              <button
                type="button"
                onClick={() => remove(item.skillId)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${skillById.get(item.skillId)?.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
