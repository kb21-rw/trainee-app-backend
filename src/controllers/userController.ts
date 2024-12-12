import { NextFunction, Request, Response } from "express";
import { getUsersSchema, ProfileSchema } from "../validations/userValidation";
import {
  deleteUserService,
  getUserService,
  getUsersService,
  updateUserService,
} from "../services/userService";

export const getProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const user = await getUserService({ _id: userId });
    return res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};

export const getUsersController = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = req.query;
    await getUsersSchema.validateAsync(search);
    const users = await getUsersService(search);
    return res.status(200).send(users);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    await ProfileSchema.validateAsync(req.body);

    const user = await updateUserService(userId, req.body);
    return res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    await deleteUserService(userId);
    return res.status(200).send("User deleted successfully");
  } catch (error) {
    next(error);
  }
};
