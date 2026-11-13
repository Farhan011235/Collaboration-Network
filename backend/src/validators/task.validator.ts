import { z } from "zod";

const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;

const optionalDate = z
  .preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.date().nullable()
  )
  .optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Give the task a clear title").max(200),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  dueDate: optionalDate,
  assigneeId: z.number().int().positive().nullable().optional(),
  milestoneId: z.number().int().positive().nullable().optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" });

// A lightweight schema for the quick "move to another column" action.
export const updateTaskStatusSchema = z.object({
  status: z.enum(taskStatuses),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
