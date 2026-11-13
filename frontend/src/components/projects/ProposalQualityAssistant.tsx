"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, CheckCircle2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import * as proposalService from "@/services/proposal.service";
import { Button } from "@/components/ui/button";
import type { ProposalAnalysis, ProposalDimension } from "@/types";

const scoreLabel = (score: number) => {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs work";
};

const scoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
};

function Dimension({
  name,
  data,
}: {
  name: string;
  data: ProposalDimension;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{name}</h4>
        <span className={`text-sm font-semibold ${scoreColor(data.score)}`}>
          {data.score}/100
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${data.score}%` }}
        />
      </div>
      {data.feedback && (
        <p className="mt-2.5 text-sm text-muted-foreground">{data.feedback}</p>
      )}
      {data.suggestions.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {data.suggestions.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/90">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProposalQualityAssistant({
  projectId,
}: {
  projectId: number;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ProposalAnalysis | null>(null);

  useEffect(() => {
    proposalService
      .getStatus()
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
  }, []);

  const analyze = async () => {
    setLoading(true);
    try {
      setAnalysis(await proposalService.analyzeProposal(projectId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-medium">
            <Sparkles className="h-5 w-5 text-primary" />
            Proposal Quality Assistant
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AI feedback on clarity, completeness and structure before you publish.
          </p>
        </div>
        {configured !== false && (
          <Button size="sm" onClick={analyze} loading={loading}>
            {analysis ? "Re-analyze" : "Analyze with AI"}
          </Button>
        )}
      </div>

      {configured === false && (
        <p className="mt-4 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          The assistant isn&apos;t set up on the server yet. Add a free{" "}
          <code className="rounded bg-muted px-1 py-0.5">GEMINI_API_KEY</code> to
          the backend to enable AI suggestions.
        </p>
      )}

      {analysis && (
        <div className="mt-5 space-y-5">
          {/* Overall */}
          <div className="flex items-start gap-4 rounded-md border border-border bg-background p-4">
            <div className="text-center">
              <div className={`text-3xl font-semibold ${scoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${scoreColor(analysis.overallScore)}`}>
                {scoreLabel(analysis.overallScore)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {analysis.summary}
              </p>
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid gap-3 sm:grid-cols-1">
            <Dimension name="Clarity" data={analysis.clarity} />
            <Dimension name="Completeness" data={analysis.completeness} />
            <Dimension name="Structure" data={analysis.structure} />
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div className="rounded-md border border-border bg-background p-4">
              <h4 className="text-sm font-medium">Strengths</h4>
              <ul className="mt-2 space-y-1.5">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            AI-generated suggestions — review them yourself before publishing.
          </p>
        </div>
      )}
    </section>
  );
}
