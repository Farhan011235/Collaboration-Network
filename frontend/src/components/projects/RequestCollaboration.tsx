"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Send,
  Check,
  Clock,
  X,
  KanbanSquare,
  MessageSquare,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import * as applicationService from "@/services/application.service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationStatus, Project } from "@/types";

// Lets a researcher request to collaborate on a published project.
// It first checks whether they've already applied, so the button
// reflects the real state (pending / accepted / declined).
export function RequestCollaboration({ project }: { project: Project }) {
  const [existing, setExisting] = useState<ApplicationStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    applicationService
      .getMyApplications()
      .then((apps) => {
        const mine = apps.find((a) => a.projectId === project.projectId);
        setExisting(mine ? mine.status : null);
      })
      .catch(() => setExisting(null))
      .finally(() => setChecking(false));
  }, [project.projectId]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await applicationService.applyToProject(project.projectId, message);
      toast.success("Request sent to the project owner");
      setExisting("PENDING");
      setOpen(false);
      setMessage("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return null;

  if (existing === "PENDING") {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Request pending review
      </div>
    );
  }

  if (existing === "ACCEPTED") {
    return (
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
          <Check className="h-4 w-4" />
          You&apos;re on this team
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${project.projectId}/workspace`}>
              <KanbanSquare className="h-4 w-4" />
              Workspace
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${project.projectId}/discussion`}>
              <MessageSquare className="h-4 w-4" />
              Discussion
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${project.projectId}/documents`}>
              <FileText className="h-4 w-4" />
              Documents
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (existing === "REJECTED") {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
        <X className="h-4 w-4" />
        Your request was declined
      </div>
    );
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" />
        Request to collaborate
      </Button>
    );
  }

  return (
    <div className="max-w-lg space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-medium">Request to collaborate</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Add a short note telling the owner why you&apos;re a good fit
          (optional).
        </p>
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="I'd like to contribute because…"
        rows={4}
        maxLength={1000}
      />
      <div className="flex gap-2">
        <Button onClick={submit} loading={submitting}>
          <Send className="h-4 w-4" />
          Send request
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
