import CustomError from "../middlewares/customError"
import Cohort, { ICohort, IParticipant } from "../models/Cohort"
import { getCohortsQuery } from "../queries/cohortQueries"
import {
  COHORT_NOT_FOUND,
  FORM_NOT_FOUND,
  NOT_ALLOWED,
  USER_NOT_FOUND,
} from "../utils/errorCodes"
import {
  AddApplicantsDto,
  CreateCohortDto,
  Decision,
  DecisionDto,
  ICohortOverviewRequest,
  Role,
  UpdateCohortDto,
} from "../utils/types"
import { updateStagesHandler } from "../utils/helpers/cohort"
import { createStagesHandler } from "../utils/helpers"
import { getCompleteForm } from "../utils/helpers/forms"
import { getUserService, getUsersService } from "./userService"
import { getCohortOverviewQuery } from "../queries/cohortQueries"
import { getFormService } from "./formService"
import User, { IUser } from "../models/User"
import { IApplicationForm } from "../models/Form"
import { getUserFormResponsesQuery } from "../queries/responseQueries"
import dayjs from "dayjs"

export const getCohortService = async (query: object) => {
  const cohort = await Cohort.findOne<ICohort>(query)
  if (!cohort) {
    throw new CustomError(COHORT_NOT_FOUND, "Cohort not found", 404)
  }

  return cohort
}

export const getCohortsService = async (searchString: string) => {
  return await getCohortsQuery(searchString)
}

export const createCohortService = async (cohortData: CreateCohortDto) => {
  await Cohort.updateOne({ isActive: true }, { isActive: false })

  const newCohort = await Cohort.create({
    ...cohortData,
    stages: createStagesHandler(cohortData.stages),
  })

  return newCohort
}

export const updateCohortService = async (
  cohortId: string,
  formData: UpdateCohortDto,
) => {
  const { name, description, stages, trainingStartDate } = formData

  const cohort = await Cohort.findById(cohortId)
  if (!cohort) {
    throw new CustomError(COHORT_NOT_FOUND, "Cohort not found", 404)
  }

  if (name) {
    cohort.name = name
  }

  if (description !== undefined) {
    cohort.description = description
  }

  if (trainingStartDate) {
    cohort.trainingStartDate = dayjs(trainingStartDate).toISOString()
  }

  if (stages) {
    cohort.stages = updateStagesHandler(cohort.stages, stages)
  }

  return await cohort.save()
}

export const getApplicationFormService = async () => {
  const currentCohort = await getCohortService({ isActive: true })

  const applicationForm = (await getFormService({
    _id: currentCohort.applicationForm,
  })) as IApplicationForm

  return await getCompleteForm(applicationForm)
}

export const getMyApplicationService = async (loggedInUserId: string) => {
  const currentCohort = await getCohortService({ isActive: true })

  if (!currentCohort.applicationForm) {
    return null
  }

  const applicationForm = await getFormService({
    _id: currentCohort.applicationForm,
  })

  const completeForm = await getUserFormResponsesQuery(
    applicationForm.id,
    loggedInUserId,
  )

  return {
    ...completeForm,
    trainingStartDate: currentCohort.trainingStartDate,
  }
}

export const getParticipantIndex = (userId: string, users: IParticipant[]) => {
  const userIndex = users.findIndex((user) => user.id.toString() === userId)

  if (userIndex === -1) {
    throw new CustomError(
      USER_NOT_FOUND,
      `Can't find that applicant/trainee in the current cohort`,
      404,
    )
  }

  return userIndex
}

