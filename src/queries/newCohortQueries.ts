import NewCohort, { INewCohort } from "../models/NewCohort"

export const getCohortsQuery = async (searchString: string) => {
  const cohorts: INewCohort[] = await NewCohort.aggregate([
    {
      $match: { name: { $regex: new RegExp(searchString, "i") } },
    },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        name: 1,
        stages: 1,
        isActive: 1,
        description: 1,
        startDate: 1,
        endDate: 1,
        trainees: { $size: "$trainees" },
        coaches: { $size: "$coaches" },
        forms: { $size: "$forms" },
        cohortNumber: "$cohortNumber",
      },
    },
  ])
  return cohorts
}
