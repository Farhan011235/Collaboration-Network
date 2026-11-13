import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate, notificationController.listNotifications);

// Literal routes before "/:id/..." so they aren't read as an id.
router.get("/unread-count", authenticate, notificationController.getUnreadCount);
router.patch("/read-all", authenticate, notificationController.markAllRead);

router.patch("/:id/read", authenticate, notificationController.markRead);

export default router;
