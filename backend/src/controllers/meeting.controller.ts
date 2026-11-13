import { Request, Response } from "express";
import * as meetingModel from "../models/meeting.model";
import * as workspaceModel from "../models/workspace.model";
import * as notificationModel from "../models/notification.model";
import * as userModel from "../models/user.model";
import * as calendarService from "../services/googleCalendar.service";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateMeetingInput,
  UpdateMeetingInput,
} from "../validators/meeting.validator";

// CONTROLLER LAYER - Research Meeting Scheduler (Module 3 Feature 1).

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// Shape a meeting into the input the calendar service pushes to Google.
type MeetingLike = {
  title: string;
  description: string | null;
  location: string | null;
  meetingLink: string | null;
  startTime: Date;
  endTime: Date;
};
const toCalendarInput = (m: MeetingLike): calendarService.CalendarEventInput => ({
  title: m.title,
  description: m.description,
  location: m.location,
  meetingLink: m.meetingLink,
  startTime: m.startTime,
  endTime: m.endTime,
});

// Google Calendar work is best-effort and slow: every attendee costs a token
// refresh plus a round-trip to Google. Running it inside the request made
// scheduling a meeting feel sluggish, so it is kicked off in the background
// and the client hears back as soon as our own database is written. The
// meetings page polls, so "On your Google Calendar" appears a moment later.
const syncInBackground = (work: () => Promise<unknown>) => {
  void work().catch(() => {
    /* the meeting still exists in our database; nothing to surface */
  });
};

// Routes keyed by meeting id need their own membership re-check, and we load
// the project owner so we can authorise edits/cancellations.
const loadMeetingForMember = async (meetingId: number, userId: number) => {
  const meeting = await meetingModel.findById(meetingId);
  if (!meeting) {
    throw ApiError.notFound("Meeting not found");
  }
  const membership = await workspaceModel.findProjectMembership(
    meeting.projectId,
    userId
  );
  if (!membership) {
    throw ApiError.forbidden("You must be a member of this project");
  }
  return meeting;
};

// Only the organizer or the project owner may change or cancel a meeting.
const assertCanManage = (
  meeting: { organizerId: number; project: { ownerId: number } },
  userId: number
) => {
  if (meeting.organizerId !== userId && meeting.project.ownerId !== userId) {
    throw ApiError.forbidden(
      "Only the organizer or project owner can change this meeting"
    );
  }
};

// Membership enforced by requireProjectMember on the route.
export const listMeetings = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const meetings = await meetingModel.findByProject(projectId);
    return sendSuccess(res, { meetings });
  }
);

export const createMeeting = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const body = req.body as CreateMeetingInput;
    const organizerId = req.user!.userId;

    // One query does double duty: it is the invite list AND the membership
    // check, so the route doesn't need a separate lookup for the same rows.
    const attendeeIds = await workspaceModel.findMemberIds(projectId);
    if (!attendeeIds.includes(organizerId)) {
      throw ApiError.forbidden("You must be a member of this project");
    }

    const meeting = await meetingModel.create({
      projectId,
      organizerId,
      title: body.title,
      description: body.description || null,
      location: body.location || null,
      meetingLink: body.meetingLink || null,
      startTime: body.startTime,
      endTime: body.endTime,
      attendeeIds,
    });

    // Push the event onto each connected attendee's Google Calendar, after
    // the response has gone out.
    const input = toCalendarInput(meeting);
    syncInBackground(() =>
      Promise.all(
        attendeeIds.map(async (userId) => {
          const eventId = await calendarService.createEvent(userId, input);
          if (eventId) {
            await meetingModel
              .setAttendeeEvent(meeting.meetingId, userId, eventId)
              .catch(() => {});
          }
        })
      )
    );

    // Notifying the team is a side effect too - the organizer doesn't need to
    // wait for it, and the bell polls anyway.
    syncInBackground(async () => {
      const organizer = await userModel.findById(organizerId);
      await notificationModel.createForMembers({
        projectId,
        actorId: organizerId,
        type: "MEETING_SCHEDULED",
        message: `${organizer?.fullName ?? "A member"} scheduled a meeting: "${meeting.title}"`,
        linkUrl: `/projects/${projectId}/meetings`,
        memberIds: attendeeIds,
      });
    });

    // `create` already returns the organizer and attendees, so there is no
    // need to read the row back.
    return sendSuccess(res, { meeting }, "Meeting scheduled", 201);
  }
);

