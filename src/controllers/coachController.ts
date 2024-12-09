import { NextFunction, Response } from "express";
import { editUserSchema } from "../validations/userValidation";
import {
  getCoachesService,
  updateCoachOrAdminService,
  addCoachToCohortService,
} from "../services/coachService";
import { mongodbIdValidation } from "../validations/generalValidation";

export const getCoachesController = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cohortId } = req.query;
    await mongodbIdValidation.validateAsync(cohortId);
    const coaches = await getCoachesService(cohortId);
    return res.status(200).json(coaches);
  } catch (error) {
    next(error);
  }
};

export const updateCoachOrAdmin = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    await editUserSchema.validateAsync(req.body);
    const user = await updateCoachOrAdminService(userId, req.body);
    return res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};

export const addCoachToCohortController = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { coachId } = req.body;
    await mongodbIdValidation.validateAsync(coachId);
    const coach = await addCoachToCohortService(coachId);
    return res.status(200).send(coach);
  } catch (error) {
    next(error);
  }
};
