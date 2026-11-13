import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// MODEL LAYER - all database access for project documents.

const documentInclude = {
  uploader: {
    select: { userId: true, fullName: true, profilePictureUrl: true },
  },
} satisfies Prisma.ProjectDocumentInclude;

export const findByProject = (projectId: number) =>
  prisma.projectDocument.findMany({
    where: { projectId },
    include: documentInclude,
    orderBy: { createdAt: "desc" },
  });

// Lightweight lookup for auth + file operations (download / replace / delete).
export const findById = (documentId: number) =>
  prisma.projectDocument.findUnique({
    where: { documentId },
    select: {
      documentId: true,
      projectId: true,
      uploaderId: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      version: true,
    },
  });

export const create = (data: Prisma.ProjectDocumentUncheckedCreateInput) =>
  prisma.projectDocument.create({ data, include: documentInclude });

export const update = (
  documentId: number,
  data: Prisma.ProjectDocumentUncheckedUpdateInput
) =>
  prisma.projectDocument.update({
    where: { documentId },
    data,
    include: documentInclude,
  });

export const remove = (documentId: number) =>
  prisma.projectDocument.delete({ where: { documentId } });
