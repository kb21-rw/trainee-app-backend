import { hash } from "bcryptjs"
import CustomError from "../middlewares/customError"
import User, { IUser } from "../models/User"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { Role, updateUserDto } from "../utils/types"
import { createTraineeService } from "./traineeService"
import { getCurrentCohort } from "../utils/helpers"
import Coach from "../models/Coach"
import { addCoachToCohortService } from "./coachService"

export const getUserService = async (query: object) => {
  const user = await User.findOne<IUser>(query)
  if (!user) {
    throw new CustomError(USER_NOT_FOUND, "User not found", 404)
  }

  return user
}

export const getUsersService = async (search?: object) => {
  return await User.find<IUser>(search ? search : {})
}

export const updateUserService = async (
  id: string,
  { name, email, verified, password, role, active }: updateUserDto,
) => {
  const user = await getUserService({ _id: id })
  const currentCohort = await getCurrentCohort()

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
    if (user.role !== Role.Trainee && role === Role.Trainee) {
      await createTraineeService(user.id, currentCohort.id)
    }

    user.role = role

    console.log("🚀")
    console.log("Test")
    if (role === Role.Coach) {
      const coach = await Coach.create({
        userId: id,
        cohortId: currentCohort.id,
      })
      console.log("🚀")
      console.log("Create coach")
      await addCoachToCohortService(coach._id)
      console.log("🚀")
      console.log("Add coach to cohort")
    }
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

// export const generateUserIdService = async () => {
//   let userId = 1
//   const lastUser = await User.findOne().sort({ userNumber: -1 })
//   if (lastUser) {
//     userId = parseInt(lastUser.userNumber, 10) + 1
//   }

//   return String(userId).padStart(6, "0")
// }
