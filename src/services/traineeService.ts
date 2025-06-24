import CustomError from "../middlewares/customError"
import User from "../models/User"
import Trainee from "../models/Trainee"
import {
  getTraineesForCoachQuery,
  getTraineesQuery,
} from "../queries/traineesQuery"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { updateUserDto } from "../utils/types"
import { updateUserService } from "./userService"

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
  // To be worked on when new trainee services are implemented
  const trainee = await Trainee.findById(traineeId)

  if (!trainee) {
    throw new CustomError(
      USER_NOT_FOUND,
      "Trainee not found in the current cohort",
      404,
    )
  }

  return updateUserService(traineeId, updates)
}
