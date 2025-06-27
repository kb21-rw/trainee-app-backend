import CustomError from "../../middlewares/customError"
import {
  COHORT_BAD_REQUEST,
  COHORT_NOT_FOUND,
  DUPLICATE_DOCUMENT,
  NOT_ALLOWED,
} from "../errorCodes"
import { IStage, StageDto } from "../types"
import Cohort from "../../models/Cohort"
import { Types } from "mongoose"
import { Except } from "type-fest"

export const getCurrentCohort = async () => {
  const currentCohort = await Cohort.findOne({ isActive: true })

  if (!currentCohort) {
    throw new CustomError(COHORT_NOT_FOUND, "Active cohort not found", 404)
  }

  return currentCohort
}

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

export const updateStagesHandler = (
  currentStages: IStage[],
  receivedStages: StageDto[],
) => {
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
