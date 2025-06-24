import { NextFunction, Response } from "express"
import { editUserSchema } from "../validations/userValidation"
import {
  getCoachesService,
  updateCoachOrAdminService,
  addCoachToCohortService,
} from "../services/coachService"
import { mongodbIdValidation } from "../validations/generalValidation"
import { registerService } from "../services/authService"
import { registerSchema } from "../validations/authValidation"
import { Role } from "../utils/types"
import Coach from "../models/Coach"

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
    const { cohortId } = req.params
    await registerSchema.validateAsync(body)
    const newUser = await registerService(loggedInUser, body)

    newUser.role = Role.Coach
    await newUser.save()

    const coach = await Coach.create({
      userId: newUser._id,
      cohortId: cohortId,
    })

    await addCoachToCohortService(newUser._id)
    return res.status(201).send(coach)
  } catch (error) {
    return next(error)
  }
}
