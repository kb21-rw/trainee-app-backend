import Cohort from "../models/Cohort"
import { GetCohortDto } from "../utils/types"

export const getFormsQuery = async (
  searchString: string,
  cohort: GetCohortDto,
) => {
  const cohorts = await Cohort.aggregate([
    {
      $match: cohort,
    },
    {
      $lookup: {
        from: "forms",
        localField: "forms",
        foreignField: "_id",
        as: "cohortForms",
      },
    },
    {
      $lookup: {
        from: "forms",
        localField: "applicationForm",
        foreignField: "_id",
        as: "applicationFormDetails",
      },
    },
    {
      $unwind: {
        path: "$cohortForms",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$applicationFormDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        formsMatching: {
          $regexMatch: {
            input: "$cohortForms.name",
            regex: searchString,
            options: "i",
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        description: { $first: "$description" },
        applicationForm: { $first: "$applicationFormDetails" },
        forms: {
          $push: {
            $cond: {
              if: "$cohortForms",
              then: "$cohortForms",
              else: "$$REMOVE",
            },
          },
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        forms: {
          $map: {
            input: {
              $concatArrays: ["$forms", ["$applicationForm"]],
            },
            as: "form",
            in: {
              _id: "$$form._id",
              name: "$$form.name",
              description: "$$form.description",
              type: "$$form.type",
              isApplicationForm: {
                $cond: [
                  { $eq: ["$$form._id", "$applicationForm._id"] },
                  true,
                  false,
                ],
              },
              questions: {
                $size: "$$form.questionIds",
              },
            },
          },
        },
      },
    },
  ])

  return cohorts[0]
}
