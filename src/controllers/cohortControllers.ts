import { NextFunction, Request, Response } from "express";
import { createCohortValidation } from "../validations/cohortValidation";
import {
  createCohortService,
  getApplicationFormService,
  getCohortsService,
} from "../services/cohortService";

export const createCohortController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await createCohortValidation.validateAsync(req.body);
    const createdCohort = await createCohortService(req.body);
    return res.status(201).json(createdCohort);
  } catch (error) {
    next(error);
  }
};

export const getApplicationFormController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const form = await getApplicationFormService();
    return res.status(200).json(form);
  } catch (error) {
    return next(error);
  }
};

export const getCohortsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cohorts = await getCohortsService(
      String(req.query.searchString ?? "")
    );
    return res.status(200).json(cohorts);
  } catch (error) {
    return next(error);
  }
};
