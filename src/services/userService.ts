import { hash } from "bcryptjs";
import CustomError from "../middlewares/customError";
import User, { IUser } from "../models/User";
import { USER_NOT_FOUND } from "../utils/errorCodes";
import { updateUserDto } from "../utils/types";

export const getUserService = async (query: object) => {
  const user = await User.findOne<IUser>(query);
  if (!user) {
    throw new CustomError(USER_NOT_FOUND, "User not found", 404);
  }

  return user;
};

export const updateUserService = async (
  id: string,
  { name, email, verified, password, role, coach }: updateUserDto
) => {
  const user = await getUserService({ _id: id });

  if (name) {
    user.name = name;
  }

  if (email) {
    user.email = email;
  }

  if (verified) {
    user.verified = verified;
  }

  if (role) {
    user.role = role;
  }

  if (coach) {
    user.coach = coach;
  }

  if (password) {
    const hashedPassword = await hash(password, 10);
    user.password = hashedPassword;
  }

  await user.save();
  return user;
};

export const deleteUserService = async (userId: string) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new CustomError(USER_NOT_FOUND, "User not found", 404);
  }

  return user;
};
