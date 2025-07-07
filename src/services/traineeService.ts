import CustomError from "../middlewares/customError"
import User, { IUser } from "../models/User"
import Trainee, { ITrainee } from "../models/Trainee"
import {
  getTraineesForCoachQuery,
  getTraineesQuery,
} from "../queries/traineesQuery"
import {
  COHORT_BAD_REQUEST,
  DUPLICATE_TRAINEE,
  USER_NOT_FOUND,
} from "../utils/errorCodes"
import { updateUserDto, TraineeStatus, TraineeDto, Role } from "../utils/types"
import { updateUserService } from "./userService"
import { getCurrentCohort } from "../utils/helpers"

export const getTraineesService = async ({
  searchString,
  sortBy,
  traineesPerPage,
}: {
  searchString: string
  sortBy: string
  traineesPerPage: number
}) => {
  const trainees = await getTraineesQuery(searchString, sortBy, traineesPerPage)

  return trainees
}

export const getTraineesForCoachService = async (
  coachId: string,
  {
    searchString,
    sortBy,
    traineesPerPage,
  }: { searchString: string; sortBy: string; traineesPerPage: number },
) => {
  const coach = await User.findById<IUser>(coachId)

  if (!coach) {
    throw new CustomError(USER_NOT_FOUND, "Coach not found", 404)
  }

  const trainees = await getTraineesForCoachQuery(
    coach.id,
    searchString,
    sortBy,
    traineesPerPage,
  )

  const registeredTrainees = trainees.filter((trainee: TraineeDto) => {
    return trainee.status === TraineeStatus.ENROLLED
  })
  return registeredTrainees
}

export const getTraineeService = async (query: object) => {
  const trainee = await Trainee.findOne<ITrainee>(query)

  return trainee
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

  const currentCohort = await getCurrentCohort()

  if (currentCohort.id !== trainee.cohortId.toString()) {
    throw new CustomError(
      USER_NOT_FOUND,
      "Trainee not found in the current cohort",
      404,
    )
  }

  if (
    updates.coachId &&
    currentCohort.coaches.find((coach) => coach.toString() === updates.coachId)
  ) {
    throw new CustomError(
      COHORT_BAD_REQUEST,
      "Coach is not part of the current cohort",
      400,
    )
  }

  trainee.traineeStatus = updates.status || trainee.traineeStatus
  trainee.coachId = updates.coachId || trainee.coachId

  trainee.save()

  const userUpdates = await updateUserService(trainee.userId, updates)

  return { ...trainee.toObject(), ...userUpdates }
}

export const createTraineeService = async (
  userId: string,
  cohortId: string,
  coachId?: string,
  status: TraineeStatus = TraineeStatus.ENROLLED,
) => {
  const currentCohort = await getCurrentCohort()

  if (currentCohort.id !== cohortId) {
    throw new CustomError(
      COHORT_BAD_REQUEST,
      "You can only register trainees in the current cohort",
      400,
    )
  }

  const existingTrainee = await getTraineeService({ userId })

  if (
    existingTrainee &&
    existingTrainee.cohortId.toString() === currentCohort.id
  ) {
    throw new CustomError(
      DUPLICATE_TRAINEE,
      "Trainee already exists in the current cohort",
      409,
    )
  }

  if (coachId && !currentCohort.coaches.includes(coachId)) {
    throw new CustomError(
      COHORT_BAD_REQUEST,
      "Coach is not part of the current cohort",
      400,
    )
  }

  const trainee = new Trainee({
    userId,
    cohortId,
    coachId,
    stage: currentCohort.stages[0].id,
    traineeStatus: status,
  })

  await trainee.save()

  currentCohort.trainees.push(trainee.id)

  await currentCohort.save()

  await updateUserService(userId, { role: Role.Trainee })

  return trainee
}
