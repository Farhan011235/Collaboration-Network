"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Pencil,
  Trash2,
  CalendarPlus,
  CheckCircle2,
  KanbanSquare,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLivePoll } from "@/hooks/useLivePoll";
import * as projectService from "@/services/project.service";
import * as meetingService from "@/services/meeting.service";
import * as googleService from "@/services/google.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MeetingForm } from "@/components/workspace/MeetingForm";
import type { GoogleStatus, Meeting } from "@/types";

const fmtRange = (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const t = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${t(start)} – ${t(end)}`;
};

export default function MeetingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = Number(params.id);

  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [google, setGoogle] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState<{ open: boolean; editing?: Meeting }>({
    open: false,
  });

  useEffect(() => {
    if (!Number.isInteger(projectId)) return;
    Promise.all([
      projectService.getProject(projectId),
      meetingService.getMeetings(projectId),
      googleService.getStatus(),
    ])
      .then(([project, list, status]) => {
        setTitle(project.title);
        setOwnerId(project.ownerId);
        setMeetings(list);
        setGoogle(status);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  // Handle the return trip from Google's consent screen.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const status = q.get("google");
    if (!status) return;
    if (status === "connected") {
      toast.success("Google Calendar connected");
      googleService.getStatus().then(setGoogle).catch(() => {});
    } else if (status === "error") {
      toast.error("Couldn't connect Google Calendar. Try again.");
    }
    // Strip the query param so a refresh doesn't repeat the toast.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Silent background refresh so new/updated meetings from teammates show up
  // without a manual reload.
  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId)) return;
    try {
      setMeetings(await meetingService.getMeetings(projectId));
    } catch {
      /* transient poll failure - next tick retries */
    }
  }, [projectId]);

  useLivePoll(refresh, { enabled: Number.isInteger(projectId) });

  const canManage = (m: Meeting) =>
    user?.userId === m.organizerId || user?.userId === ownerId;

  const myAttendee = (m: Meeting) =>
    m.attendees.find((a) => a.userId === user?.userId);

  const connect = async () => {
    setConnecting(true);
    try {
      const url = await googleService.getAuthUrl(
        `/projects/${projectId}/meetings`
      );
      window.location.href = url;
    } catch (error) {
      toast.error(getErrorMessage(error));
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await googleService.disconnect();
      setGoogle((g) => (g ? { ...g, connected: false, googleEmail: null } : g));
      toast.success("Google Calendar disconnected");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onSaved = () => {
    setForm({ open: false });
    refresh();
  };

  const remove = async (m: Meeting) => {
    if (!window.confirm(`Cancel the meeting "${m.title}"? This removes it from everyone's Google Calendar.`))
      return;
    setBusyId(m.meetingId);
    try {
      await meetingService.deleteMeeting(m.meetingId);
      setMeetings((prev) => prev.filter((x) => x.meetingId !== m.meetingId));
      toast.success("Meeting cancelled");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const sync = async (m: Meeting) => {
    setBusyId(m.meetingId);
    try {
      await meetingService.syncMeeting(m.meetingId);
      toast.success("Added to your Google Calendar");
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
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
                    Meetings
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{title}</p>
                </div>
                {!form.open && (
                  <Button size="sm" onClick={() => setForm({ open: true })}>
                    <Plus className="h-4 w-4" />
                    Schedule meeting
                  </Button>
                )}
              </div>

              {/* Google Calendar connection */}
              <div className="mt-6 rounded-lg border border-border bg-card p-4">
                {google && !google.configured ? (
                  <p className="text-sm text-muted-foreground">
                    Google Calendar isn&apos;t set up on the server yet. Meetings
                    still work here in the app — they just won&apos;t sync to
                    Google.
                  </p>
                ) : google?.connected ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Google Calendar connected
                      {google.googleEmail ? (
                        <span className="text-muted-foreground">
                          ({google.googleEmail})
                        </span>
                      ) : null}
                    </p>
                    <Button variant="ghost" size="sm" onClick={disconnect}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Connect Google Calendar to sync project meetings to your
                      own calendar.
                    </p>
                    <Button size="sm" onClick={connect} loading={connecting}>
                      <Calendar className="h-4 w-4" />
                      Connect Google Calendar
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-8">
                {meetings.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No meetings scheduled"
                    body="Schedule a research meeting and it'll appear on every connected member's Google Calendar."
                  />
                ) : (
                  <ul className="space-y-3">
                    {meetings.map((m) => {
                      const mine = myAttendee(m);
                      const onMyCalendar = !!mine?.googleEventId;
                      return (
                        <li
                          key={m.meetingId}
                          className="rounded-lg border border-border bg-card p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="font-display text-lg font-medium leading-snug">
                                {m.title}
                              </h3>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {fmtRange(m.startTime, m.endTime)}
                                </span>
                              </div>
                            </div>
                            {canManage(m) && (
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm({ open: true, editing: m })
                                  }
                                  aria-label="Edit meeting"
                                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => remove(m)}
                                  disabled={busyId === m.meetingId}
                                  aria-label="Cancel meeting"
                                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {(m.location || m.meetingLink) && (
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              {m.location && (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {m.location}
                                </span>
                              )}
                              {m.meetingLink && (
                                <a
                                  href={m.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                                >
                                  <Video className="h-3.5 w-3.5" />
                                  Join link
                                </a>
                              )}
                            </div>
                          )}

                          {m.description && (
                            <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">
                              {m.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              {m.organizer.fullName} · {m.attendees.length} invited
                            </span>

                            {google?.connected ? (
                              onMyCalendar ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  On your Google Calendar
                                </span>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sync(m)}
                                  loading={busyId === m.meetingId}
                                >
                                  <CalendarPlus className="h-4 w-4" />
                                  Add to my calendar
                                </Button>
                              )
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {form.open && (
        <MeetingForm
          projectId={projectId}
          existing={form.editing}
          onClose={() => setForm({ open: false })}
          onSaved={onSaved}
        />
      )}
    </ProtectedRoute>
  );
}
