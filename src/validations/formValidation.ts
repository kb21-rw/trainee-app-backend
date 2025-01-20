import Joi from "joi"
import { FormType } from "../utils/types"
import { mongodbIdValidation } from "./generalValidation"

export const createFormValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(3).max(100),
  type: Joi.string()
    .valid(FormType.Application, FormType.Applicant, FormType.Trainee)
    .required(),
  startDate: Joi.when("type", {
    is: FormType.Application,
    then: Joi.date()
      .greater("now")
      .message("Start date should be sometime after now")
      .required(),
    otherwise: Joi.forbidden(),
  }),
  endDate: Joi.when("type", {
    is: FormType.Application,
    then: Joi.date()
      .greater(Joi.ref("startDate"))
      .message("End date should be after start date")
      .required(),
    otherwise: Joi.forbidden(),
  }),
  stages: Joi.when("type", {
    is: FormType.Application,
    then: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).required(),
          description: Joi.string(),
        }),
      )
      .min(1)
      .message("Add at least 1 stage"),
    otherwise: Joi.forbidden(),
  }),
})

export const updateFormValidation = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().min(3).max(100),
  startDate: Joi.date()
    .greater("now")
    .message("Start date should be sometime after now"),
  endDate: Joi.date()
    .greater(Joi.ref("startDate"))
    .message("End date should be after start date"),
  stages: Joi.array().items(
    Joi.object({
      id: mongodbIdValidation,
      name: Joi.string().min(1).required(),
      description: Joi.string(),
    }),
  ),
})
