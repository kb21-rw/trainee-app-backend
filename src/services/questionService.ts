import CustomError from "../middlewares/customError"
import Form from "../models/Form"
import Question from "../models/Question"
import Response from "../models/Response"
import { FORM_NOT_FOUND, QUESTION_NOT_FOUND } from "../utils/errorCodes"
import {
  CreateQuestionDto,
  IQuestion,
  QuestionType,
  UpdateQuestionDto,
} from "../utils/types"

export const createQuestionService = async (
  formId: string,
  questionData: CreateQuestionDto,
) => {
  const relatedForm = await Form.findById(formId)
  if (!relatedForm) {
    throw new CustomError(FORM_NOT_FOUND, "Form not found", 404)
  }

  const createdQuestion = await Question.create(questionData)
  relatedForm.questionIds.push(createdQuestion.id)
  await createdQuestion.save()

  return await relatedForm.save()
}

export const getAllQuestionsService = async (
  searchString: string,
  typeQuery: string,
) => {
  const questions: IQuestion[] = await Question.find({
    title: { $regex: searchString, $options: "i" },
    type: { $regex: typeQuery, $options: "i" },
  })
  return questions
}

export const updateQuestionService = async (
  questionId: string,
  { prompt, type, options }: UpdateQuestionDto,
) => {
  const question = await Question.findById(questionId)
  if (!question) {
    throw new CustomError(QUESTION_NOT_FOUND, "Question not found", 404)
  }

  if (prompt) question.prompt = prompt

  if (type) question.type = type

  if (options) question.options = options

  if (type === QuestionType.Text) question.options = []

  await Response.updateMany(
    { _id: { $in: question.responseIds } },
    { text: null },
  )

  return await question.save()
}

export const deleteQuestionService = async (questionId: string) => {
  const question = await Question.findByIdAndDelete(questionId)

  if (!question) {
    throw new CustomError(QUESTION_NOT_FOUND, "Question not found!", 400)
  }

  await Form.updateOne(
    {
      questionIds: question.id,
    },
    { $pull: { questionIds: question.id } },
  )

  await Response.deleteMany({ _id: { $in: question.responseIds } })
}
