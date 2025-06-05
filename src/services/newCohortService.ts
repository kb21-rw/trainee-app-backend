import CustomError from "../middlewares/customError"
import NewCohort, { INewCohort } from "../models/NewCohort"
import { COHORT_BAD_REQUEST, COHORT_NOT_FOUND } from "../utils/errorCodes"
import { NewCreateCohortDto, NewUpdateCohortDto } from "../utils/types"
import { createNewStagesHandler } from "../utils/helpers"

import dayjs from "dayjs"
import { updateNewStagesService } from "./generalService"
import { getCohortsQuery } from "../queries/newCohortQueries"

export const getCohortService = async (query: object) => {
  const cohort = await NewCohort.findOne<INewCohort>(query)
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
  const lastCohort = await NewCohort.findOne().sort({ cohortNumber: -1 })
  if (lastCohort?.cohortNumber) {
    cohortNumber = parseInt(lastCohort.cohortNumber, 10) + 1
  }

  return String(cohortNumber).padStart(6, "0")
}

export const createCohortService = async (cohortData: NewCreateCohortDto) => {
  await NewCohort.updateOne({ isActive: true }, { isActive: false })

  const cohortNumber = await generateCohortIdService()
  console.log("service")
  const newCohort = await NewCohort.create({
    ...cohortData,
    cohortNumber,
    stages: createNewStagesHandler(cohortData.stages),
  })

  return newCohort
}

export const updateCohortService = async (
  cohortNumber: string,
  formData: NewUpdateCohortDto,
) => {
  const { name, description, stages, startDate, endDate } = formData

  const cohort = await NewCohort.findOne({ cohortNumber })
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
    cohort.stages = updateNewStagesService(cohort.stages, stages)
  }

  return await cohort.save()
}
