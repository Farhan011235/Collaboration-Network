"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  Calendar,
  Pencil,
  Trash2,
  MessageSquare,
  FileText,
  BarChart3,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import * as projectService from "@/services/project.service";
import * as workspaceService from "@/services/workspace.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/workspace/TaskCard";
import { TaskForm } from "@/components/workspace/TaskForm";
import { MilestoneForm } from "@/components/workspace/MilestoneForm";
import { useLivePoll } from "@/hooks/useLivePoll";
import type {
  Milestone,
  ProjectMemberEntry,
  Task,
  TaskStatus,
  WorkspaceOverview,
} from "@/types";

const columns: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "DONE", label: "Done" },
];

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [members, setMembers] = useState<ProjectMemberEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);

  const [taskForm, setTaskForm] = useState<{ open: boolean; editing?: Task }>({
    open: false,
  });
  const [milestoneForm, setMilestoneForm] = useState<{
    open: boolean;
    editing?: Milestone;
  }>({ open: false });

  useEffect(() => {
    if (!Number.isInteger(projectId)) return;

    Promise.all([
      projectService.getProject(projectId),
      workspaceService.getOverview(projectId),
      workspaceService.getMembers(projectId),
      workspaceService.getMilestones(projectId),
      workspaceService.getTasks(projectId),
    ])
      .then(([project, ov, mem, ms, ts]) => {
        setTitle(project.title);
        setOverview(ov);
        setMembers(mem);
        setMilestones(ms);
        setTasks(ts);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  const reloadOverview = () => {
    workspaceService.getOverview(projectId).then(setOverview).catch(() => {});
  };

  // Silent background refresh so tasks, milestones and completion stats stay
  // in sync when teammates change the board - no manual reload. Open forms and
  // the task being dragged are separate state, so a refresh won't disturb them.
  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId)) return;
    try {
      const [ov, mem, ms, ts] = await Promise.all([
        workspaceService.getOverview(projectId),
        workspaceService.getMembers(projectId),
        workspaceService.getMilestones(projectId),
        workspaceService.getTasks(projectId),
      ]);
      setOverview(ov);
      setMembers(mem);
      setMilestones(ms);
      setTasks(ts);
    } catch {
      // Ignore transient poll failures; the next tick retries.
    }
  }, [projectId]);

  useLivePoll(refresh, { enabled: Number.isInteger(projectId) });

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  /* ---------- task handlers ---------- */

  const onTaskSaved = (task: Task, isNew: boolean) => {
    setTasks((prev) =>
      isNew
        ? [...prev, task]
        : prev.map((t) => (t.taskId === task.taskId ? task : t))
    );
    setTaskForm({ open: false });
    reloadOverview();
  };

  const moveTask = async (task: Task, status: TaskStatus) => {
    if (status === task.status) return;
    setBusyTaskId(task.taskId);
    try {
      const updated = await workspaceService.updateTaskStatus(task.taskId, status);
      setTasks((prev) => prev.map((t) => (t.taskId === updated.taskId ? updated : t)));
      reloadOverview();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyTaskId(null);
    }
  };

  const removeTask = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await workspaceService.deleteTask(task.taskId);
      setTasks((prev) => prev.filter((t) => t.taskId !== task.taskId));
      reloadOverview();
      toast.success("Task deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  /* ---------- milestone handlers ---------- */

  const onMilestoneSaved = (milestone: Milestone, isNew: boolean) => {
    setMilestones((prev) =>
      isNew
        ? [...prev, milestone]
        : prev.map((m) =>
            m.milestoneId === milestone.milestoneId ? milestone : m
          )
    );
    setMilestoneForm({ open: false });
    reloadOverview();
  };

  const toggleMilestone = async (milestone: Milestone) => {
    const status = milestone.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      const updated = await workspaceService.updateMilestone(
        milestone.milestoneId,
        { status }
      );
      setMilestones((prev) =>
        prev.map((m) => (m.milestoneId === updated.milestoneId ? updated : m))
      );
      reloadOverview();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeMilestone = async (milestone: Milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.title}"?`)) return;
    try {
      await workspaceService.deleteMilestone(milestone.milestoneId);
      setMilestones((prev) =>
        prev.filter((m) => m.milestoneId !== milestone.milestoneId)
      );
      // Tasks that pointed at it now have no milestone.
      const refreshed = await workspaceService.getTasks(projectId);
      setTasks(refreshed);
      reloadOverview();
      toast.success("Milestone deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container flex-1 py-10">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/projects/${projectId}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to project
                </Link>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link
                    href={`/projects/${projectId}/analytics`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                  <Link
                    href={`/projects/${projectId}/team`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <UsersRound className="h-4 w-4" />
                    Team
                  </Link>
                  <Link
                    href={`/projects/${projectId}/meetings`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Calendar className="h-4 w-4" />
                    Meetings
                  </Link>
                  <Link
                    href={`/projects/${projectId}/discussion`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Discussion
                  </Link>
                  <Link
                    href={`/projects/${projectId}/documents`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <FileText className="h-4 w-4" />
                    Documents
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-medium tracking-tight">
                    Workspace
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{title}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMilestoneForm({ open: true })}
                  >
                    <Plus className="h-4 w-4" />
                    Milestone
                  </Button>
                  <Button size="sm" onClick={() => setTaskForm({ open: true })}>
                    <Plus className="h-4 w-4" />
                    Task
                  </Button>
                </div>
              </div>

              {/* Completion overview */}
              {overview && (
                <div className="mt-6 rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-sm font-medium">
                      Project completion
                    </h2>
                    <span className="text-sm font-medium text-primary">
                      {overview.completionPercent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${overview.completionPercent}%` }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span>{overview.tasks.TODO} to do</span>
                    <span>{overview.tasks.IN_PROGRESS} in progress</span>
                    <span>{overview.tasks.DONE} done</span>
                    <span>
                      {overview.milestones.completed}/{overview.milestones.total}{" "}
                      milestones
                    </span>
                  </div>
                </div>
              )}

              {/* Milestones */}
              <section className="mt-8">
                <h2 className="font-display text-lg font-medium">Milestones</h2>
                {milestones.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No milestones yet. Add one to group tasks into phases.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {milestones.map((m) => (
                      <li
                        key={m.milestoneId}
                        className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3"
                      >
                        <button
                          type="button"
                          onClick={() => toggleMilestone(m)}
                          aria-label="Toggle milestone"
                          className="shrink-0 text-primary"
                        >
                          {m.status === "COMPLETED" ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium ${
                              m.status === "COMPLETED"
                                ? "text-muted-foreground line-through"
                                : ""
                            }`}
                          >
                            {m.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            <span>{m._count.tasks} tasks</span>
                            {m.dueDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(m.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMilestoneForm({ open: true, editing: m })}
                          aria-label="Edit milestone"
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMilestone(m)}
                          aria-label="Delete milestone"
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Task board */}
              <section className="mt-8">
                <h2 className="font-display text-lg font-medium">Tasks</h2>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between px-1">
                        <h3 className="text-sm font-medium">{col.label}</h3>
                        <Badge variant="muted">
                          {tasksByStatus[col.key].length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {tasksByStatus[col.key].length === 0 ? (
                          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                            Nothing here
                          </p>
                        ) : (
                          tasksByStatus[col.key].map((task) => (
                            <TaskCard
                              key={task.taskId}
                              task={task}
                              busy={busyTaskId === task.taskId}
                              onEdit={(t) => setTaskForm({ open: true, editing: t })}
                              onDelete={removeTask}
                              onMove={moveTask}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {taskForm.open && (
        <TaskForm
          projectId={projectId}
          members={members}
          milestones={milestones}
          existing={taskForm.editing}
          onClose={() => setTaskForm({ open: false })}
          onSaved={onTaskSaved}
        />
      )}

      {milestoneForm.open && (
        <MilestoneForm
          projectId={projectId}
          existing={milestoneForm.editing}
          onClose={() => setMilestoneForm({ open: false })}
          onSaved={onMilestoneSaved}
        />
      )}
    </ProtectedRoute>
  );
}
