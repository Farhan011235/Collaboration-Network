"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Send, Archive, RotateCcw, Trash2, Inbox, KanbanSquare } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import * as projectService from "@/services/project.service";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";

// Owner controls for the proposal lifecycle.
export function ProjectActions({
  project,
  onUpdated,
}: {
  project: Project;
  onUpdated?: (project: Project) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (
    key: string,
    action: () => Promise<Project | void>,
    confirmText?: string
  ) => {
    if (confirmText && !window.confirm(confirmText)) return;

    setBusy(key);
    try {
      const updated = await action();
      toast.success(
        {
          publish: "Published",
          archive: "Archived",
          reopen: "Reopened",
          delete: "Draft deleted",
        }[key] ?? "Done"
      );
      if (key === "delete") {
        router.push("/my-projects");
      } else if (updated) {
        // Push the new status straight into the page so the UI reflects it.
        onUpdated?.(updated);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const id = project.projectId;

  return (
    <div className="flex flex-wrap gap-2">
      {project.status !== "COMPLETED" && (
        <Button asChild variant="outline" size="sm">
          <Link href={`/my-projects/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      )}

      {/* The workspace (tasks & milestones) - owner is always a member. */}
      <Button asChild variant="outline" size="sm">
        <Link href={`/projects/${id}/workspace`}>
          <KanbanSquare className="h-4 w-4" />
          Workspace
        </Link>
      </Button>

      {/* Requests only exist once a project has been published at least once. */}
      {project.status !== "DRAFT" && (
        <Button asChild variant="outline" size="sm">
          <Link href={`/my-projects/${id}/requests`}>
            <Inbox className="h-4 w-4" />
            Review requests
            {project._count.applications > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                {project._count.applications}
              </span>
            )}
          </Link>
        </Button>
      )}

      {project.status === "DRAFT" && (
        <>
          <Button
            size="sm"
            loading={busy === "publish"}
            onClick={() =>
              run(
                "publish",
                () => projectService.publishProject(id),
                "Publish this project? Other researchers will be able to find it and apply."
              )
            }
          >
            <Send className="h-4 w-4" />
            Publish
          </Button>

          <Button
            variant="ghost"
            size="sm"
            loading={busy === "delete"}
            onClick={() =>
              run(
                "delete",
                () => projectService.deleteProject(id),
                "Delete this draft? This cannot be undone."
              )
            }
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </>
      )}

      {project.status === "PUBLISHED" && (
        <Button
          variant="outline"
          size="sm"
          loading={busy === "archive"}
          onClick={() =>
            run(
              "archive",
              () => projectService.archiveProject(id),
              "Archive this project? It will stop appearing in search."
            )
          }
        >
          <Archive className="h-4 w-4" />
          Archive
        </Button>
      )}

      {project.status === "ARCHIVED" && (
        <Button
          size="sm"
          loading={busy === "reopen"}
          onClick={() => run("reopen", () => projectService.reopenProject(id))}
        >
          <RotateCcw className="h-4 w-4" />
          Reopen
        </Button>
      )}
    </div>
  );
}
