"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import * as discussionService from "@/services/discussion.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLivePoll } from "@/hooks/useLivePoll";
import type { DiscussionComment, DiscussionThreadDetail } from "@/types";

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const projectId = Number(params.id);
  const threadId = Number(params.threadId);

  const [thread, setThread] = useState<DiscussionThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(threadId)) return;
    discussionService
      .getThread(threadId)
      .then(setThread)
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push(`/projects/${projectId}/discussion`);
      })
      .finally(() => setLoading(false));
  }, [threadId, projectId, router]);

  // Silent background refresh so new replies from teammates appear live.
  // The reply box is separate state, so a refresh never disturbs typing.
  const refresh = useCallback(async () => {
    if (!Number.isInteger(threadId)) return;
    try {
      setThread(await discussionService.getThread(threadId));
    } catch {
      // Ignore transient poll failures; the next tick retries.
    }
  }, [threadId]);

  useLivePoll(refresh, { enabled: Number.isInteger(threadId) });

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reply.trim().length < 1) return;
    setSending(true);
    try {
      const comment = await discussionService.addComment(threadId, reply);
      setThread((prev) =>
        prev ? { ...prev, comments: [...prev.comments, comment] } : prev
      );
      setReply("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const removeComment = async (comment: DiscussionComment) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await discussionService.deleteComment(comment.commentId);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter(
                (c) => c.commentId !== comment.commentId
              ),
            }
          : prev
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeThread = async () => {
    if (!window.confirm("Delete this whole discussion?")) return;
    try {
      await discussionService.deleteThread(threadId);
      toast.success("Discussion deleted");
      router.push(`/projects/${projectId}/discussion`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-3xl flex-1 py-10">
          {loading || !thread ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Link
                href={`/projects/${projectId}/discussion`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Discussion
              </Link>

              {/* Original post */}
              <article className="mt-4 border-b border-border pb-6">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="font-display text-2xl font-medium leading-tight tracking-tight">
                    {thread.title}
                  </h1>
                  {user?.userId === thread.authorId && (
                    <button
                      type="button"
                      onClick={removeThread}
                      aria-label="Delete discussion"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                    {getInitials(thread.author.fullName)}
                  </span>
                  {thread.author.fullName} ·{" "}
                  {new Date(thread.createdAt).toLocaleString()}
                </div>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/90">
                  {thread.body}
                </p>
              </article>

              {/* Comments */}
              <section className="py-6">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {thread.comments.length}{" "}
                  {thread.comments.length === 1 ? "reply" : "replies"}
                </h2>

                <ul className="mt-4 space-y-4">
                  {thread.comments.map((comment) => (
                    <li key={comment.commentId} className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {getInitials(comment.author.fullName)}
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {comment.author.fullName}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            {user?.userId === comment.authorId && (
                              <button
                                type="button"
                                onClick={() => removeComment(comment)}
                                aria-label="Delete reply"
                                className="rounded p-1 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">
                          {comment.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Add a reply */}
                <form onSubmit={send} className="mt-6 space-y-3">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    placeholder="Write a reply…"
                  />
                  <Button type="submit" loading={sending} disabled={!reply.trim()}>
                    <Send className="h-4 w-4" />
                    Reply
                  </Button>
                </form>
              </section>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
