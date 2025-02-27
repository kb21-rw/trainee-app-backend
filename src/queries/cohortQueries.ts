import Cohort, { ICohort } from "../models/Cohort"
import { FormType, ICohortOverviewRequest } from "../utils/types"
import { ObjectId } from "mongodb"

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
        trainingStartDate: 1,
        applicants: { $size: "$applicants" },
        trainees: { $size: "$trainees" },
        coaches: { $size: "$coaches" },
        forms: { $size: "$forms" },
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
    {
      $match: {
        _id: new ObjectId(cohortId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "applicants.id",
        foreignField: "_id",
        as: "participantsInfo",
      },
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
      $set: {
        forms: {
          $concatArrays: [
            overviewType === FormType.Applicant ? ["$applicationForm"] : [],
            "$forms",
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
    {
      $unwind: {
        path: "$forms",
      },
    },
    {
      $match: {
        $or: [
          { "forms.type": overviewType },
          { "forms.type": FormType.Application },
        ],
      },
    },
    {
      $lookup: {
        from: "questions",
        localField: "forms.questionIds",
        foreignField: "_id",
        as: "questions",
      },
    },
    {
      $unwind: {
        path: "$questions",
        preserveNullAndEmptyArrays: true,
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
    {
      $unwind: {
        path: "$responses",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "responses.userId",
        foreignField: "_id",
        as: "responses.user",
      },
    },
    {
      $unwind: {
        path: "$responses.user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "responses.user.coach",
        foreignField: "_id",
        as: "responses.user.coach",
      },
    },
    {
      $unwind: {
        path: "$responses.user.coach",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "questions.formId": "$forms._id",
        "responses.questionId": "$questions._id",
      },
    },
    {
      $group: {
        _id: "$_id",
        name: {
          $first: "$name",
        },
        description: {
          $first: "$description",
        },
        isActive: {
          $first: "$isActive",
        },
        stages: {
          $first: "$stages",
        },
        applicationForm: {
          $first: "$applicationForm",
        },
        applicants: {
          $first: "$applicants",
        },
        participantsInfo: {
          $first: "$participantsInfo",
        },
        trainees: {
          $first: "$trainees",
        },
        coaches: {
          $first: "$coaches",
        },
        forms: {
          $push: "$forms",
        },
        questions: {
          $push: "$questions",
        },
        responses: {
          $push: "$responses",
        },
        createdAt: {
          $first: "$createdAt",
        },
        updatedAt: {
          $first: "$updatedAt",
        },
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
                                          $map: {
                                            input: `$${overviewType.toLocaleLowerCase()}s`,
                                            as: "participant",
                                            in: "$$participant.id",
                                          },
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
