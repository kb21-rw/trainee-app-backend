import { ObjectId } from "mongodb"
import Cohort, { ICohort } from "../models/Cohort"
import { FormType, ICohortOverviewRequest } from "../utils/types"

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

export const getCohortOverviewQuery = async ({
  cohortId,
  overviewType,
  coachId,
}: ICohortOverviewRequest) => {
  const overview = await Cohort.aggregate([
    { $match: { _id: new ObjectId(cohortId) } },

    // Lookup trainees and their user info
    {
      $lookup: {
        from: "trainees",
        localField: "trainees",
        foreignField: "_id",
        as: "traineesInfo",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "traineesInfo.userId",
        foreignField: "_id",
        as: "traineesUserInfo",
      },
    },
    // Lookup coaches and their user info (may be empty)
    {
      $lookup: {
        from: "coaches",
        localField: "coaches",
        foreignField: "_id",
        as: "coachesInfo",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "coachesInfo.userId",
        foreignField: "_id",
        as: "coachesUserInfo",
      },
    },

    {
      $set: {
        forms: {
          $ifNull: [
            {
              $concatArrays: [
                overviewType === FormType.Applicant ? ["$applicationForm"] : [],
                { $ifNull: ["$forms", []] },
              ],
            },
            [],
          ],
        },
      },
    },
    // Lookup forms
    {
      $lookup: {
        from: "forms",
        localField: "forms",
        foreignField: "_id",
        as: "forms",
      },
    },
    // Lookup all questions for all forms
    {
      $lookup: {
        from: "questions",
        localField: "forms.questionIds",
        foreignField: "_id",
        as: "allQuestions",
      },
    },
    // Lookup all responses for all questions using responseIds
    {
      $lookup: {
        from: "responses",
        localField: "allQuestions.responseIds",
        foreignField: "_id",
        as: "allResponses",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "allResponses.userId",
        foreignField: "_id",
        as: "allResponseUsers",
      },
    },
    {
      $set: {
        participantIds: {
          $map: {
            input:
              overviewType === FormType.Applicant
                ? "$traineesUserInfo"
                : overviewType === FormType.Trainee
                  ? "$traineesUserInfo"
                  : "$coachesUserInfo",
            as: "participant",
            in: "$$participant._id",
          },
        },
      },
    },
    // Process each form to include its questions with responses
    {
      $set: {
        forms: {
          $map: {
            input: "$forms",
            as: "form",
            in: {
              $mergeObjects: [
                "$$form",
                {
                  questions: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$allQuestions",
                          as: "question",
                          cond: {
                            $in: [
                              "$$question._id",
                              { $ifNull: ["$$form.questionIds", []] },
                            ],
                          },
                        },
                      },
                      as: "question",
                      in: {
                        $mergeObjects: [
                          "$$question",
                          {
                            responses: {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$allResponses",
                                    as: "response",
                                    cond: {
                                      $and: [
                                        // Response is in this question's responseIds
                                        {
                                          $in: [
                                            "$$response._id",
                                            {
                                              $ifNull: [
                                                "$$question.responseIds",
                                                [],
                                              ],
                                            },
                                          ],
                                        },

                                        coachId
                                          ? {
                                              $eq: [
                                                "$$response.user.coach._id",
                                                new ObjectId(coachId),
                                              ],
                                            }
                                          : { $literal: true },

                                        {
                                          $in: [
                                            "$$response.userId",
                                            {
                                              $ifNull: ["$participantIds", []],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                                as: "response",
                                in: {
                                  $mergeObjects: [
                                    "$$response",
                                    {
                                      user: {
                                        $arrayElemAt: [
                                          {
                                            $filter: {
                                              input: "$allResponseUsers",
                                              as: "user",
                                              cond: {
                                                $eq: [
                                                  "$$user._id",
                                                  "$$response.userId",
                                                ],
                                              },
                                            },
                                          },
                                          0,
                                        ],
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        isActive: 1,
        stages: 1,
        applicationForm: 1,
        participantsInfo: "$traineesUserInfo",
        trainees: {
          $ifNull: ["$traineesInfo", []],
        },
        coaches: {
          $ifNull: ["$coachesUserInfo", []],
        },
        forms: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ])

  return overview[0]
}
