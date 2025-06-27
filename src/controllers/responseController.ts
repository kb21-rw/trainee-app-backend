import { Response, NextFunction } from "express"
import {
  createApplicantResponseValidation,
  createCoachResponseValidation,
} from "../validations/responseValidation"

export const createCoachResponse = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    return await createCoachResponseValidation.validateAsync(req.body)
  } catch (error) {
    return next(error)
  }
}

export const createApplicantResponse = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const loggedInUser = req.user
    return await createApplicantResponseValidation.validateAsync(req.body)
  } catch (error) {
    return next(error)
  }
}
