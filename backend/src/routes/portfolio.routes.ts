import { Router } from "express";
import * as portfolioController from "../controllers/portfolio.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  addInterestSchema,
  addSkillSchema,
  educationSchema,
  experienceSchema,
  importPublicationSchema,
  publicationSchema,
  updateEducationSchema,
  updateExperienceSchema,
  updateProfileSchema,
  updatePublicationSchema,
} from "../validators/portfolio.validator";

const router = Router();

// Everything here is portfolio work, so it always needs a signed-in user.
router.use(authenticate);

// My own portfolio. "me" is declared before "/user/:userId" for clarity.
router.get("/me", portfolioController.getMyPortfolio);
router.get("/user/:userId", portfolioController.getUserPortfolio);

// Profile fields (bio, institution, ORCID, website, availability).
router.patch(
  "/profile",
  validate(updateProfileSchema),
  portfolioController.updateProfile
);

// Skills
router.post("/skills", validate(addSkillSchema), portfolioController.addSkill);
router.delete("/skills/:skillId", portfolioController.removeSkill);

// Research interests
router.post(
  "/interests",
  validate(addInterestSchema),
  portfolioController.addInterest
);
router.delete("/interests/:interestId", portfolioController.removeInterest);

// Academic background
router.post(
  "/education",
  validate(educationSchema),
  portfolioController.addEducation
);
router.patch(
  "/education/:id",
  validate(updateEducationSchema),
  portfolioController.updateEducation
);
router.delete("/education/:id", portfolioController.deleteEducation);

// Publications. "import" comes before "/:id" so it isn't read as an id.
router.post(
  "/publications/import",
  validate(importPublicationSchema),
  portfolioController.importPublication
);
router.post(
  "/publications",
  validate(publicationSchema),
  portfolioController.addPublication
);
router.patch(
  "/publications/:id",
  validate(updatePublicationSchema),
  portfolioController.updatePublication
);
router.delete("/publications/:id", portfolioController.deletePublication);

// Previous project experience (outside this platform)
router.post(
  "/experiences",
  validate(experienceSchema),
  portfolioController.addExperience
);
router.patch(
  "/experiences/:id",
  validate(updateExperienceSchema),
  portfolioController.updateExperience
);
router.delete("/experiences/:id", portfolioController.deleteExperience);

export default router;
