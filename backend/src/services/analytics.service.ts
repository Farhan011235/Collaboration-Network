import * as analyticsModel from "../models/analytics.model";

// SERVICE LAYER - assembles the Project Analytics Dashboard payload
// (Module 3 Feature 4).
//
// Note on "member contributions": the manual contribution scoring from
// Module 2 Feature 4 was not built, so contributions here are DERIVED from
// real activity already in the system - tasks, discussions, documents and
// meetings. The weights below are deliberately simple and transparent.
const WEIGHTS = {
  taskCompleted: 3,
  taskAssigned: 1,
  thread: 2,
  comment: 1,
  document: 2,
  meeting: 2,
};

const TIMELINE_DAYS = 30;

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

export const buildProjectAnalytics = async (projectId: number) => {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (TIMELINE_DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const [
    taskCounts,
    priorityCounts,
    overdueTasks,
    milestones,
    completedDates,
    completedBefore,
    members,
    tasksByAssignee,
    threadsByAuthor,
    commentsByAuthor,
    docsByUploader,
    meetingsByOrganizer,
    collaboration,
  ] = await Promise.all([
    analyticsModel.getTaskStatusCounts(projectId),
    analyticsModel.getTaskPriorityCounts(projectId),
    analyticsModel.countOverdueTasks(projectId),
    analyticsModel.getMilestoneBreakdown(projectId),
    analyticsModel.getCompletedTaskDates(projectId, since),
    analyticsModel.countCompletedBefore(projectId, since),
    analyticsModel.getMembers(projectId),
    analyticsModel.getTaskCountsByAssignee(projectId),
    analyticsModel.getThreadCountsByAuthor(projectId),
    analyticsModel.getCommentCountsByAuthor(projectId),
    analyticsModel.getDocumentCountsByUploader(projectId),
    analyticsModel.getMeetingCountsByOrganizer(projectId),
    analyticsModel.getCollaborationTotals(projectId),
  ]);

  const totalTasks = taskCounts.TODO + taskCounts.IN_PROGRESS + taskCounts.DONE;

  // ---- milestones ----
  const now = new Date();
  const milestoneBreakdown = milestones.map((m) => {
    const total = m.tasks.length;
    const done = m.tasks.filter((t) => t.status === "DONE").length;
    return {
      milestoneId: m.milestoneId,
      title: m.title,
      status: m.status,
      dueDate: m.dueDate,
      isOverdue: m.status === "PENDING" && !!m.dueDate && m.dueDate < now,
      taskTotal: total,
      taskDone: done,
      completionPercent: pct(done, total),
    };
  });

  const milestoneStats = {
    total: milestones.length,
    completed: milestoneBreakdown.filter((m) => m.status === "COMPLETED").length,
    pending: milestoneBreakdown.filter((m) => m.status === "PENDING").length,
    overdue: milestoneBreakdown.filter((m) => m.isOverdue).length,
  };

  // ---- completion timeline (cumulative, last 30 days) ----
  const perDay = new Map<string, number>();
  completedDates.forEach((t) => {
    if (!t.completedAt) return;
    const k = dayKey(t.completedAt);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  });

  const timeline: { date: string; completed: number; cumulative: number }[] = [];
  let running = completedBefore;
  for (let i = 0; i < TIMELINE_DAYS; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const k = dayKey(d);
    const completed = perDay.get(k) ?? 0;
    running += completed;
    timeline.push({ date: k, completed, cumulative: running });
  }

  // ---- per-member contributions ----
  const lookup = <T extends { _count: { _all: number } }>(
    rows: T[],
    idKey: keyof T,
    userId: number
  ) =>
    rows
      .filter((r) => (r[idKey] as unknown as number) === userId)
      .reduce((sum, r) => sum + r._count._all, 0);

  const contributions = members.map((m) => {
    const uid = m.userId;
    const assignedRows = tasksByAssignee.filter((r) => r.assigneeId === uid);
    const tasksAssigned = assignedRows.reduce(
      (s, r) => s + r._count._all,
      0
    );
    const tasksCompleted = assignedRows
      .filter((r) => r.status === "DONE")
      .reduce((s, r) => s + r._count._all, 0);

    const threads = lookup(threadsByAuthor, "authorId", uid);
    const comments = lookup(commentsByAuthor, "authorId", uid);
    const documents = lookup(docsByUploader, "uploaderId", uid);
    const meetings = lookup(meetingsByOrganizer, "organizerId", uid);

    const score =
      tasksCompleted * WEIGHTS.taskCompleted +
      (tasksAssigned - tasksCompleted) * WEIGHTS.taskAssigned +
      threads * WEIGHTS.thread +
      comments * WEIGHTS.comment +
      documents * WEIGHTS.document +
      meetings * WEIGHTS.meeting;

    return {
      userId: uid,
      fullName: m.user.fullName,
      role: m.role,
      joinedAt: m.joinedAt,
      tasksAssigned,
      tasksCompleted,
      threads,
      comments,
      documents,
      meetings,
      score,
    };
  });

  // Share of total activity, so the UI can show relative contribution.
  const scoreTotal = contributions.reduce((s, c) => s + c.score, 0);
  const contributionsRanked = contributions
    .map((c) => ({ ...c, sharePercent: pct(c.score, scoreTotal) }))
    .sort((a, b) => b.score - a.score);

  return {
    progress: {
      totalTasks,
      completedTasks: taskCounts.DONE,
      completionPercent: pct(taskCounts.DONE, totalTasks),
      overdueTasks,
      tasks: taskCounts,
      priorities: priorityCounts,
    },
    milestones: { ...milestoneStats, breakdown: milestoneBreakdown },
    timeline,
    collaboration: { ...collaboration, members: members.length },
    contributions: contributionsRanked,
  };
};
