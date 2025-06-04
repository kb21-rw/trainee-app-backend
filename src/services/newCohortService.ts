import CustomError from "../middlewares/customError"
import NewCohort, { INewCohort } from "../models/NewCohort"
import { getCohortsQuery } from "../queries/cohortQueries"
import { COHORT_NOT_FOUND } from "../utils/errorCodes"
import { NewCreateCohortDto, NewUpdateCohortDto } from "../utils/types"
import { createNewStagesHandler } from "../utils/helpers"

import dayjs from "dayjs"
import { updateNewStagesService } from "./generalService"

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
  const { name, description, stages, startDate } = formData

  const cohort = await NewCohort.findOne({ cohortNumber })
  if (!cohort) {
    throw new CustomError(COHORT_NOT_FOUND, "Cohort not found", 404)
  }

  if (name) {
    cohort.name = name
  }

  if (description !== undefined) {
    cohort.description = description
  }

  if (startDate) {
    cohort.startDate = dayjs(startDate).toISOString()
  }

  if (stages) {
    cohort.stages = updateNewStagesService(cohort.stages, stages)
  }

  return await cohort.save()
}
