import Joi from "joi";
import { Role } from "../utils/types";

export const ProfileSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
});

export const editUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().optional(),
  email: Joi.string().email().optional(),
  coach: Joi.string().optional(),
});

export const getUsersSchema = Joi.object({
  role: Joi.string()
    .valid(Role.Prospect, Role.Applicant, Role.Trainee, Role.Coach, Role.Admin)
    .optional(),
});
