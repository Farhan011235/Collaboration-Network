"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Option {
  id: number;
  name: string;
}

// A small typeahead for adding one skill/interest at a time from the shared
// taxonomy. Already-added ids are filtered out.
export function TaxonomyAdder({
  placeholder,
  options,
  excludeIds,
  onAdd,
  busy,
}: {
  placeholder: string;
  options: Option[];
  excludeIds: number[];
  onAdd: (id: number) => void;
  busy?: boolean;
}) {
  const [query, setQuery] = useState("");
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  useEffect(() => {
    if (busy) setQuery("");
  }, [busy]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter((o) => !excluded.has(o.id) && o.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, options, excluded]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        disabled={busy}
      />
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {results.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => {
                  onAdd(o.id);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                {o.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
