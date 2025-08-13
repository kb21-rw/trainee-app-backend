import dayjs from "dayjs"
import CustomError from "../middlewares/customError"
import Coach from "../models/Coach"
import Form, { IApplicationForm } from "../models/Form"
import Question, { IQuestion } from "../models/Question"
import { IResponse } from "../models/Response"
import Trainee from "../models/Trainee"
import User, { IUser } from "../models/User"
import {
  APPLICATION_FORM_ERROR,
  NOT_ALLOWED,
  QUESTION_NOT_FOUND,
  RESPONSE_NOT_FOUND,
  USER_NOT_FOUND,
} from "../utils/errorCodes"
import { getUserFormResponses, upsertResponse } from "../utils/helpers/response"
import {
  CreateApplicationResponseDto,
  CreateResponseDto,
  ICoach,
  Role,
  TraineeStatus,
  UserStatus,
} from "../utils/types"
import { getCohortService } from "./cohortService"

export const createCoachResponseService = async (
  loggedInUser: IUser,
  responseData: CreateResponseDto,
) => {
  const { questionId, userId, value } = responseData

  const currentCohort = await getCohortService({ isActive: true })

  const participant = await Trainee.findOne({
    $and: [{ userId: userId }],
  })

  if (
    !participant ||
    participant.cohortId.toString() !== currentCohort.id.toString()
  ) {
    throw new CustomError(
      USER_NOT_FOUND,
      "The user does not exist in the current cohort!",
      400,
    )
  }

  const coach: ICoach | null =
    loggedInUser.role === Role.Coach
      ? await Coach.findOne({ userId: loggedInUser.id })
      : null

  if (coach) {
    const participantStage = currentCohort.stages.find(
      (stage) => stage.id === participant.stage,
    )

    const isPreselectionStage = participantStage?.isPreselection === "true"
    const assignedCoachId = isPreselectionStage
      ? participant.preselectionCoachId
      : participant.postselectionCoachId

    const isAssignedCoach =
      coach.userId.toString() === assignedCoachId?.toString()

    if (!isAssignedCoach) {
      throw new CustomError(
        NOT_ALLOWED,
        "You can only edit applicants/trainees assigned to you.",
        403,
      )
    }
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

  const applicantExists = currentCohort.trainees.some(
    (traineeId) => traineeId.toString() === loggedInUser.id,
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

  const applicationForm = (await Form.findById(
    currentCohort.applicationForm,
  )) as IApplicationForm

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

    const prospect = await User.findById(loggedInUser.id) // we are sure the user exists since they are logged in

    prospect!.status = UserStatus.APPLIED
    await prospect!.save()
    const trainee = await Trainee.create({
      userId: prospect!.id,
      cohortId: currentCohort.id,
      status: TraineeStatus.ENROLLED,
      stage: currentCohort.stages[0].id,
    })
    currentCohort.trainees.push(trainee.id)
    await currentCohort.save()
  }

  return userFormResponses
}
