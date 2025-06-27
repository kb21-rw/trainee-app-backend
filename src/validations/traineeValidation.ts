import Joi from "joi"
import { Decision, TraineeStatus } from "../utils/types"

export const editTraineeSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().optional(),
  email: Joi.string().email().optional(),
  status: Joi.string()
    .valid(
      TraineeStatus.DROPPED_OUT,
      TraineeStatus.ENROLLED,
      TraineeStatus.GRADUATED,
      TraineeStatus.REJECTED,
    )
    .optional(),
  coachId: Joi.string().optional(),
})

export const decisionValidation = Joi.object({
  userId: Joi.string()
    .hex()
    .length(24)
    .message("userId is not valid")
    .required(),
  decision: Joi.string().valid(Decision.Accepted, Decision.Rejected).required(),
  feedback: Joi.string().min(0).required(),
})
