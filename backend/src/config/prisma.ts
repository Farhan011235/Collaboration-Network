import { PrismaClient } from "@prisma/client";

// Single shared instance. Creating a new PrismaClient per file
// will exhaust the database connection pool.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export default prisma;
