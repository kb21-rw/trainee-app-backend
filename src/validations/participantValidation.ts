import Joi from "joi"
import { mongodbIdValidation } from "./generalValidation"
import { Role } from "../utils/types"

export const updateParticipantSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().optional(),
  email: Joi.string().email().optional(),
  coach: Joi.alternatives().try(mongodbIdValidation.optional(), null),
  verified: Joi.boolean().optional(),
  role: Joi.string()
    .valid(Role.Admin, Role.Coach, Role.Trainee, Role.Applicant)
    .optional(),
})
