import CustomError from "../middlewares/customError"
import Coach from "../models/Coach"
import Cohort from "../models/Cohort"
import User from "../models/User"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { Role } from "../utils/types"
import { registerService } from "./authService"
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

  if (!currentCohort) {
    return null
  }

  const cohortObj = currentCohort.toObject()

  const transformedCohort = {
    ...cohortObj,
    coaches:
      cohortObj.coaches?.map((coach: any) => {
        const coachObj = typeof coach === "object" ? coach : {}
        if (!coachObj.userId || typeof coachObj.userId !== "object") {
          console.warn(`Coach ${coachObj._id} has invalid.`)
          return coachObj
        }

        return {
          // Here we are extracting data from userId which is weird but it's because we populated the coaches data in reference to the userId
          // It's important to pass userId._id here because that's what the front end will use to send the edit requst to the right coach document.
          _id: coachObj.userId._id,
          // Any edits specific to a user being a coach, will be targetting this coachId instead.
          coachId: coachObj._id,
          name: coachObj.userId.name || "",
          email: coachObj.userId.email || "",
          cohortId: coachObj.cohortId,
          trainees: coachObj.trainees || [],
          applicants: coachObj.applicants || [],
          __v: coachObj.__v,
        }
      }) || [],
  }
  return transformedCohort
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

export const createCoachService = async (
  loggedInUser: any,
  body: any,
  cohortId: string,
) => {
  const newUser = await registerService(loggedInUser, body)

  newUser.role = Role.Coach
  await newUser.save()

  const coach = await Coach.create({
    userId: newUser._id,
    cohortId: cohortId,
  })

  await addCoachToCohortService(coach._id)
  return coach
}
