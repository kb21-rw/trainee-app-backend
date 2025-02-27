import { Response, Request, NextFunction } from "express"
import {
  createQuestionValidation,
  updateQuestionValidation,
} from "../validations/questionValidation"
import { Search } from "../utils/types"
import {
  createQuestionService,
  deleteQuestionService,
  getAllQuestionsService,
  updateQuestionService,
} from "../services/questionService"
import { isValidObjectId } from "mongoose"
import CustomError from "../middlewares/customError"
import { QUESTION_NOT_FOUND } from "../utils/errorCodes"

export const createQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { formId } = req.params
    await createQuestionValidation.validateAsync(req.body)
    const createdQuestion = await createQuestionService(formId, req.body)
    return res.status(201).json(createdQuestion)
  } catch (error) {
    return next(error)
  }
}

export const getAllQuestions = async (
  req: Request<object, object, object, Search>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const searchString = req.query.searchString || ""
    const typeQuery = req.query.typeQuery || ""
    const questions = await getAllQuestionsService(searchString, typeQuery)
    return res.status(200).json(questions)
  } catch (error) {
    return next(error)
  }
}

export const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { questionId } = req.params
    await updateQuestionValidation.validateAsync(req.body)
    const updatedQuestion = await updateQuestionService(questionId, req.body)
    return res.status(200).json(updatedQuestion)
  } catch (error) {
    return next(error)
  }
}

export const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { questionId } = req.params
    if (!isValidObjectId(questionId)) {
      throw new CustomError(QUESTION_NOT_FOUND, "Question not found!", 400)
    }

    await deleteQuestionService(questionId)
    return res.status(204).json({ message: "Question deleted successfully" })
  } catch (error) {
    return next(error)
  }
}
