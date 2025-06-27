import { Router } from "express"
import {
  getTrainees,
  updateTrainee,
  getTraineesForCoach,
  decisionController,
} from "../controllers/traineeController"
import { verifyJWT } from "../middlewares/authenticate"

const router = Router()
router.get("/", verifyJWT, getTrainees)
router.get("/my-trainees", verifyJWT, getTraineesForCoach)
router.patch("/decision", verifyJWT, decisionController)
router.patch("/:id", verifyJWT, updateTrainee)
export default router
