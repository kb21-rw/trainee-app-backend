import Joi from "joi"
import { Decision } from "../utils/types"
import {
  requiredMongodbIdValidation,
  stageValidation,
} from "./generalValidation"

export const createCohortValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(3).max(100).optional(),
  stages: Joi.array()
    .items(Joi.object({ name: Joi.string().min(1), description: Joi.string() }))
    .min(1)
    .message("Add at least 1 stage"),
  trainingStartDate: Joi.date().min("now").required(),
})

export const updateCohortValidation = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().min(3).max(100),
  trainingStartDate: Joi.date()
    .min("now")
    .message("Training start date must be in the future"),
  stages: Joi.array().items(stageValidation),
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

export const addApplicantsSchema = Joi.object({
  prospectIds: Joi.array()
    .items(requiredMongodbIdValidation)
    .min(1)
    .message("Add at least 1 participant")
    .required(),
})
