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
        as: "forms",
      },
    },
    {
      $unwind: {
        path: "$forms",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        formsMatching: {
          $regexMatch: {
            input: "$forms.name",
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
        description: { $first: "description" },
        forms: {
          $push: {
            $cond: {
              if: "$formsMatching",
              then: "$forms",
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
            input: "$forms",
            as: "form",
            in: {
              _id: "$$form._id",
              name: "$$form.name",
              description: "$$form.description",
              type: "$$form.type",
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
