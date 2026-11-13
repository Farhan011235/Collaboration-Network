"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared shell for each portfolio section: title, description, optional
// "Add" button, and the section body.
export function PortfolioSection({
  title,
  description,
  onAdd,
  addLabel,
  adding,
  children,
}: {
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  adding?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {onAdd && !adding && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {addLabel ?? "Add"}
          </Button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
