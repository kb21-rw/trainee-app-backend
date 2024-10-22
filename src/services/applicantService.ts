import CustomError from "../middlewares/customError";
import { getApplicantsQuery } from "../queries/applicantQueries";
import { USER_NOT_FOUND } from "../utils/errorCodes";
import { updateUserDto } from "../utils/types";
import { getCohortService } from "./cohortService";
import { updateUserService } from "./userService";

export const getApplicantsService = async (
  {
    searchString,
    sortBy,
    applicantsPerPage,
  }: {
    searchString: string;
    sortBy: string;
    applicantsPerPage: number;
  },
  cohortId?: string
) => {
  return await getApplicantsQuery(
    { searchStringRegex: `.*${searchString}.*`, sortBy, applicantsPerPage },
    cohortId ? { id: cohortId } : undefined
  );
};

export const updateApplicantService = async (
  applicantId: string,
  updates: updateUserDto
) => {
  const currentCohort = await getCohortService({ isActive: true });
  const applicant = currentCohort.applicants.find(
    (applicant) => applicant.id.toString() === applicantId
  );
  
  if (!applicant) {
    throw new CustomError(
      USER_NOT_FOUND,
      "Applicant not found in the current cohort",
      404
    );
  }
  
  if(updates.coach) {
    const coach = currentCohort.coaches.find(
      (coach) => coach.toString() === coach
    );
    
    if (!coach) {
      throw new CustomError(
        USER_NOT_FOUND,
        "Coach not found in the current cohort",
        404
      );
    }
  }

  return updateUserService(applicantId, updates);
};
