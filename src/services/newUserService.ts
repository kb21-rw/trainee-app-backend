import { hash } from "bcryptjs"
import CustomError from "../middlewares/customError"
// import User, { IUser } from "../models/User"
import User, { INewUser } from "../models/NewUser"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { newUpdateUserDto } from "../utils/types"

export const getUserService = async (query: object) => {
  const user = await User.findOne<INewUser>(query)
  if (!user) {
    throw new CustomError(USER_NOT_FOUND, "User not found", 404)
  }

  return user
}

export const getUsersService = async (search?: object) => {
  return await User.find<INewUser>(search ? search : {})
}

export const updateUserService = async (
  id: string,
  { name, email, verified, password, role, active }: newUpdateUserDto,
) => {
  const user = await getUserService({ _id: id })

  if (name) {
    user.name = name
  }

  if (email) {
    user.email = email
  }

  if (verified) {
    user.verified = verified
  }

  if (role) {
    user.role = role
  }

  if (password) {
    const hashedPassword = await hash(password, 10)
    user.password = hashedPassword
  }

  if (active !== undefined) {
    user.active = active
  }

  await user.save()
  return user
}

export const deleteUserService = async (userId: string) => {
  const user = await User.findByIdAndDelete(userId)
  if (!user) {
    throw new CustomError(USER_NOT_FOUND, "User not found", 404)
  }

  return user
}

export const generateUserIdService = async () => {
  let userId = 1
  const lastUser = await User.findOne().sort({ userNumber: -1 })
  if (lastUser) {
    userId = parseInt(lastUser.userNumber, 10) + 1
  }

  return String(userId).padStart(6, "0")
}
