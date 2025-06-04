import CustomError from "../middlewares/customError"
import Cohort, { ICohort } from "../models/Cohort"
import { getCohortsQuery } from "../queries/cohortQueries"
import { COHORT_NOT_FOUND } from "../utils/errorCodes"
import { CreateCohortDto, UpdateCohortDto } from "../utils/types"
import { createStagesHandler } from "../utils/helpers"

import dayjs from "dayjs"
import { updateStagesService } from "./generalService"

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
  cohortNumber: string,
  formData: UpdateCohortDto,
) => {
  const { name, description, stages, trainingStartDate } = formData

  const cohort = await Cohort.findOne({ cohortNumber })
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
    cohort.stages = updateStagesService(cohort.stages, stages)
  }

  return await cohort.save()
}
