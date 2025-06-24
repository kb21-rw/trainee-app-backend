import Cohort, { ICohort } from "../models/Cohort"

export const getCohortsQuery = async (searchString: string) => {
  const cohorts: ICohort[] = await Cohort.aggregate([
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
        applicationForm: "$applicationForm",
        cohortNumber: "$cohortNumber",
      },
    },
  ])
  return cohorts
}
