import { Types } from "mongoose"
import CustomError from "../middlewares/customError"
import { DUPLICATE_DOCUMENT, NOT_ALLOWED } from "../utils/errorCodes"
import { IStage, StageDto } from "../utils/types"

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
