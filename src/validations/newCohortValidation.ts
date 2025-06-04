import Joi from "joi"
import { Decision } from "../utils/types"

export const createNewCohortValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(3).max(100).optional(),
  stages: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1),
        order: Joi.number().required(),
        isPreselection: Joi.boolean().required(),
        isCurrent: Joi.boolean().required(),
      }),
    )
    .min(1)
    .message("Add at least 1 stage"),
  cohortNumber: Joi.string().min(1).max(100).required(),
  isActive: Joi.boolean().required(),
  startDate: Joi.date().min("now").required(),
  endDate: Joi.date().min(Joi.ref("startDate")).required(),
})

export const updateCohortValidation = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().min(3).max(100),
  startDate: Joi.date()
    .min("now")
    .message("Training start date must be in the future"),
  endDate: Joi.date()
    .min(Joi.ref("startDate"))
    .message("Training end date must be after start date"),
  currentStage: Joi.string().min(1).max(100),
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
