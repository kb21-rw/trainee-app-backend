import { NextFunction, Response } from "express"
import {
  addCoachToCohortService,
  createCoachService,
  getCoachesService,
  updateCoachOrAdminService,
} from "../services/coachService"
import { getCohortService } from "../services/cohortService"
import { registerSchema } from "../validations/authValidation"
import { mongodbIdValidation } from "../validations/generalValidation"
import { editUserSchema } from "../validations/userValidation"

export const getCoachesController = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cohortId } = req.query
    await mongodbIdValidation.validateAsync(cohortId)
    const coaches = await getCoachesService(cohortId)
    return res.status(200).json(coaches)
  } catch (error) {
    return next(error)
  }
}

export const updateCoachOrAdmin = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.id
    await editUserSchema.validateAsync(req.body)
    const user = await updateCoachOrAdminService(userId, req.body)
    return res.status(200).send(user)
  } catch (error) {
    return next(error)
  }
}

export const addCoachToCohortController = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { coachId } = req.body
    await mongodbIdValidation.validateAsync(coachId)
    const coach = await addCoachToCohortService(coachId)
    return res.status(200).send(coach)
  } catch (error) {
    return next(error)
  }
}

export const createCoachController = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const loggedInUser = req.user
    const body = req.body
    const currentActiveCohort = await getCohortService({ isActive: true })

    await registerSchema.validateAsync(body)
    const coach = await createCoachService(
      loggedInUser,
      body,
      currentActiveCohort._id,
    )
    return res.status(201).send(coach)
  } catch (error) {
    return next(error)
  }
}
