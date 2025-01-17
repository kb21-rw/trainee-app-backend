import CustomError from "../middlewares/customError"
import Question, { IQuestion } from "../models/Question"
import {
  CreateApplicationResponseDto,
  CreateResponseDto,
  Role,
} from "../utils/types"
import { IResponse } from "../models/Response"
import User, { IUser } from "../models/User"
import {
  NOT_ALLOWED,
  QUESTION_NOT_FOUND,
  USER_NOT_FOUND,
  APPLICATION_FORM_ERROR,
  RESPONSE_NOT_FOUND,
} from "../utils/errorCodes"
import dayjs from "dayjs"
import { getUserFormResponses, upsertResponse } from "../utils/helpers/response"
import { getCohortService } from "./cohortService"
import { isUserInCohort } from "../utils/helpers/cohort"
import { getFormService } from "./formService"
import { IApplicationForm } from "../models/Form"

export const createCoachResponseService = async (
  loggedInUser: IUser,
  responseData: CreateResponseDto,
) => {
  const { questionId, userId, value } = responseData

  const currentCohort = await getCohortService({ isActive: true })

  const participant = await User.findOne({
    $and: [
      { _id: userId },
      { $or: [{ role: Role.Trainee }, { role: Role.Applicant }] },
    ],
  })

  if (
    !participant ||
    !isUserInCohort(currentCohort, participant.id, participant.role)
  ) {
    throw new CustomError(
      USER_NOT_FOUND,
      "The user does not exist in the current cohort!",
      400,
    )
  }

  if (
    loggedInUser.role !== Role.Admin &&
    loggedInUser.id !== participant.coach?.toString()
  ) {
    throw new CustomError(
      NOT_ALLOWED,
      "Only admin or the coach of a trainee/applicant can provide a response",
      403,
    )
  }

  const relatedQuestion = await Question.findById<IQuestion>(questionId)

  if (!relatedQuestion) {
    throw new CustomError(
      QUESTION_NOT_FOUND,
      "The question you're responding to does not exist!",
      400,
    )
  }

  return upsertResponse(relatedQuestion, value, userId)
}

export const createApplicantResponseService = async (
  loggedInUser: IUser,
  responseData: CreateApplicationResponseDto[],
  submit: boolean = false,
) => {
  const currentCohort = await getCohortService({ isActive: true })

  const applicantExists = currentCohort.applicants.some(
    (applicant) => applicant.id.toString() === loggedInUser.id,
  )

  if (applicantExists) {
    throw new CustomError(
      APPLICATION_FORM_ERROR,
      "Your application form has already been received, please wait for a response",
      409,
    )
  }

  if (!currentCohort.applicationForm) {
    throw new CustomError(NOT_ALLOWED, "There is no open application", 404)
  }

  const applicationForm = (await getFormService({
    _id: currentCohort.applicationForm,
  })) as IApplicationForm

  const now = dayjs()
  const applicationStartDate = dayjs(applicationForm.startDate)
  const applicationEndDate = dayjs(applicationForm.endDate)

  if (now.isBefore(applicationStartDate)) {
    throw new CustomError(
      APPLICATION_FORM_ERROR,
      "Applications are not open yet!",
      401,
    )
  }

  if (now.isAfter(applicationEndDate)) {
    throw new CustomError(
      APPLICATION_FORM_ERROR,
      "Application deadline has passed!",
      401,
    )
  }

  const questionsNotFound = responseData.some(
    (data) =>
      !applicationForm.questionIds
        .map((questionId) => questionId.toString())
        .includes(data.questionId),
  )

  if (questionsNotFound) {
    throw new CustomError(
      QUESTION_NOT_FOUND,
      "You can only answer questions in the form",
      404,
    )
  }

  // Create or update a response if already exists
  await Promise.all(
    responseData.map(async (response) => {
      const question = await Question.findById<IQuestion>(response.questionId)
        .populate<{
          responseIds: IResponse[]
        }>("responseIds")
        .exec()

      if (!question)
        throw new CustomError(
          QUESTION_NOT_FOUND,
          "Question was not found!",
          404,
        )

      return await upsertResponse(question, response.answer, loggedInUser.id)
    }),
  )

  // get responses of loggedIn user
  const userFormResponses = await getUserFormResponses(
    applicationForm,
    loggedInUser.id,
  )

  if (submit) {
    userFormResponses.questions.forEach(({ required, response, prompt }) => {
      if (required && !response) {
        throw new CustomError(
          RESPONSE_NOT_FOUND,
          `'${prompt}' is required`,
          404,
        )
      }
    })

    const prospect = await User.findById(loggedInUser.id)
    // This should not be possible because loggedInUser is from the middleware that fetched the user
    if (!prospect) {
      throw new CustomError(USER_NOT_FOUND, "User not found", 404)
    }

    prospect.role = Role.Applicant

    currentCohort.applicants.push({
      id: loggedInUser.id,
      passedStages: [],
      droppedStage: {
        id: applicationForm.stages[0].id,
        isConfirmed: false,
      },
      feedbacks: [],
    })

    await prospect.save()
    await currentCohort.save()
  }

  return userFormResponses
}
