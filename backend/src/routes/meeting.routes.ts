import { Router } from "express";
import * as meetingController from "../controllers/meeting.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectMember } from "../middlewares/membership.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createMeetingSchema,
  updateMeetingSchema,
} from "../validators/meeting.validator";

const router = Router();

// Project-scoped: ":projectId" gates on membership.
router.get(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  meetingController.listMeetings
);

// No requireProjectMember here on purpose: the controller has to read the
// member list anyway to build the invite list, and it checks membership from
// that same result instead of paying for a second query.
router.post(
  "/project/:projectId",
  authenticate,
  validate(createMeetingSchema),
  meetingController.createMeeting
);

// Meeting-scoped: membership re-checked inside the controller.
router.post("/:id/sync", authenticate, meetingController.syncMine);

router.patch(
  "/:id",
  authenticate,
  validate(updateMeetingSchema),
  meetingController.updateMeeting
);

router.delete("/:id", authenticate, meetingController.deleteMeeting);

export default router;
