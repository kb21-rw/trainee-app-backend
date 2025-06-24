import CustomError from "../middlewares/customError"
import User from "../models/User"
import Trainee from "../models/Trainee"
import {
  getTraineesForCoachQuery,
  getTraineesQuery,
} from "../queries/traineesQuery"
import { COHORT_BAD_REQUEST, USER_NOT_FOUND } from "../utils/errorCodes"
import { updateUserDto, TraineeStatus, TraineeDto } from "../utils/types"
import { updateUserService } from "./userService"
import { getCohortService } from "./cohortService"

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

  const registeredTrainees = trainees.filter((trainee: TraineeDto) => {
    return trainee.status === TraineeStatus.ENROLLED
  })
  return registeredTrainees
}

export const updateTraineeService = async (
  traineeId: string,
  updates: updateUserDto & {
    status?: TraineeStatus
    coachId?: string
  },
) => {
  const trainee = await Trainee.findById(traineeId)
  if (!trainee) {
    throw new CustomError(USER_NOT_FOUND, "Trainee not found", 404)
  }

  const currentCohort = await getCohortService({ isActive: true })

  if (currentCohort.id !== trainee.cohortId.toString()) {
    throw new CustomError(
      USER_NOT_FOUND,
      "Trainee not found in the current cohort",
      404,
    )
  }

  if (updates.coachId && !currentCohort.coaches.includes(updates.coachId)) {
    throw new CustomError(
      COHORT_BAD_REQUEST,
      "Coach is not part of the current cohort",
      400,
    )
  }

  trainee.traineeStatus = updates.status || trainee.traineeStatus
  trainee.coachId = updates.coachId || trainee.coachId

  trainee.save()

  const userUpdates = await updateUserService(traineeId, updates)

  return { ...trainee.toObject(), ...userUpdates }
}

export const createTraineeService = async (
  userId: string,
  cohortId: string,
  coachId: string,
  status: TraineeStatus = TraineeStatus.ENROLLED,
) => {
  const currentCohort = await getCohortService({ isActive: true })

  if (currentCohort.id !== cohortId) {
    throw new CustomError(
      COHORT_BAD_REQUEST,
      "You can only register trainees in the current cohort",
      400,
    )
  }

  if (!currentCohort.coaches.includes(coachId)) {
    throw new CustomError(
      COHORT_BAD_REQUEST,
      "Coach is not part of the current cohort",
      400,
    )
  }

  // add trainee as an applicant for a coach and will have status APPLIED

  const trainee = new Trainee({
    userId,
    cohortId,
    coachId,
    stage: currentCohort.stages[0].id,
    traineeStatus: status,
  })

  await trainee.save()
  return trainee
}
