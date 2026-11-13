import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// MODEL LAYER - all database access for meetings (Module 3 Feature 1).

const meetingInclude = {
  organizer: {
    select: { userId: true, fullName: true, profilePictureUrl: true },
  },
  attendees: {
    include: {
      user: { select: { userId: true, fullName: true } },
    },
  },
} satisfies Prisma.MeetingInclude;

export const findByProject = (projectId: number) =>
  prisma.meeting.findMany({
    where: { projectId },
    include: meetingInclude,
    orderBy: { startTime: "asc" },
  });

// Full meeting with attendees (incl. their Google event ids) + the project
// owner, so the controller can authorise edits and sync calendars.
export const findById = (meetingId: number) =>
  prisma.meeting.findUnique({
    where: { meetingId },
    include: {
      ...meetingInclude,
      project: { select: { projectId: true, ownerId: true } },
    },
  });

interface CreateMeetingInput {
  projectId: number;
  organizerId: number;
  title: string;
  description?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  startTime: Date;
  endTime: Date;
  attendeeIds: number[];
}

// Create the meeting and its attendee rows together.
// Creating the meeting and its attendee rows as two flat statements is about
// a second faster than one nested create, because Prisma runs nested writes
// inside an interactive transaction (BEGIN, one INSERT per attendee, COMMIT) -
// and every one of those is a round-trip to a database on another continent.
// If the attendee insert fails the meeting is removed again, so a meeting with
// no attendees can never be left behind.
export const create = async (data: CreateMeetingInput) => {
  const meeting = await prisma.meeting.create({
    data: {
      projectId: data.projectId,
      organizerId: data.organizerId,
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      meetingLink: data.meetingLink ?? null,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });

  try {
    await prisma.meetingAttendee.createMany({
      data: data.attendeeIds.map((userId) => ({
        meetingId: meeting.meetingId,
        userId,
      })),
    });
  } catch (err) {
    await prisma.meeting
      .delete({ where: { meetingId: meeting.meetingId } })
      .catch(() => {});
    throw err;
  }

  return meeting;
};

export const update = (
  meetingId: number,
  data: Prisma.MeetingUncheckedUpdateInput
) =>
  prisma.meeting.update({
    where: { meetingId },
    data,
    // Just the attendee rows - enough to re-sync calendars and address
    // notifications, without the extra queries a full include would cost.
    include: {
      attendees: { select: { userId: true, googleEventId: true } },
    },
  });

// Records the Google Calendar event id created on one attendee's calendar.
export const setAttendeeEvent = (
  meetingId: number,
  userId: number,
  googleEventId: string | null
) =>
  prisma.meetingAttendee.update({
    where: { meetingId_userId: { meetingId, userId } },
    data: { googleEventId, syncedAt: googleEventId ? new Date() : null },
  });

export const findAttendee = (meetingId: number, userId: number) =>
  prisma.meetingAttendee.findUnique({
    where: { meetingId_userId: { meetingId, userId } },
  });

export const remove = (meetingId: number) =>
  prisma.meeting.delete({ where: { meetingId } });