export const updateMeeting = asyncHandler(
  async (req: Request, res: Response) => {
    const meetingId = parseId(req.params.id);
    const meeting = await loadMeetingForMember(meetingId, req.user!.userId);
    assertCanManage(meeting, req.user!.userId);

    const body = req.body as UpdateMeetingInput;

    const updated = await meetingModel.update(meetingId, {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined
        ? { description: body.description || null }
        : {}),
      ...(body.location !== undefined
        ? { location: body.location || null }
        : {}),
      ...(body.meetingLink !== undefined
        ? { meetingLink: body.meetingLink || null }
        : {}),
      ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
      ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
    });

    // Re-sync every attendee's calendar in the background: update an existing
    // event, or create one for anyone who connected Google after the meeting
    // was made.
    const input = toCalendarInput(updated);
    syncInBackground(() =>
      Promise.all(
        updated.attendees.map(async (att) => {
          if (att.googleEventId) {
            await calendarService.updateEvent(
              att.userId,
              att.googleEventId,
              input
            );
          } else {
            const eventId = await calendarService.createEvent(att.userId, input);
            if (eventId) {
              await meetingModel
                .setAttendeeEvent(meetingId, att.userId, eventId)
                .catch(() => {});
            }
          }
        })
      )
    );

    syncInBackground(() =>
      notificationModel.createForMembers({
        projectId: meeting.projectId,
        actorId: req.user!.userId,
        type: "MEETING_UPDATED",
        message: `The meeting "${updated.title}" was updated`,
        linkUrl: `/projects/${meeting.projectId}/meetings`,
        memberIds: updated.attendees.map((a) => a.userId),
      })
    );

    return sendSuccess(res, { meeting: updated }, "Meeting updated");
  }
);

export const deleteMeeting = asyncHandler(
  async (req: Request, res: Response) => {
    const meetingId = parseId(req.params.id);
    const meeting = await loadMeetingForMember(meetingId, req.user!.userId);
    assertCanManage(meeting, req.user!.userId);

    // Remove the event from every attendee's calendar in the background.
    const calendarEvents = meeting.attendees.filter((att) => att.googleEventId);
    syncInBackground(() =>
      Promise.all(
        calendarEvents.map((att) =>
          calendarService.deleteEvent(att.userId, att.googleEventId as string)
        )
      )
    );

    syncInBackground(() =>
      notificationModel.createForMembers({
        projectId: meeting.projectId,
        actorId: req.user!.userId,
        type: "MEETING_CANCELLED",
        message: `The meeting "${meeting.title}" was cancelled`,
        linkUrl: `/projects/${meeting.projectId}/meetings`,
        memberIds: meeting.attendees.map((a) => a.userId),
      })
    );

    await meetingModel.remove(meetingId);
    return sendSuccess(res, { meetingId }, "Meeting cancelled");
  }
);

// POST /meetings/:id/sync - pull this meeting onto MY Google Calendar. Used
// when a member connects Google after the meeting was already scheduled.
export const syncMine = asyncHandler(async (req: Request, res: Response) => {
  const meetingId = parseId(req.params.id);
  const userId = req.user!.userId;
  const meeting = await loadMeetingForMember(meetingId, userId);

  const attendee = meeting.attendees.find((a) => a.userId === userId);
  if (!attendee) {
    throw ApiError.badRequest("You are not on this meeting's invite list");
  }

  if (!(await calendarService.isConnected(userId))) {
    throw ApiError.badRequest("Connect Google Calendar first");
  }

  const input = toCalendarInput(meeting);

  if (attendee.googleEventId) {
    await calendarService.updateEvent(userId, attendee.googleEventId, input);
    return sendSuccess(res, { synced: true }, "Already on your calendar");
  }

  const eventId = await calendarService.createEvent(userId, input);
  if (!eventId) {
    throw ApiError.badRequest("Could not add the meeting to your calendar");
  }
  await meetingModel.setAttendeeEvent(meetingId, userId, eventId);

  return sendSuccess(res, { synced: true }, "Added to your Google Calendar");
});
