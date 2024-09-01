import { Types } from "mongoose";
import CustomError from "../../middlewares/customError";
import Cohort from "../../models/Cohort";
import { COHORT_NOT_FOUND, DUPLICATE_DOCUMENT } from "../errorCodes";
import { IStage } from "../types";
import { SetOptional } from "type-fest";

export const getCurrentCohort = async () => {
  const currentCohort = await Cohort.findOne({ isActive: true });

  if (!currentCohort) {
    throw new CustomError(COHORT_NOT_FOUND, "Active cohort not found", 404);
  }

  return currentCohort;
};

export const updateStagesHandler = (
  cohortStages: IStage[],
  receivedStages: SetOptional<IStage, "id">[]
) => {
  // check for duplicates
  const cohortStageTitles = cohortStages.map((stage) => stage.name);
  receivedStages
    .map((stage) => stage.name)
    .forEach((addedStageTitle) => {
      if (cohortStageTitles.includes(addedStageTitle)) {
        throw new CustomError(
          DUPLICATE_DOCUMENT,
          `'${addedStageTitle}' already exists in the stages`,
          409
        );
      }
    });

  const updatedStages = receivedStages.filter((stage) => stage.id);
  const addedStages = receivedStages.filter((stage) => !stage.id);

  // update existing stages
  const updatedCohortStages = cohortStages.map((stage) => {
    const updatedStage = updatedStages.find(
      (updatedStage) => updatedStage.id === stage.id.toString()
    );
    return updatedStage ? { ...updatedStage, id: stage.id } : stage;
  });

  // add id property to every stage
  updatedCohortStages.push(
    ...addedStages.map((stage) => ({
      ...stage,
      id: new Types.ObjectId().toString(),
    }))
  );

  return updatedCohortStages;
};
