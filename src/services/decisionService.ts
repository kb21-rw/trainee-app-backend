import CustomError from "../middlewares/customError"
import { ICohort } from "../models/Cohort"
import { ITrainee } from "../models/Trainee"
import { TRAINEE403_FORBIDDEN, TRAINEE_NOT_FOUND } from "../utils/errorCodes"
import { getCurrentCohort } from "../utils/helpers"
import { Decision, DecisionDto, TraineeStatus } from "../utils/types"
import { getTraineeService } from "./traineeService"

export const acceptTraineeService = async (
  currentCohort: ICohort,
  trainee: ITrainee,
  feedback: string,
) => {
  const { stage } = trainee

  const lastStage = currentCohort.stages[currentCohort.stages.length - 1]
  if (stage === lastStage.id) {
    trainee.traineeStatus = TraineeStatus.GRADUATED
    trainee.feedbacks.push({ stageId: lastStage.id, description: feedback })
  } else {
    const nextStageIndex =
      currentCohort.stages.findIndex((s) => s.id === stage) + 1

    trainee.stage = currentCohort.stages[nextStageIndex].id
    currentCohort.stages[nextStageIndex].isCurrent = true
    currentCohort.stages[nextStageIndex - 1].isCurrent = false

    trainee.feedbacks.push({
      stageId: currentCohort.stages[nextStageIndex].id,
      description: feedback,
    })
    trainee.comment = null //reset comment on stage change
  }

  await trainee.save()
  await currentCohort.save()
  return {
    trainee: trainee.id,
    message: `Trainee with ${trainee.userId} was accepted!`,
  }
}

export const rejectTraineeService = async (
  trainee: ITrainee,
  feedback: string,
) => {
  const { stage } = trainee

  if (trainee.traineeStatus !== TraineeStatus.ENROLLED) {
    throw new CustomError(
      TRAINEE403_FORBIDDEN,
      `Trainee with ${trainee.traineeStatus} status cannot be rejected`,
      403,
    )
  }

  trainee.traineeStatus = TraineeStatus.REJECTED
  trainee.feedbacks.push({ stageId: stage, description: feedback })
  await trainee.save()
  return {
    trainee: trainee.id,
    message: `Trainee with ${trainee.userId} was rejected!`,
  }
}

export const decisionService = async (body: DecisionDto) => {
  const { traineeId, decision, feedback } = body
  const currentCohort = await getCurrentCohort()
  const trainee = await getTraineeService({ _id: traineeId })

  if (!trainee) {
    throw new CustomError(TRAINEE_NOT_FOUND, "Trainee not found", 404)
  }

  if (currentCohort.id !== trainee.cohortId.toString()) {
    throw new CustomError(
      TRAINEE_NOT_FOUND,
      "Trainee not found in the current cohort",
      404,
    )
  }

  if (decision === Decision.Accepted) {
    return await acceptTraineeService(currentCohort, trainee, feedback)
  } else {
    return await rejectTraineeService(trainee, feedback)
  }
}
