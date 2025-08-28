import { NextFunction, Request, Response } from "express"
import { joinWaitListService } from "../services/joinWaitListService"
import { joinWaitListFormValidation } from "../validations/joinWaitListValidation"

export const joinWaitListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await joinWaitListFormValidation.validateAsync(req.body)

    const addedProspect = await joinWaitListService(req.body)

    return res.status(201).json({
      message: "You've been added to the waitlist!",
      user: addedProspect,
    })
  } catch (error) {
    return next(error)
  }
}
