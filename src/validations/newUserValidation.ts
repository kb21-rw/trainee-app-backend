import Joi from "joi"
import { NewRole } from "../utils/types"

export const ProfileSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
})

export const editUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().optional(),
  email: Joi.string().email().optional(),
})

export const getUsersSchema = Joi.object({
  role: Joi.string()
    .valid(NewRole.Trainee, NewRole.Coach, NewRole.Admin)
    .optional(),
})
export const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().optional(),
  role: Joi.string()
    .valid(NewRole.Trainee, NewRole.Coach, NewRole.Admin)
    .optional(),
})
