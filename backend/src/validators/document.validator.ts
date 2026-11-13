import { z } from "zod";

// Document metadata. The file itself is handled by multer, not zod;
// these fields arrive as multipart form-text alongside it.
export const createDocumentSchema = z.object({
  title: z.string().trim().min(2, "Give the document a title").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
});

// On update every metadata field is optional (you might only replace the file).
export const updateDocumentSchema = createDocumentSchema.partial();

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
