import { Router } from "express";
import * as googleController from "../controllers/google.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Connection status + starting the consent flow (both need a signed-in user).
router.get("/status", authenticate, googleController.getStatus);
router.get("/auth-url", authenticate, googleController.getAuthUrl);

// The OAuth callback is a redirect from Google, so it carries no JWT - the
// signed `state` proves who it is instead.
router.get("/callback", googleController.handleCallback);

router.delete("/disconnect", authenticate, googleController.disconnect);

export default router;
