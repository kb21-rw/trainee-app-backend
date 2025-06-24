import Joi from "joi"
import { TraineeStatus } from "../utils/types"

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
