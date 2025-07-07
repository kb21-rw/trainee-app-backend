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
    // Lookup forms (may be empty)
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
    {
      $lookup: {
        from: "forms",
        localField: "forms",
        foreignField: "_id",
        as: "forms",
      },
    },
    // Lookup questions and responses only if forms exist
    {
      $lookup: {
        from: "questions",
        localField: "forms.questionIds",
        foreignField: "_id",
        as: "questions",
      },
    },
    {
      $lookup: {
        from: "responses",
        localField: "questions.responseIds",
        foreignField: "_id",
        as: "responses",
      },
    },
    // Group everything for output
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
        applicants: {
          $ifNull: ["$traineesInfo", []],
        },
        coaches: {
          $ifNull: ["$coachesUserInfo", []],
        },
        forms: {
          $ifNull: ["$forms", []],
        },
        questions: {
          $ifNull: ["$questions", []],
        },
        responses: {
          $ifNull: ["$responses", []],
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $set: {
        forms: {
          $setUnion: ["$forms"],
        },
        questions: {
          $setUnion: ["$questions"],
        },
      },
    },
    // Combine questions with their respective forms
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
                    $filter: {
                      input: "$questions",
                      as: "question",
                      cond: {
                        $and: [
                          {
                            $eq: ["$$question.formId", "$$form._id"],
                          },
                          {
                            $ne: [
                              {
                                $ifNull: ["$$question._id", null],
                              },
                              null,
                            ],
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
    // Combine responses with their respective questions
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
                      input: "$$form.questions",
                      as: "question",
                      in: {
                        $mergeObjects: [
                          "$$question",
                          {
                            responses: {
                              $filter: {
                                input: "$responses",
                                as: "response",
                                cond: {
                                  $and: [
                                    {
                                      $eq: [
                                        "$$response.questionId",
                                        "$$question._id",
                                      ],
                                    },
                                    coachId
                                      ? {
                                          $eq: [
                                            "$$response.user.coach._id",
                                            new ObjectId(coachId),
                                          ],
                                        }
                                      : { $eq: ["", ""] },
                                    {
                                      $in: [
                                        "$$response.user._id",
                                        {
                                          $ifNull: [
                                            {
                                              $map: {
                                                input: `$${overviewType.toLocaleLowerCase()}s`,
                                                as: "participant",
                                                in: "$$participant.id",
                                              },
                                            },
                                            [],
                                          ],
                                        },
                                      ],
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
        questions: 0,
        responses: 0,
      },
    },
  ])
  return overview[0]
}
