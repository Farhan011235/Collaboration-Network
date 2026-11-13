"use client";

import { useState } from "react";
import { Quote, Unlock, ExternalLink, ChevronDown, Copy, Check, BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import * as portfolioService from "@/services/portfolio.service";
import type { Publication } from "@/types";

// Formats the author list, collapsing long ones the way a citation would.
const authorLine = (pub: Publication) => {
  const names = pub.authors.map((a) => a.name);
  if (names.length === 0) return "Unknown authors";
  if (names.length <= 4) return names.join(", ");
  return `${names.slice(0, 4).join(", ")} +${names.length - 4} more`;
};

export function PublicationCard({ publication }: { publication: Publication }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Saves this work to the researcher's portfolio (Module 1 Feature 4).
  const saveToPortfolio = async () => {
    setSaving(true);
    try {
      await portfolioService.importPublication(publication);
      setSaved(true);
      toast.success("Added to your portfolio");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const copyDoi = async () => {
    if (!publication.doi) return;
    try {
      await navigator.clipboard.writeText(publication.doi);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked - nothing to do */
    }
  };

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-base font-medium leading-snug">
          {publication.landingPageUrl ? (
            <a
              href={publication.landingPageUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary hover:underline"
            >
              {publication.title}
            </a>
          ) : (
            publication.title
          )}
        </h3>

        {/* Citation count - the headline metric for a paper. */}
        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
            <Quote className="h-3.5 w-3.5 text-muted-foreground" />
            {publication.citationCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground">citations</div>
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{authorLine(publication)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        {publication.year && (
          <span className="font-medium text-foreground">{publication.year}</span>
        )}
        {publication.venue && <span className="truncate">{publication.venue}</span>}
        {publication.type && (
          <Badge variant="muted">{publication.type.replace(/-/g, " ")}</Badge>
        )}
        {publication.isOpenAccess && (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Unlock className="h-3 w-3" />
            Open access
          </span>
        )}
      </div>

      {/* DOI + links */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {publication.doi ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium text-foreground">DOI</span>
            <a
              href={publication.doiUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {publication.doi}
            </a>
            <button
              type="button"
              onClick={copyDoi}
              aria-label="Copy DOI"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </span>
        ) : (
          <span className="text-muted-foreground">No DOI</span>
        )}

        {publication.isOpenAccess && publication.openAccessUrl && (
          <a
            href={publication.openAccessUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Free full text
          </a>
        )}

        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-7"
          onClick={saveToPortfolio}
          loading={saving}
          disabled={saved}
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              In your portfolio
            </>
          ) : (
            <>
              <BookmarkPlus className="h-3.5 w-3.5" />
              Add to portfolio
            </>
          )}
        </Button>
      </div>

      {publication.abstract && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Hide abstract" : "Show abstract"}
          </button>
          {expanded && (
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {publication.abstract}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
