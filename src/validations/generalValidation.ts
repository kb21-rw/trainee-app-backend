import Joi from "joi"

export const mongodbIdValidation = Joi.string()
  .hex()
  .length(24)
  .message("Invalid document Id")

export const requiredMongodbIdValidation = Joi.string()
  .hex()
  .length(24)
  .message("Invalid document Id")
  .required()

export const stageValidation = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().min(0).required(),
})
