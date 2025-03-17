import Joi from "joi"

// responses left in lowercase for smoother integration with Apps Script

export const joinWaitListFormValidation = Joi.object({
  respondentEmail: Joi.alternatives()
    .try(Joi.string().email(), Joi.string().min(1))
    .required(),
  timestamp: Joi.string().isoDate().required(),
  responses: Joi.object({
    email: Joi.string().email(),
    firstname: Joi.string().min(1).max(50),
    lastname: Joi.string().min(1).max(50),
  }).required(),
})
