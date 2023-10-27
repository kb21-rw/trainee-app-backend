import { Response, Request } from "express";
import { createQuestionValidation } from "../validations/questionValidation";
import Form from "../models/Form";
import Question from "../models/Question";
import { CreateQuestionType } from "../utils/types";
import { ValidationResult } from "joi";

export const createQuestion = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const validationResult: ValidationResult<CreateQuestionType> =
      createQuestionValidation.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({ message: validationResult.error.message });
    }

    const { title, type, options }: CreateQuestionType = req.body;

    const relatedForm = await Form.findById(formId);
    if (!relatedForm) {
      return res.status(404).json({ error: "That form is not found." });
    }

    const createQuestion = await Question.create({ title, type, options });
    if (createQuestion) {
      relatedForm.questionsId.push(createQuestion._id);
    }

    await relatedForm.save();

    return res.status(201).json(createQuestion);
  } catch (error) {
    return res.status(400).json({ error });
  }
};
