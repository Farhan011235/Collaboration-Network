import { z } from "zod";

// Accepts an ISO string or a date input value; "" / missing become null.
const optionalDate = z
  .preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.date().nullable()
  )
  .optional();

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(3, "Give the milestone a clear title").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: optionalDate,
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  orderIndex: z.number().int().min(0).max(9999).optional(),
});

export const updateMilestoneSchema = createMilestoneSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" });

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
