import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { env } from "./config/env";

const app = express();

const allowedOrigins = [
  env.clientUrl.replace(/\/$/, ""),
  "http://localhost:3000",
  "https://collaboration-network.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app") ||
        cleanOrigin.includes("localhost")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// Root: a friendly pointer instead of a 404, since the API lives under /api.
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "RPCN API is running. Endpoints are served under /api.",
    health: "/api/health",
  });
});

app.use("/api", routes);

// Order matters: 404 handler, then error handler, always last.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
