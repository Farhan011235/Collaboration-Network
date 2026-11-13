import prisma from "../config/prisma";

export const findSkills = async (search?: string) => {
  return prisma.skill.findMany({
    where: search
      ? { name: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
};

export const findInterests = async (search?: string) => {
  return prisma.interest.findMany({
    where: search
      ? { name: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
  });
};

// Distinct domains already in use, so the form can suggest real values.
export const findResearchDomains = async () => {
  const rows = await prisma.project.findMany({
    where: { status: { not: "DRAFT" } },
    select: { researchDomain: true },
    distinct: ["researchDomain"],
    orderBy: { researchDomain: "asc" },
  });
  return rows.map((r) => r.researchDomain);
};
