import { Router } from "express"
import {
  addCoachToCohortController,
  getCoachesController,
  updateCoachOrAdmin,
  createCoachController,
} from "../controllers/coachController"
import { verifyJWT } from "../middlewares/authenticate"
import { isAdmin } from "../middlewares/authorization"

const router = Router()

router.get("/", verifyJWT, isAdmin, getCoachesController)
router.patch("/edit-coach-or-admin/:id", verifyJWT, updateCoachOrAdmin)
router.post("/", verifyJWT, isAdmin, addCoachToCohortController)

router.post("/new", verifyJWT, isAdmin, createCoachController)

export default router
