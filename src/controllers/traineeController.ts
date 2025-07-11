import { NextFunction, Request, Response } from "express"
import {
  getTraineesForCoachService,
  getTraineesService,
  updateTraineeService,
} from "../services/traineeService"
import { editTraineeSchema } from "../validations/traineeValidation"
import { decisionService } from "../services/decisionService"
import { decisionValidation } from "../validations/cohortValidation"

export const getTrainees = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const searchString = String(req.query.searchString || "")
  const traineesPerPage = Number(req.query.traineesPerPage) || 10
  const sortBy = String(req.query.sortBy || "entry")
  try {
    const trainees = await getTraineesService({
      searchString,
      sortBy,
      traineesPerPage,
    })
    return res.status(200).json(trainees)
  } catch (error) {
    return next(error)
  }
}

export const getTraineesForCoach = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  const searchString = req.query.searchString || ""
  const traineesPerPage = Number(req.query.coachesPerPage) || 10
  const sortBy = req.query.sortBy?.toString() || "entry"
  try {
    const { id } = req.user
    const trainees = await getTraineesForCoachService(id, {
      searchString,
      sortBy,
      traineesPerPage,
    })
    return res.status(200).json(trainees)
  } catch (error) {
    return next(error)
  }
}

export const updateTrainee = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.id
    await editTraineeSchema.validateAsync(req.body)
    const user = await updateTraineeService(userId, req.body)
    return res.status(200).send(user)
  } catch (error) {
    return next(error)
  }
}

export const decisionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body
    await decisionValidation.validateAsync(body)
    const decision = await decisionService(body)
    return res.status(201).send(decision)
  } catch (error: any) {
    return next(error)
  }
}
