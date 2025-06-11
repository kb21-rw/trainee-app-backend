import { NextFunction, Request, Response } from "express"
import {
  createNewCohortValidation,
  updateCohortValidation,
} from "../validations/newCohortValidation"
import { mongodbIdValidation } from "../validations/generalValidation"
import {
  createCohortService,
  getApplicationFormService,
  getCohortService,
  getCohortsService,
  updateCohortService,
} from "../services/newCohortService"

export const createCohortController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await createNewCohortValidation.validateAsync(req.body)
    const createdCohort = await createCohortService(req.body)
    return res.status(201).json(createdCohort)
  } catch (error) {
    return next(error)
  }
}

export const getCohortController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cohortId } = req.params
    await mongodbIdValidation.validateAsync(cohortId)
    const cohort = await getCohortService({ _id: cohortId })
    return res.status(200).json(cohort)
  } catch (error) {
    return next(error)
  }
}

export const getCohortsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cohorts = await getCohortsService(
      String(req.query.searchString ?? ""),
    )
    return res.status(200).json(cohorts)
  } catch (error) {
    return next(error)
  }
}

export const updateCohortController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cohortId } = req.params
    await updateCohortValidation.validateAsync(req.body)
    const updatedCohort = await updateCohortService(cohortId, req.body)
    return res.status(200).json(updatedCohort)
  } catch (error) {
    return next(error)
  }
}

export const getApplicationFormController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const form = await getApplicationFormService()
    return res.status(200).json(form)
  } catch (error) {
    return next(error)
  }
}
