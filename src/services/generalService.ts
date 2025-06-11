import { Types } from "mongoose"
import CustomError from "../middlewares/customError"
import { DUPLICATE_DOCUMENT, NOT_ALLOWED } from "../utils/errorCodes"
import { INewStage, IStage, NewStageDto, StageDto } from "../utils/types"
import { validatePreselectionStages } from "../utils/helpers"

export const updateStagesService = (
  currentStages: IStage[],
  receivedStages: StageDto[],
) => {
  if (currentStages[currentStages.length - 1].participantsCount !== 0) {
    throw new CustomError(
      NOT_ALLOWED,
      "You can't updated stages, there're participants on the last stage already.",
      403,
    )
  }

  const uniqueReceivedStageNames = new Set(
    receivedStages.map((stage) => stage.name),
  )

  if (uniqueReceivedStageNames.size !== receivedStages.length)
    throw new CustomError(
      DUPLICATE_DOCUMENT,
      "Duplicate stage names are not allowed",
      400,
    )

  const stagesWithParticipantsCount =
    currentStages.findLastIndex((stage) => stage.participantsCount !== 0) + 1

  if (receivedStages.length < stagesWithParticipantsCount)
    throw new CustomError(
      NOT_ALLOWED,
      "You can't delete a stage with participants",
      403,
    )

  const stagesWithParticipants = currentStages.slice(
    0,
    stagesWithParticipantsCount,
  )
  const stagesWithNoParticipants = receivedStages.slice(
    stagesWithParticipantsCount,
  )

  const updatedStages = stagesWithParticipants.map((stage, i) => ({
    ...stage,
    name: receivedStages[i].name,
    description: receivedStages[i].description,
  }))
  const addedStages = stagesWithNoParticipants.map((stage) => ({
    ...stage,
    id: new Types.ObjectId().toString(),
    participantsCount: 0,
  }))

  return [...updatedStages, ...addedStages]
}

export const updateNewStagesService = (
  currentStages: INewStage[],
  receivedStages: NewStageDto[],
) => {
  //check if received stages are unique
  const receivedStageNames = receivedStages.map((stage) => stage.name)

  const uniqueReceivedStageNames = new Set(receivedStageNames)
  if (uniqueReceivedStageNames.size !== receivedStages.length) {
    throw new CustomError(
      DUPLICATE_DOCUMENT,
      "Duplicate stage names are not allowed",
      400,
    )
  }

  const currentStageIndex = currentStages.findIndex((stage) => stage.isCurrent)
  if (receivedStages.length < currentStageIndex + 1) {
    throw new CustomError(NOT_ALLOWED, "You can't delete a passed stage", 403)
  }

  validatePreselectionStages(receivedStages)
  const updatedStages = currentStages
    .slice(0, currentStageIndex + 1)
    .map((stage, i) => ({
      ...stage,
      name: receivedStages[i].name,
      description: receivedStages[i].description,
      isPreselection: stage.isPreselection,
    }))

  const afterCurrentStages = receivedStages.slice(currentStageIndex + 1)
  const addedStages = afterCurrentStages.map((stage) => ({
    ...stage,
    id: new Types.ObjectId().toString(),
    participantsCount: 0,
    isCurrent: false,
  }))

  return [...updatedStages, ...addedStages]
}