export const acceptParticipantService = async (
  cohort: ICohort,
  user: IUser,
  feedback: string,
  cohortProperty: "trainees" | "applicants",
) => {
  const participantIndex = getParticipantIndex(user.id, cohort[cohortProperty])
  const participant = cohort[cohortProperty][participantIndex]
  const droppedStageId = participant.droppedStage.id
  const applicationForm = (await getFormService({
    _id: cohort.applicationForm,
  })) as IApplicationForm
  const stages =
    cohortProperty === "applicants" ? applicationForm.stages : cohort.stages
  const numberOfStages = stages.length

  if (participant.droppedStage.isConfirmed) {
    throw new CustomError(
      NOT_ALLOWED,
      `The ${user.name} was rejected already`,
      403,
    )
  }

  // If user is on the last stage
  if (stages[numberOfStages - 1].id === droppedStageId) {
    if (user.role === Role.Applicant) {
      cohort.trainees.push({
        id: user.id,
        passedStages: [],
        droppedStage: { id: cohort.stages[0].id, isConfirmed: false },
        feedbacks: [],
      })
      cohort.stages[0].participantsCount += 1
      user.role = Role.Trainee
      await user.save()
    } else {
      // if participant is a trainee
      if (participant.passedStages.includes(droppedStageId)) {
        throw new CustomError(
          NOT_ALLOWED,
          `${user.name} had already passed the last stage of '${cohort.name}' cohort`,
          403,
        )
      }
    }
  } else {
    const currentStageIndex = stages.findIndex(
      (stage) => stage.id === droppedStageId,
    )
    participant.droppedStage.id = stages[currentStageIndex + 1].id

    // updated then number of participants in the next stage
    if (user.role === Role.Applicant) {
      applicationForm.stages[currentStageIndex + 1].participantsCount += 1
      await applicationForm.save()
    }

    if (user.role === Role.Trainee) {
      cohort.stages[currentStageIndex + 1].participantsCount += 1
    }
  }

  participant.passedStages.push(droppedStageId)
  participant.feedbacks.push({ stageId: droppedStageId, text: feedback })

  cohort[cohortProperty][participantIndex] = participant

  await cohort.save()

  return {
    user: user.id,
    message: `${user.name} was accepted successfully!`,
  }
}

export const rejectParticipantService = async (
  cohort: ICohort,
  user: IUser,
  feedback: string,
  cohortProperty: "trainees" | "applicants",
) => {
  const participantIndex = getParticipantIndex(user.id, cohort[cohortProperty])
  const participant = cohort[cohortProperty][participantIndex]
  const droppedStageId = participant.droppedStage.id

  if (participant.droppedStage.isConfirmed) {
    throw new CustomError(
      NOT_ALLOWED,
      `The ${user.name} was rejected already`,
      403,
    )
  }

  if (participant.passedStages.includes(droppedStageId)) {
    throw new CustomError(
      NOT_ALLOWED,
      `${user.name} had already passed the last stage of '${cohort.name}' cohort`,
      403,
    )
  }

  participant.droppedStage.isConfirmed = true
  participant.feedbacks.push({ stageId: droppedStageId, text: feedback })

  cohort[cohortProperty][participantIndex] = participant

  await cohort.save()

  return {
    user: user.id,
    message: `${user.name} was rejected successfully!`,
  }
}

export const decisionService = async (body: DecisionDto) => {
  const { userId, decision, feedback } = body
  const currentCohort = await getCohortService({ isActive: true })
  const user = await getUserService({ _id: userId })

  if (decision === Decision.Accepted) {
    if (user.role === Role.Applicant) {
      return await acceptParticipantService(
        currentCohort,
        user,
        feedback,
        "applicants",
      )
    }

    return await acceptParticipantService(
      currentCohort,
      user,
      feedback,
      "trainees",
    )
  } else {
    if (user.role === Role.Applicant) {
      return await rejectParticipantService(
        currentCohort,
        user,
        feedback,
        "applicants",
      )
    }

    return await rejectParticipantService(
      currentCohort,
      user,
      feedback,
      "trainees",
    )
  }
}

export const getCohortOverviewService = async ({
  cohortId,
  overviewType,
  coachId,
}: ICohortOverviewRequest) => {
  const cohortOverview = await getCohortOverviewQuery({
    cohortId: cohortId ?? (await getCohortService({ isActive: true }))._id,
    overviewType,
    coachId,
  })

  return cohortOverview
}

export const addApplicantsService = async (body: AddApplicantsDto) => {
  const { prospectIds } = body
  const currentCohort = await getCohortService({ isActive: true })
  const users = await getUsersService({ _id: { $in: prospectIds } })

  if (!currentCohort.applicationForm) {
    throw new CustomError(FORM_NOT_FOUND, "Application form not found", 404)
  }

  const applicationForm = (await getFormService({
    _id: currentCohort.applicationForm,
  })) as IApplicationForm

  users.forEach((user) => {
    if (user.role !== Role.Prospect) {
      throw new CustomError(
        NOT_ALLOWED,
        "Only prospects can be added to a cohort",
        403,
      )
    }

    currentCohort.applicants.push({
      id: user._id,
      passedStages: [],
      droppedStage: {
        id: applicationForm.stages[0].id,
        isConfirmed: false,
      },
      feedbacks: [],
    })
  })

  await currentCohort.save()

  return await User.updateMany(
    { _id: { $in: prospectIds } },
    { role: Role.Applicant },
  )
}
