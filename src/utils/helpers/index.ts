import { Except } from "type-fest"
import { INewStage, IStage } from "../types"
import { Types } from "mongoose"

export const createStagesHandler = (stages: Except<IStage, "id">[]) => {
  const stageTitles = stages.map((stage) => stage.name)
  const uniqueStageTitles = [...new Set(stageTitles)]

  const uniqueStages = uniqueStageTitles.map(
    (stageTitle) => stages.find((stage) => stage.name === stageTitle)!,
  )

  return uniqueStages.map((stage) => ({
    ...stage,
    id: new Types.ObjectId().toString(),
  }))
}

export const createNewStagesHandler = (stages: Except<INewStage, "id">[]) => {
  const stageTitles = stages.map((stage) => stage.name)
  const uniqueStageTitles = [...new Set(stageTitles)]

  const uniqueStages = uniqueStageTitles.map(
    (stageTitle) => stages.find((stage) => stage.name === stageTitle)!,
  )

  return uniqueStages.map((stage) => ({
    ...stage,
    id: new Types.ObjectId().toString(),
  }))
}
