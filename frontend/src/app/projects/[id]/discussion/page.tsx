"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Plus,
  KanbanSquare,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { getInitials } from "@/lib/utils";
import * as projectService from "@/services/project.service";
import * as discussionService from "@/services/discussion.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { useLivePoll } from "@/hooks/useLivePoll";
import type { DiscussionThread } from "@/types";

export default function DiscussionBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [title, setTitle] = useState("");
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [loading, setLoading] = useState(true);

  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(projectId)) return;

    Promise.all([
      projectService.getProject(projectId),
      discussionService.getThreads(projectId),
    ])
      .then(([project, list]) => {
        setTitle(project.title);
        setThreads(list);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  // Silent background refresh so new threads from teammates show up live.
  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId)) return;
    try {
      setThreads(await discussionService.getThreads(projectId));
    } catch {
      // Ignore transient poll failures; the next tick retries.
    }
  }, [projectId]);

  useLivePoll(refresh, { enabled: Number.isInteger(projectId) });

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 3 || form.body.trim().length < 1) {
      toast.error("Add a title and a message");
      return;
    }
    setPosting(true);
    try {
      const thread = await discussionService.createThread(projectId, form);
      setThreads((prev) => [thread, ...prev]);
      setForm({ title: "", body: "" });
      setComposing(false);
      toast.success("Discussion posted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPosting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-3xl flex-1 py-10">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Link
                  href={`/projects/${projectId}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to project
                </Link>
                <Link
                  href={`/projects/${projectId}/workspace`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <KanbanSquare className="h-4 w-4" />
                  Workspace
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-medium tracking-tight">
                    Discussion
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{title}</p>
                </div>
                {!composing && (
                  <Button size="sm" onClick={() => setComposing(true)}>
                    <Plus className="h-4 w-4" />
                    Start a discussion
                  </Button>
                )}
              </div>

              {composing && (
                <form
                  onSubmit={post}
                  className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="What do you want to discuss?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">Message</Label>
                    <Textarea
                      id="body"
                      rows={4}
                      value={form.body}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, body: e.target.value }))
                      }
                      placeholder="Share your thoughts with the team…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" loading={posting}>
                      Post
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setComposing(false)}
                      disabled={posting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="mt-8">
                {threads.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No discussions yet"
                    body="Start the first conversation for this project's team."
                  />
                ) : (
                  <ul className="space-y-3">
                    {threads.map((thread) => (
                      <li key={thread.threadId}>
                        <Link
                          href={`/projects/${projectId}/discussion/${thread.threadId}`}
                          className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
                        >
                          <h3 className="font-display text-lg font-medium leading-snug group-hover:text-primary">
                            {thread.title}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                            {thread.body}
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                                {getInitials(thread.author.fullName)}
                              </span>
                              {thread.author.fullName}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {thread._count.comments}
                            </span>
                            <span>
                              {new Date(thread.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
