import { ObjectId } from "mongodb";
import Cohort from "../models/Cohort";

export const getCoachesQuery = async (
  cohortId: { _id: ObjectId } | { isActive: boolean } = { isActive: true }
) => {
  const cohort = await Cohort.aggregate([
    {
      $match: cohortId,
    },
    {
      $lookup: {
        from: "users",
        localField: "coaches",
        foreignField: "_id",
        as: "coaches",
      },
    },
  ]);

  return cohort[0]?.coaches ?? [];
};
