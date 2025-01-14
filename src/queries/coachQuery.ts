import { ObjectId } from "mongodb"
import Cohort from "../models/Cohort"

export const getCoachesQuery = async (
  cohortId: { _id: ObjectId } | { isActive: boolean } = { isActive: true },
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
    {
      $project: {
        _id: 1,
        name: 1,
        isActive: 1,
        coaches: 1,
      },
    },
  ])

  return cohort[0]
}
