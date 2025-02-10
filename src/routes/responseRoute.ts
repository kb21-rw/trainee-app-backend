import { Router } from "express"
import { verifyJWT } from "../middlewares/authenticate"
import { isAdminOrCoach, isProspect } from "../middlewares/authorization"
import {
  createApplicantResponse,
  createCoachResponse,
} from "../controllers/responseController"

const router = Router()

router.put("/?", verifyJWT, isAdminOrCoach, createCoachResponse)
router.post("/apply", verifyJWT, isProspect, createApplicantResponse)

export default router
