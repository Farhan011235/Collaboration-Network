import { z } from "zod";

const dateField = z.coerce.date({
  errorMap: () => ({ message: "Enter a valid date and time" }),
});

export const createMeetingSchema = z
  .object({
    title: z.string().trim().min(3, "Give the meeting a title").max(200),
    description: z.string().trim().max(3000).optional().or(z.literal("")),
    location: z.string().trim().max(300).optional().or(z.literal("")),
    meetingLink: z
      .string()
      .trim()
      .url("Enter a valid link")
      .max(500)
      .optional()
      .or(z.literal("")),
    startTime: dateField,
    endTime: dateField,
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after the start time",
    path: ["endTime"],
  });

// Every field optional on edit, but the end-after-start rule still holds when
// both are supplied. A single superRefine keeps this one level of ZodEffects,
// which is what the validate middleware accepts.
export const updateMeetingSchema = z
  .object({
    title: z.string().trim().min(3, "Give the meeting a title").max(200),
    description: z.string().trim().max(3000).optional().or(z.literal("")),
    location: z.string().trim().max(300).optional().or(z.literal("")),
    meetingLink: z
      .string()
      .trim()
      .url("Enter a valid link")
      .max(500)
      .optional()
      .or(z.literal("")),
    startTime: dateField,
    endTime: dateField,
  })
  .partial()
  .superRefine((d, ctx) => {
    if (Object.keys(d).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nothing to update" });
    }
    if (d.startTime && d.endTime && d.endTime <= d.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after the start time",
        path: ["endTime"],
      });
    }
  });

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
