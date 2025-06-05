import { Types } from "mongoose"
import CustomError from "../middlewares/customError"
import { DUPLICATE_DOCUMENT, NOT_ALLOWED } from "../utils/errorCodes"
import { INewStage, IStage, NewStageDto, StageDto } from "../utils/types"

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
  const receivedStageOrders = receivedStages.map((stage) => stage.order)
  const uniqueReceivedStageNames = new Set(receivedStageNames)
  if (uniqueReceivedStageNames.size !== receivedStages.length) {
    throw new CustomError(
      DUPLICATE_DOCUMENT,
      "Duplicate stage names are not allowed",
      400,
    )
  }

  //check if received order are unique
  const uniqueReceivedStageOrders = new Set(receivedStageOrders)
  if (uniqueReceivedStageOrders.size !== receivedStages.length) {
    throw new CustomError(
      DUPLICATE_DOCUMENT,
      "Duplicate stage orders are not allowed",
      400,
    )
  }

  //check if received stages are in current stages

  // filter stages with participants count
  const currentStagesWithParticipants = currentStages.filter(
    (stage) => stage.participantsCount !== 0,
  )

  const currentStageOrderWithParticipants = currentStagesWithParticipants.map(
    (stage) => stage.order,
  )

  // check if the received stages are in current stages that have participants and throw error if they are
  if (currentStageOrderWithParticipants.length > 0) {
    const hasParticipantsInUpdatedStages = receivedStages.find((stage) =>
      currentStageOrderWithParticipants.includes(stage.order),
    )
    if (hasParticipantsInUpdatedStages) {
      throw new CustomError(
        NOT_ALLOWED,
        "You can't update the order of stages with participants",
        403,
      )
    }
  }

  // check if minimum stage order  is being updated before the highest order of current stages with participants if there are any throw error
  const minUpdatedStageOrder = Math.min(...receivedStageOrders)
  const maxCurrentStageOrderWithParticipants =
    currentStagesWithParticipants.length > 0
      ? Math.max(...currentStageOrderWithParticipants)
      : 0

  if (minUpdatedStageOrder < maxCurrentStageOrderWithParticipants) {
    throw new CustomError(NOT_ALLOWED, "You can't update the order of", 403)
  }

  const unUpdatedStages = currentStages.filter(
    (stage) =>
      !receivedStageNames.includes(stage.name) &&
      !receivedStageOrders.includes(stage.order),
  )

  return {
    ...unUpdatedStages,
    ...receivedStages.map((stage) => ({
      ...stage,
      id: new Types.ObjectId().toString(),
      participantsCount: 0,
    })),
  }
}
