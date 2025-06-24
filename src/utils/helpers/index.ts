import { Except } from "type-fest"
import { IStage, StageDto } from "../types"
import { Types } from "mongoose"
import CustomError from "../../middlewares/customError"
import { COHORT_BAD_REQUEST } from "../errorCodes"

export const validatePreselectionStages = (uniqueStages: StageDto[]) => {
  const preselectionStages = uniqueStages.filter(
    (stage) => stage.isPreselection,
  )

  if (preselectionStages.length === 0) {
    throw new CustomError(
      COHORT_BAD_REQUEST,
      "You must have at least 1 preselection stage",
      400,
    )
  }

  const lastPreselectionIndex = uniqueStages.findLastIndex(
    (stage) => stage.isPreselection,
  )

  if (lastPreselectionIndex >= preselectionStages.length) {
    throw new CustomError(
      COHORT_BAD_REQUEST,
      "Preselection stage cannot be after a non preselection one",
      400,
    )
  }
}

export const createStagesHandler = (stages: Except<IStage, "id">[]) => {
  const stageTitles = stages.map((stage) => stage.name)
  const uniqueStageTitles = [...new Set(stageTitles)]

  const uniqueStages = uniqueStageTitles.map(
    (stageTitle) => stages.find((stage) => stage.name === stageTitle)!,
  )

  validatePreselectionStages(uniqueStages)

  const currentStage = { ...uniqueStages[0], isCurrent: true }
  uniqueStages[0] = currentStage // Set the first stage as current

  return uniqueStages.map((stage) => ({
    ...stage,
    id: new Types.ObjectId().toString(),
  }))
}
