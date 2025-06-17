import { Router } from "express"
import { verifyJWT } from "../middlewares/authenticate"
import {
  isAdmin,
  isAdminOrCoach,
  isAuthorized,
} from "../middlewares/authorization"
import {
  createCohortController,
  getApplicationFormController,
  getCohortController,
  getCohortsController,
  getMyApplicationController,
  updateCohortController,
} from "../controllers/newCohortController"
import { Role } from "../utils/types"

const router = Router()

router.post("/", verifyJWT, isAdmin, createCohortController)
router.get("/", verifyJWT, isAdminOrCoach, getCohortsController)
router.get("/application", verifyJWT, isAdmin, getApplicationFormController)
router.get(
  "/my-application",
  verifyJWT,
  isAuthorized([Role.Applicant, Role.Prospect]),
  getMyApplicationController,
)
router.get("/:cohortId", verifyJWT, isAdmin, getCohortController)
router.patch("/:cohortId", verifyJWT, isAdmin, updateCohortController)

export default router
