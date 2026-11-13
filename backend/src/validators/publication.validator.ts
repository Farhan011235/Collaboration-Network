import { z } from "zod";

// Query params arrive as strings, so numbers and booleans are coerced.
const sortOptions = ["relevance", "citations", "newest"] as const;

export const searchPublicationSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters to search")
      .max(200),
    fromYear: z.coerce.number().int().min(1500).max(2100).optional(),
    toYear: z.coerce.number().int().min(1500).max(2100).optional(),
    openAccessOnly: z
      .preprocess((v) => v === "true" || v === true, z.boolean())
      .optional(),
    sort: z.enum(sortOptions).default("relevance"),
    page: z.coerce.number().int().min(1).max(200).default(1),
    perPage: z.coerce.number().int().min(1).max(50).default(10),
  })
  .refine(
    (d) => d.fromYear === undefined || d.toYear === undefined || d.fromYear <= d.toYear,
    { message: "From year cannot be after To year", path: ["fromYear"] }
  );

export type SearchPublicationInput = z.infer<typeof searchPublicationSchema>;
