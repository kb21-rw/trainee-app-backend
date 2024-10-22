import { Role } from "../utils/types";
import CustomError from "../middlewares/customError";
import User from "../models/User";
import { getCoachesQuery } from "../queries/coachQuery";
import {
  DUPLICATE_USER,
  NOT_ALLOWED,
  USER_NOT_FOUND,
} from "../utils/errorCodes";
import { getCohortService } from "./cohortService";
import { getUserService } from "./userService";

export const getCoachesService = async (
  role: Role,
  {
    searchString,
    sortBy,
    coachesPerPage,
  }: { searchString: string; sortBy: string; coachesPerPage: number }
) => {
  if (role !== Role.Admin) {
    throw new CustomError(NOT_ALLOWED, "Only admins can view coaches", 403);
  }

  const coaches = await getCoachesQuery(searchString, sortBy, coachesPerPage);
  return coaches;
};

export const updateCoachOrAdminService = async (
  userId: string,
  { name, email, role }: { name: string; email: string; role: Role }
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError(USER_NOT_FOUND, "User not found", 404);
  }

  if (name) {
    user.name = name;
  }

  if (email) {
    user.email = email;
  }

  if (role) {
    user.role = role;
  }

  await user.save();
  return user;
};

export const addCoachToCohortService = async (coachId: string) => {
  const coach = await getUserService({ _id: coachId });
  const currentCohort = await getCohortService({ isActive: true });

  const coachExists = currentCohort.coaches.find(
    (coach) => coach.toString() === coachId
  );

  if (coachExists) {
    throw new CustomError(
      `${coach.name} is already a coach in the cohort`,
      DUPLICATE_USER,
      409
    );
  }

  if (coach.role !== Role.Coach) {
    throw new CustomError(
      `${coach.role}s can not be added as coaches`,
      NOT_ALLOWED,
      403
    );
  }

  currentCohort.coaches.push(coachId);
  await currentCohort.save();

  return coach;
};
