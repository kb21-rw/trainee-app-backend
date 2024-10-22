import Cohort, { ICohort } from "../models/Cohort";
import { FormType, ICohortOverviewRequest } from "../utils/types";
import { ObjectId } from "mongodb";

export const getCohortQuery = async (cohortId: string) => {
  return await Cohort.findById(cohortId);
};

export const getCohortsQuery = async (searchString: string) => {
  const cohorts: ICohort[] = await Cohort.aggregate([
    {
      $match: { name: { $regex: new RegExp(searchString, "i") } },
    },
    {
      $project: {
        name: 1,
        description: 1,
        stages: { $size: "$stages" },
        applicants: { $size: "$applicants" },
        trainees: { $size: "$trainees" },
        coaches: { $size: "$coaches" },
        forms: { $size: "$forms" },
      },
    },
  ]);
  return cohorts;
};

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
      $set: {
        forms: {
          $concatArrays: [
            overviewType === FormType.Applicant ? ["$applicationForm.id"] : [],
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
        applicants: {
          $first: "$applicants",
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
                        $eq: ["$$question.formId", "$$form._id"],
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
                                        "$$response.user._id", // Use $in to check if user._id is in the list of participant ids
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
    // Remove redundant arrays
    {
      $project: {
        questions: 0,
        responses: 0,
      },
    },
  ]);
  return overview;
};
