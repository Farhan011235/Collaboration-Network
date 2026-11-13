import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { env } from "./config/env";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
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
