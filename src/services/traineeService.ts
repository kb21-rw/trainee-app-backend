import CustomError from "../middlewares/customError"
import User from "../models/User"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import {
  getTraineesForCoachQuery,
  getTraineesQuery,
} from "../queries/traineesQuery"
import { getCohortService } from "./cohortService"
import { updateUserService } from "./userService"
import { updateUserDto } from "../utils/types"

export const getTraineesService = async ({
  searchString,
  sortBy,
  traineesPerPage,
}: {
  searchString: string
  sortBy: string
  traineesPerPage: number
}) => {
  const trainees = getTraineesQuery(searchString, sortBy, traineesPerPage)
  return trainees
}

export const getTraineesForCoachService = async (
  id: string,
  {
    searchString,
    sortBy,
    traineesPerPage,
  }: { searchString: string; sortBy: string; traineesPerPage: number },
) => {
  const coach: any = await User.findById(id)
  const trainees = await getTraineesForCoachQuery(
    coach._id,
    searchString,
    sortBy,
    traineesPerPage,
  )
  return trainees
}

export const updateTraineeService = async (
  traineeId: string,
  updates: updateUserDto,
) => {
  const currentCohort = await getCohortService({ isActive: true })
  const applicant = currentCohort.applicants.find(
    (applicant) => applicant.id.toString() === traineeId,
  )

  if (!applicant) {
    throw new CustomError(
      USER_NOT_FOUND,
      "Applicant not found in the current cohort",
      404,
    )
  }

  if (updates.coach) {
    const coach = currentCohort.coaches.find(
      (coach) => coach.toString() === coach,
    )

    if (!coach) {
      throw new CustomError(
        USER_NOT_FOUND,
        "Coach not found in the current cohort",
        404,
      )
    }
  }

  return updateUserService(traineeId, updates)
}
