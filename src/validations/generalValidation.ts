import Joi from "joi";

export const mongodbIdValidation = Joi.string()
  .hex()
  .length(24)
  .message("Invalid document Id");

export const requiredMongodbIdValidation = Joi.string()
  .hex()
  .length(24)
  .message("Invalid document Id")
  .required();
