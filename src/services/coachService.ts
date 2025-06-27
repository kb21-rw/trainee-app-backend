import CustomError from "../middlewares/customError"
import Cohort from "../models/Cohort"
import User from "../models/User"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { Role } from "../utils/types"
import { getCohortService } from "./cohortService"

export const getCoachesService = async (cohortId?: string) => {
  const currentCohort = await Cohort.findById(cohortId)
    .select(["_id", "name", "isActive", "coaches"])
    .populate({
      path: "coaches",
      populate: {
        path: "userId",
        model: User, // Direct reference to imported model
        select: "name email",
      },
    })

  return currentCohort
}

export const updateCoachOrAdminService = async (
  userId: string,
  { name, email, role }: { name: string; email: string; role: Role },
) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new CustomError(USER_NOT_FOUND, "User not found", 404)
  }

  if (name) {
    user.name = name
  }

  if (email) {
    user.email = email
  }

  if (role) {
    user.role = role
  }

  await user.save()
  return user
}

export const addCoachToCohortService = async (coachId: string) => {
  const currentCohort = await getCohortService({ isActive: true })
  currentCohort.coaches.push(coachId)
  await currentCohort.save()

  return currentCohort
}
