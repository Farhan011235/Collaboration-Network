import { Router } from "express";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";
import taxonomyRoutes from "./taxonomy.routes";
import applicationRoutes from "./application.routes";
import taskRoutes from "./task.routes";
import milestoneRoutes from "./milestone.routes";
import workspaceRoutes from "./workspace.routes";
import discussionRoutes from "./discussion.routes";
import notificationRoutes from "./notification.routes";
import documentRoutes from "./document.routes";
import googleRoutes from "./google.routes";
import meetingRoutes from "./meeting.routes";
import recommendationRoutes from "./recommendation.routes";
import proposalRoutes from "./proposal.routes";
import analyticsRoutes from "./analytics.routes";
import publicationRoutes from "./publication.routes";
import reportRoutes from "./report.routes";
import portfolioRoutes from "./portfolio.routes";
import teamRoutes from "./team.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/taxonomy", taxonomyRoutes);
router.use("/applications", applicationRoutes);

// Module 1 - Research Portfolio Management (Nuzhat)
router.use("/portfolio", portfolioRoutes);

// Module 2 - Task & Milestone Management (Farhan)
router.use("/tasks", taskRoutes);
router.use("/milestones", milestoneRoutes);
router.use("/workspace", workspaceRoutes);

// Module 2 - Team Responsibility Management (Nuzhat)
router.use("/team", teamRoutes);

// Module 2 - Discussion Board & Notifications (Zunaid)
router.use("/discussions", discussionRoutes);
router.use("/notifications", notificationRoutes);

// Module 2 - Research Document Management (Fahad)
router.use("/documents", documentRoutes);

// Module 3 - Research Meeting Scheduler + Google Calendar (Shakib)
router.use("/google", googleRoutes);
router.use("/meetings", meetingRoutes);

// Module 3 - Project Recommendation System (Shakib)
router.use("/recommendations", recommendationRoutes);

// Module 3 - Proposal Quality Assistant / Gemini (Zunaid)
router.use("/proposals", proposalRoutes);

// Module 3 - Project Analytics Dashboard (Zunaid)
router.use("/analytics", analyticsRoutes);

// Module 3 - Academic Publication Search / OpenAlex (Fahad)
router.use("/publications", publicationRoutes);

// Module 3 - Project Report Generation (Fahad)
router.use("/reports", reportRoutes);

export default router;
