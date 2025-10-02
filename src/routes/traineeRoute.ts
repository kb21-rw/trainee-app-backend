import { Router } from "express"
import {
  getTrainees,
  updateTrainee,
  getTraineesForCoach,
  decisionController,
} from "../controllers/traineeController"
import { verifyJWT } from "../middlewares/authenticate"
import { isAdminOrCoach } from "../middlewares/authorization"

const router = Router()
router.get("/", verifyJWT, getTrainees)
router.get("/my-trainees", verifyJWT, getTraineesForCoach)
router.patch("/decision", verifyJWT, decisionController)
router.patch("/:id", verifyJWT, isAdminOrCoach, updateTrainee)
export default router
