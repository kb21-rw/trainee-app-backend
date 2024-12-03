import Joi from "joi";
import { mongodbIdValidation } from "./generalValidation";

export const createCoachResponseValidation = Joi.object({
  userId: mongodbIdValidation,
  questionId: mongodbIdValidation,
  value: Joi.alternatives().try(
    Joi.array().items(Joi.string().min(1).required()),
    Joi.string().min(1).required()
  ),
});

export const createApplicantResponseValidation = Joi.array().items(
  Joi.object({
    questionId: Joi.string()
      .hex()
      .length(24)
      .message("A questionId is not valid"),
    answer: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string().min(0),
    ),
  })
);
