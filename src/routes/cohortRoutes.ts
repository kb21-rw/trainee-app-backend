import { Router } from "express";
import { verifyJWT } from "../middlewares/authenticate";
import {
  isAdmin,
  isAdminOrCoach,
  isProspect,
} from "../middlewares/authorization";
import {
  createCohortController,
  decisionController,
  getApplicationFormController,
  getCohortController,
  getCohortOverviewController,
  getCohortsController,
  getMyApplicationController,
  updateCohortController,
} from "../controllers/cohortControllers";

const router = Router();

router.get("/application", verifyJWT, isAdmin, getApplicationFormController);
router.get(
  "/my-application",
  verifyJWT,
  isProspect,
  getMyApplicationController
);
router.get("/", verifyJWT, isAdmin, getCohortsController);
router.get("/:cohortId", verifyJWT, isAdmin, getCohortController);
router.get(
  "/:cohortId/overview",
  verifyJWT,
  isAdminOrCoach,
  getCohortOverviewController
);

router.post("/", verifyJWT, isAdmin, createCohortController);

router.patch("/decision", verifyJWT, isAdmin, decisionController);
router.patch("/:cohortId", verifyJWT, isAdmin, updateCohortController);

export default router;
