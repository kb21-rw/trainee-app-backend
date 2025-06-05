import { Router } from "express"
import { verifyJWT } from "../middlewares/authenticate"
import { isAdmin, isAdminOrCoach } from "../middlewares/authorization"
import {
  createCohortController,
  getCohortController,
  getCohortsController,
  updateCohortController,
} from "../controllers/newCohortController"

const router = Router()

router.get("/", verifyJWT, isAdminOrCoach, getCohortsController)
router.get("/:cohortId", verifyJWT, isAdmin, getCohortController)

router.post("/", verifyJWT, isAdmin, createCohortController)

router.patch("/:cohortId", verifyJWT, isAdmin, updateCohortController)

export default router
