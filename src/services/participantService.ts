import CustomError from "../middlewares/customError"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { Role, updateUserDto } from "../utils/types"
import { getCohortService } from "./cohortService"
import { getUserService, updateUserService } from "./userService"

export const updateParticipantService = async (
  participantId: string,
  updates: updateUserDto,
) => {
  const participant = await getUserService({ _id: participantId })
  const currentCohort = await getCohortService({ isActive: true })
  const cohortProperty =
    participant.role === Role.Applicant ? "applicants" : "trainees"

  const participantExists = currentCohort[cohortProperty].some(
    (participant) => participant.id.toString() === participantId,
  )

  if (!participantExists) {
    throw new CustomError(
      USER_NOT_FOUND,
      "Applicant/trainee not found in the current cohort",
      404,
    )
  }

  if (updates.coach !== undefined) {
    if (updates.coach === null) {
      return updateUserService(participantId, updates)
    }

    const coach = currentCohort.coaches.find(
      (coach) => coach.toString() === updates.coach,
    )

    if (!coach) {
      throw new CustomError(
        USER_NOT_FOUND,
        "Coach not found in the current cohort",
        404,
      )
    }
  }

  return updateUserService(participantId, updates)
}
