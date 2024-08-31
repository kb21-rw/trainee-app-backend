import Joi from "joi";
import { QuestionType } from "../utils/types";

export const createQuestionValidation = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  type: Joi.string()
    .valid(
      QuestionType.Text,
      QuestionType.SingleSelect,
      QuestionType.MultiSelect
    )
    .required(),
  isRequired: Joi.boolean(),
  options: Joi.array()
    .items(Joi.string())
    .when("type", {
      is: Joi.valid(QuestionType.SingleSelect, QuestionType.MultiSelect),
      then: Joi.array().items(Joi.string()).min(1).required(),
      otherwise: Joi.array().items(Joi.string()).optional(),
    }),
});

export const updateQuestionValidation = Joi.object({
  title: Joi.string().min(3).max(100),
  type: Joi.string().valid(
    QuestionType.Text,
    QuestionType.SingleSelect,
    QuestionType.MultiSelect
  ),
  options: Joi.array()
    .items(Joi.string())
    .when("type", {
      is: Joi.valid(QuestionType.SingleSelect, QuestionType.MultiSelect),
      then: Joi.array().items(Joi.string()).min(1).required(),
      otherwise: Joi.array().items(Joi.string()).optional(),
    }),
});
