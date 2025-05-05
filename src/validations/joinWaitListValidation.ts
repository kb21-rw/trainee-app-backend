import Joi from "joi"

// responses left in lowercase for smoother integration with Apps Script

export const joinWaitListFormValidation = Joi.object({
  timestamp: Joi.string().isoDate().required(),
  responses: Joi.object({
    firstname: Joi.string().min(1).max(50),
    lastname: Joi.string().min(1).max(50),
    email: Joi.string().email(),
  }).required(),
})
