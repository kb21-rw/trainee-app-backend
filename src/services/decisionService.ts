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
    trainee.feedbacks.push({
      stageId: currentCohort.stages[nextStageIndex].id,
      description: feedback,
    })
  }

  await trainee.save()
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
  const trainee = await getTraineeService({ _id: traineeId })
  const currentCohort = await getCurrentCohort()
  if (currentCohort.id !== trainee.cohortId) {
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
