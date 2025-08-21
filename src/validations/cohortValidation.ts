import Joi from "joi"
import { Decision } from "../utils/types"

export const createCohortValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(3).max(100).optional(),
  stages: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1),
        description: Joi.string().min(3).max(100).optional(),
        isPreselection: Joi.string().required(),
      }),
    )
    .min(1)
    .message("Add at least 1 stage")
    .required(),
  startDate: Joi.date().min("now").required(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional(),
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
  stages: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1),
        description: Joi.string().min(3).max(100).optional(),
        isPreselection: Joi.string().required(),
      }),
    )
    .min(1),
})

export const decisionValidation = Joi.object({
  traineeId: Joi.string()
    .hex()
    .length(24)
    .message("userId is not valid")
    .required(),
  decision: Joi.string().valid(Decision.Accepted, Decision.Rejected).required(),
  feedback: Joi.string().min(3).required().messages({
    "string.base": "Feedback must be a string",
    "string.empty": "Please add feedback before you proceed",
    "any.required": "Feedback is required",
  }),
})
