import Joi from "joi";

export const createCohortValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(3).max(100).optional(),
  stages: Joi.array().items(
    Joi.object({ title: Joi.string().min(1), description: Joi.string() })
  ),
});
