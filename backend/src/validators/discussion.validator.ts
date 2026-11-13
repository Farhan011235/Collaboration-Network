import { z } from "zod";

// A new discussion topic on a project board.
export const createThreadSchema = z.object({
  title: z.string().trim().min(3, "Give the discussion a title").max(160),
  body: z.string().trim().min(1, "Write something to start the discussion").max(5000),
});

// A reply on a thread.
export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Write a reply").max(5000),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
