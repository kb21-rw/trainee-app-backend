import { NextFunction, Request, Response } from "express"
import {
  createCohortValidation,
  updateCohortValidation,
} from "../validations/cohortValidation"
import { mongodbIdValidation } from "../validations/generalValidation"
import {
  createCohortService,
  getApplicationFormService,
  getCohortOverviewService,
  getCohortService,
  getCohortsService,
  getMyApplicationFormService,
  updateCohortService,
} from "../services/cohortService"
import { FormType } from "../utils/types"

export const createCohortController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await createCohortValidation.validateAsync(req.body)
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

export const getCohortOverview = async (
  req: Request<any, any, any, { cohortId: string; type: FormType }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cohortId, type } = req.query
    const overviewType =
      type === FormType.Trainee ? FormType.Trainee : FormType.Applicant
    cohortId && (await mongodbIdValidation.validateAsync(cohortId))
    const overview = await getCohortOverviewService({
      cohortId,
      overviewType,
    })
    return res.status(200).json(overview)
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

export const getMyApplicationController = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  const { user } = req
  try {
    const application = await getMyApplicationFormService(user.id)
    return res.status(200).json(application)
  } catch (error) {
    return next(error)
  }
}

export const getCoachCohortOverview = async (
  req: Request<
    any,
    any,
    any,
    { cohortId: string; type: FormType; coachId?: string }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cohortId, type, coachId } = req.query
    const overviewType =
      type === FormType.Trainee ? FormType.Trainee : FormType.Applicant
    cohortId && (await mongodbIdValidation.validateAsync(cohortId))
    const overview = await getCohortOverviewService({
      cohortId,
      overviewType,
      coachId,
    })
    return res.status(200).json(overview)
  } catch (error) {
    return next(error)
  }
}
