import CustomError from "../middlewares/customError"
import Cohort, { ICohort } from "../models/Cohort"
import { getCohortsQuery } from "../queries/cohortQueries"
import {
  COHORT_NOT_FOUND,
  FORM_NOT_FOUND,
  NOT_ALLOWED,
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
import {
  acceptUserHandler,
  rejectUserHandler,
  updateStagesHandler,
} from "../utils/helpers/cohort"
import { createStagesHandler } from "../utils/helpers"
import { getCompleteForm } from "../utils/helpers/forms"
import { getUserFormResponses } from "../utils/helpers/response"
import { getUserService, getUsersService } from "./userService"
import { getCohortOverviewQuery } from "../queries/cohortQueries"
import { getFormService } from "./formService"
import User from "../models/User"
import { IApplicationForm } from "../models/Form"

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
  const { name, description, stages } = formData

  const cohort = await Cohort.findById(cohortId)
  if (!cohort) {
    throw new CustomError(COHORT_NOT_FOUND, "Cohort not found", 404)
  }

  if (name) {
    cohort.name = name
  }

  if (description) {
    cohort.description = description
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

  const completeForm = await getUserFormResponses(
    applicationForm,
    loggedInUserId,
  )

  return {
    ...completeForm,
    trainingStartDate: currentCohort.trainingStartDate,
  }
}

export const decisionService = async (body: DecisionDto) => {
  const { userId, decision, feedback } = body
  const currentCohort = await getCohortService({ isActive: true })
  const user = await getUserService({ _id: userId })

  if (decision === Decision.Accepted) {
    if (user.role === Role.Applicant) {
      return await acceptUserHandler(
        currentCohort,
        user,
        feedback,
        "applicants",
      )
    }

    return await acceptUserHandler(currentCohort, user, feedback, "trainees")
  } else {
    if (user.role === Role.Applicant) {
      return await rejectUserHandler(
        currentCohort,
        user,
        feedback,
        "applicants",
      )
    }

    return await rejectUserHandler(currentCohort, user, feedback, "trainees")
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
