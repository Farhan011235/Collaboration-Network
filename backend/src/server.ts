import app from "./app";
import { env } from "./config/env";
import prisma from "./config/prisma";

// Serverless Postgres (Neon) suspends its compute when idle, so the very
// first connection after a pause can time out while the database wakes up
// (Prisma P1001). Retry a few times with backoff instead of giving up.
const connectWithRetry = async (attempts = 5) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await prisma.$connect();
      console.log("Database connected");
      return;
    } catch (error: any) {
      const isUnreachable = error?.errorCode === "P1001";
      if (!isUnreachable || attempt === attempts) throw error;
      const waitMs = attempt * 2000;
      console.warn(
        `Database unreachable (attempt ${attempt}/${attempts}) - it may be waking up. Retrying in ${waitMs / 1000}s...`
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
};

const start = async () => {
  try {
    await connectWithRetry();

    const server = app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Error: Port ${env.port} is already in use.`);
        console.error(`Run 'npx kill-port ${env.port}' or 'kill -9 $(lsof -t -i:${env.port})' to free the port.`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
