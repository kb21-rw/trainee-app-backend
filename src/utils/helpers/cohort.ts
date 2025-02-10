import { Types } from "mongoose"
import CustomError from "../../middlewares/customError"
import Cohort, { ICohort } from "../../models/Cohort"
import { COHORT_NOT_FOUND, DUPLICATE_DOCUMENT } from "../errorCodes"
import { IStage, Role } from "../types"
import { SetOptional } from "type-fest"

export const getCurrentCohort = async () => {
  const currentCohort = await Cohort.findOne({ isActive: true })

  if (!currentCohort) {
    throw new CustomError(COHORT_NOT_FOUND, "Active cohort not found", 404)
  }

  return currentCohort
}

export const updateStagesHandler = (
  cohortStages: IStage[],
  receivedStages: SetOptional<IStage, "id">[],
) => {
  const updatedStages = receivedStages.filter((stage) => stage.id)
  const addedStages = receivedStages.filter((stage) => !stage.id)

  // check for duplicates in new stages and throw if any
  const cohortStageTitles = cohortStages.map((stage) => stage.name)
  addedStages
    .map((stage) => stage.name)
    .forEach((addedStageTitle) => {
      if (cohortStageTitles.includes(addedStageTitle)) {
        throw new CustomError(
          DUPLICATE_DOCUMENT,
          `'${addedStageTitle}' already exists in the stages`,
          409,
        )
      }
    })

  // update existing stages
  const updatedCohortStages = cohortStages.map((stage) => {
    const updatedStage = updatedStages.find(
      (updatedStage) => updatedStage.id === stage.id.toString(),
    )
    return updatedStage ? { ...updatedStage, id: stage.id } : stage
  })

  // add id property to every stage
  updatedCohortStages.push(
    ...addedStages.map((stage) => ({
      ...stage,
      id: new Types.ObjectId().toString(),
    })),
  )

  return updatedCohortStages
}

export const isUserInCohort = (cohort: ICohort, userId: string, role: Role) => {
  if (role === Role.Applicant) {
    return (
      cohort.applicants.find(
        (applicant) => applicant.id.toString() === userId,
      ) ?? false
    )
  }

  if (role === Role.Trainee) {
    return (
      cohort.trainees.find((trainee) => trainee.id.toString() === userId) ??
      false
    )
  }

  if (role === Role.Coach) {
    return (
      cohort.coaches.find((coachId) => coachId.toString() === userId) ?? false
    )
  }

  return false
}
