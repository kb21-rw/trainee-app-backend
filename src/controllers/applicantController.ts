import { applicantResetPassword } from "./../services/applicantService";
import { NextFunction, Response } from "express";
import { applicantSignup } from "../services/applicantService";
import { applicantSignin } from "../services/applicantService";
import { applicantSchema } from "../validations/applicantValidation";

export const signup = async (req: any, res: Response, next: NextFunction) => {
  try {
    const applicant = req.user;
    const body = req.body;

    await applicantSchema.validateAsync(body);
    const newApplicant = await applicantSignup(applicant, body);
    return res.status(201).send({
      email: newApplicant.email,
      userId: newApplicant.userId,
      googleId: newApplicant.googleId,
      role: newApplicant.role,
    });
  } catch (error: any) {
    next(error);
  }
};

export const signin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const applicant = req.user;
    const body = req.body;
    const newApplicant = await applicantSignin(applicant, body);
    return res.status(201).send(newApplicant);
  } catch (error: any) {
    next(error);
  }
};

export const resetPassword = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body;
    const newApplicant = await applicantResetPassword(body);
    await applicantSchema.validateAsync(body);

    switch (newApplicant) {
      case "New password must be different from the old password":
        return res.status(401).send(newApplicant);
      case "updated password succesfully":
        return res.status(201).send("pasword changed succesfully");
      default:
        return res.status(500).send(" User does not exist");
    }
  } catch (error: any) {
    next(error);
  }
};
