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

export const getUsersService = async () => {
  return await User.find<IUser[]>();
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

  if (coach !== undefined) {
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

export const generateUserIdService = async () => {
  let userId = 1;
  const lastUser = await User.findOne().sort({ userId: -1 });
  if (lastUser) {
    userId = parseInt(lastUser.userId, 10) + 1;
  }

  return String(userId).padStart(6, "0");
};
