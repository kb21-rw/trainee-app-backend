import { Router } from "express"
import { verifyJWT } from "../middlewares/authenticate"
import {
  isAdmin,
  isAdminOrCoach,
  isAuthorized,
} from "../middlewares/authorization"
import {
  addApplicantsController,
  createCohortController,
  decisionController,
  getApplicationFormController,
  getCohortController,
  getCohortOverviewController,
  getCohortsController,
  getMyApplicationController,
  updateCohortController,
} from "../controllers/cohortControllers"
import { Role } from "../utils/types"

const router = Router()

router.get("/application", verifyJWT, isAdmin, getApplicationFormController)
router.get(
  "/my-application",
  verifyJWT,
  isAuthorized([Role.Prospect, Role.Applicant]),
  getMyApplicationController,
)
router.get("/", verifyJWT, isAdmin, getCohortsController)
router.get("/overview", verifyJWT, isAdminOrCoach, getCohortOverviewController)
router.get("/:cohortId", verifyJWT, isAdmin, getCohortController)

router.post("/", verifyJWT, isAdmin, createCohortController)

router.patch("/decision", verifyJWT, isAdmin, decisionController)
router.patch("/add-applicants", verifyJWT, isAdmin, addApplicantsController)
router.patch("/:cohortId", verifyJWT, isAdmin, updateCohortController)

export default router
