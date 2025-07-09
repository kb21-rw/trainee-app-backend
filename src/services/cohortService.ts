import CustomError from "../middlewares/customError"
import Cohort, { ICohort } from "../models/Cohort"
import { COHORT_BAD_REQUEST, COHORT_NOT_FOUND } from "../utils/errorCodes"
import {
  CreateCohortDto,
  ICohortOverviewRequest,
  UpdateCohortDto,
} from "../utils/types"
import {
  createStagesHandler,
  getCurrentCohort,
  updateStagesHandler,
} from "../utils/helpers"

import dayjs from "dayjs"
import { getUserFormResponsesQuery } from "../queries/responseQueries"
import { getFormService } from "./formService"
import {
  getCohortOverviewQuery,
  getCohortsQuery,
} from "../queries/cohortQueries"

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

export const generateCohortIdService = async () => {
  let cohortNumber = 1
  const lastCohort = await Cohort.findOne().sort({ cohortNumber: -1 })
  if (lastCohort?.cohortNumber) {
    cohortNumber = parseInt(lastCohort.cohortNumber, 10) + 1
  }

  return String(cohortNumber).padStart(6, "0")
}

export const createCohortService = async (cohortData: CreateCohortDto) => {
  await Cohort.updateOne({ isActive: true }, { isActive: false })

  const cohortNumber = await generateCohortIdService()
  const newCohort = await Cohort.create({
    ...cohortData,
    cohortNumber,
    stages: createStagesHandler(cohortData.stages),
  })

  return newCohort
}

export const updateCohortService = async (
  cohortId: string,
  formData: UpdateCohortDto,
) => {
  const { name, description, stages, startDate, endDate } = formData
  const cohort = await Cohort.findById(cohortId)

  if (!cohort) {
    throw new CustomError(COHORT_NOT_FOUND, "Cohort not found", 404)
  }

  const { startDate: cohortStartDate, endDate: cohortEndDate } = cohort

  if (name) {
    cohort.name = name
  }

  if (description !== undefined) {
    cohort.description = description
  }

  if (startDate && !endDate) {
    if (dayjs(cohortEndDate).isBefore(dayjs(startDate))) {
      throw new CustomError(
        COHORT_BAD_REQUEST,
        "Training start date must be before end date",
        400,
      )
    }

    cohort.startDate = dayjs(startDate).toISOString()
  }

  if (endDate && !startDate) {
    if (dayjs(cohortStartDate).isAfter(dayjs(endDate))) {
      throw new CustomError(
        COHORT_BAD_REQUEST,
        "Training end date must be after start date",
        400,
      )
    }

    cohort.startDate = dayjs(startDate).toISOString()
  }

  if (stages) {
    cohort.stages = updateStagesHandler(cohort.stages, stages)
  }

  return await cohort.save()
}

export const getApplicationFormService = async () => {
  const currentCohort = await getCurrentCohort()

  if (!currentCohort.applicationForm) {
    return null
  }

  return currentCohort.applicationForm
}

export const getMyApplicationFormService = async (loggedInUserId: string) => {
  const currentCohort = await getCurrentCohort()

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
    trainingStartDate: currentCohort.startDate,
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
