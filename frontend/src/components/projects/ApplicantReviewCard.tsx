"use client";

import { Check, X, Mail, ExternalLink, GraduationCap } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApplicationDecision, ProjectApplication } from "@/types";

const statusStyle = {
  PENDING: { label: "Pending", variant: "secondary" as const },
  ACCEPTED: { label: "On the team", variant: "default" as const },
  REJECTED: { label: "Declined", variant: "muted" as const },
  WITHDRAWN: { label: "Withdrawn", variant: "muted" as const },
};

// One applicant, with everything the owner needs to evaluate them and,
// while the request is pending, the accept / decline controls.
export function ApplicantReviewCard({
  application,
  onDecision,
  busy,
  teamFull,
}: {
  application: ProjectApplication;
  onDecision: (
    applicationId: number,
    decision: ApplicationDecision
  ) => void;
  busy?: "ACCEPT" | "REJECT" | null;
  teamFull?: boolean;
}) {
  const { applicant, status } = application;
  const style = statusStyle[status];
  const isPending = status === "PENDING";

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {getInitials(applicant.fullName)}
          </span>
          <div>
            <h3 className="font-display text-base font-medium leading-snug">
              {applicant.fullName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {[applicant.designation, applicant.institution]
                .filter(Boolean)
                .join(" · ") || "Researcher"}
            </p>
          </div>
        </div>
        <Badge variant={style.variant}>{style.label}</Badge>
      </div>

      {applicant.bio && (
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">
          {applicant.bio}
        </p>
      )}

      {/* Contact & external profiles */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <a
          href={`mailto:${applicant.email}`}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <Mail className="h-3 w-3" />
          {applicant.email}
        </a>
        {applicant.orcidId && (
          <a
            href={`https://orcid.org/${applicant.orcidId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <GraduationCap className="h-3 w-3" />
            ORCID
          </a>
        )}
        {applicant.websiteUrl && (
          <a
            href={applicant.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Website
          </a>
        )}
      </div>

      {/* Skills (from the applicant's portfolio) */}
      {applicant.skills.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">Skills</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {applicant.skills.map((s) => (
              <Badge key={s.skillId} variant="secondary">
                {s.skill.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {applicant.interests.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">Interests</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {applicant.interests.map((i) => (
              <Badge key={i.interestId} variant="muted">
                {i.interest.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* The note the applicant sent with their request */}
      {application.message && (
        <blockquote className="mt-4 border-l-2 border-border pl-3 text-sm italic text-muted-foreground">
          {application.message}
        </blockquote>
      )}

      {/* Owner's note, once reviewed */}
      {!isPending && application.reviewNote && (
        <p className="mt-4 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Your note:</span>{" "}
          {application.reviewNote}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">
          Requested {new Date(application.appliedAt).toLocaleDateString()}
        </span>

        {isPending && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={busy === "REJECT"}
              disabled={!!busy}
              onClick={() => onDecision(application.applicationId, "REJECT")}
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
            <Button
              size="sm"
              loading={busy === "ACCEPT"}
              disabled={!!busy || teamFull}
              title={teamFull ? "The team is already at its size limit" : undefined}
              onClick={() => onDecision(application.applicationId, "ACCEPT")}
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
