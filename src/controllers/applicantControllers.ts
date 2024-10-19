import { NextFunction,Response } from "express";
import {
  getApplicantsService,
  updateApplicantService,
} from "../services/applicantService";
import { mongodbIdValidation } from "../validations/generalValidation";
import { editUserSchema } from "../validations/userValidation";


export const getApplicants = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const searchString = req.query.searchString ? String(req.query.searchString) : "";
    const applicantsPerPage = req.query.coachesPerPage
      ? Number(req.query.coachesPerPage)
      : 10;
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : "userId";

    const applicants = await getApplicantsService({
      searchString,
      applicantsPerPage,
      sortBy,
    });

    return res.status(201).send(applicants);
  } catch (error: any) {
    next(error);
  }
};

export const updateApplicantController = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const applicantId = req.params.id;
    await mongodbIdValidation.validateAsync(applicantId)
    await editUserSchema.validateAsync(req.body);
    const user = await updateApplicantService(applicantId, req.body);
    return res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};