import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// MODEL LAYER
// Only this layer talks to the database. It never touches req/res.

// Fields safe to send to the client - never includes passwordHash.
export const publicUserSelect = {
  userId: true,
  fullName: true,
  email: true,
  profilePictureUrl: true,
  bio: true,
  institution: true,
  designation: true,
  orcidId: true,
  websiteUrl: true,
  openToCollaboration: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const findByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findById = async (userId: number) => {
  return prisma.user.findUnique({
    where: { userId },
    select: publicUserSelect,
  });
};

export const emailExists = async (email: string): Promise<boolean> => {
  const count = await prisma.user.count({ where: { email } });
  return count > 0;
};

export const createUser = async (data: {
  fullName: string;
  email: string;
  passwordHash: string;
  institution?: string;
  designation?: string;
}) => {
  return prisma.user.create({
    data,
    select: publicUserSelect,
  });
};

// Portfolio profile fields (Module 1 Feature 4). Only the fields a researcher
// is allowed to edit about themselves - never email or password.
export const updateProfile = (
  userId: number,
  data: {
    fullName?: string;
    bio?: string | null;
    institution?: string | null;
    designation?: string | null;
    orcidId?: string | null;
    websiteUrl?: string | null;
    openToCollaboration?: boolean;
  }
) =>
  prisma.user.update({
    where: { userId },
    data,
    select: publicUserSelect,
  });
