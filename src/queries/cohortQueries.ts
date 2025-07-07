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
  const cohortDoc = await Cohort.findById(cohortId).lean()
  if (!cohortDoc) throw new Error("Cohort not found")

  // Find the last preselection stage
  const preselectionStages = cohortDoc.stages.filter(
    (stage) => stage.isPreselection,
  )
  const lastPreselectionStage =
    preselectionStages[preselectionStages.length - 1]
  const lastPreselectionStageId = lastPreselectionStage?.id

  // Build the match condition for trainees
  let traineeMatch: any = {
    $expr: { $eq: ["$cohortId", new ObjectId(cohortId)] },
  }
  if (lastPreselectionStageId) {
    if (overviewType === FormType.Trainee) {
      traineeMatch = {
        $and: [
          { $expr: { $eq: ["$cohortId", new ObjectId(cohortId)] } },
          { passedStages: lastPreselectionStageId },
        ],
      }
    } else {
      traineeMatch = {
        $and: [
          { $expr: { $eq: ["$cohortId", new ObjectId(cohortId)] } },
          { passedStages: { $ne: lastPreselectionStageId } },
        ],
      }
    }
  }

  const overview = await Cohort.aggregate([
    { $match: { _id: new ObjectId(cohortId) } },
    // Lookup trainees from the Trainee collection for this cohort, filtered by passedStages
    {
      $lookup: {
        from: "trainees",
        let: { cohortId: "$_id" },
        pipeline: [
          { $match: traineeMatch },
          // Join user info
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          // Join coach info
          {
            $lookup: {
              from: "users",
              localField: "coachId",
              foreignField: "_id",
              as: "coach",
            },
          },
          { $unwind: { path: "$coach", preserveNullAndEmptyArrays: true } },
          // Optional: project only the fields you need (user, coach, passedStages, stage)
          {
            $project: {
              user: 1,
              coach: 1,
              passedStages: 1,
              stage: 1,
            },
          },
        ],
        as: "traineesInfo",
      },
    },

    {
      $set: {
        participantsInfo: "$traineesInfo",
        participants: {
          $map: {
            input: "$traineesInfo",
            as: "t",
            in: {
              id: "$$t.user._id",
              droppedStage: {
                id: "$$t.stage", // or full object if you store more
                isConfirmed: false, // adjust this flag if needed
              },
              passedStages: "$$t.passedStages", // if you don’t store passedStages, make it empty or infer from logic
            },
          },
        },
      },
    },

    // Lookup coaches (user info)
    {
      $lookup: {
        from: "users",
        localField: "coaches.id",
        foreignField: "_id",
        as: "coaches",
      },
    },

    // Prepare forms array
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

    // Lookup forms
    {
      $lookup: {
        from: "forms",
        localField: "forms",
        foreignField: "_id",
        as: "forms",
      },
    },
    { $unwind: { path: "$forms" } },

    // Filter forms by type
    {
      $match: {
        $or: [
          { "forms.type": overviewType },
          { "forms.type": FormType.Application },
        ],
      },
    },

    // Lookup questions for each form
    {
      $lookup: {
        from: "questions",
        localField: "forms.questionIds",
        foreignField: "_id",
        as: "questions",
      },
    },
    { $unwind: { path: "$questions", preserveNullAndEmptyArrays: true } },

    // Lookup responses for each question
    {
      $lookup: {
        from: "responses",
        localField: "questions.responseIds",
        foreignField: "_id",
        as: "responses",
      },
    },
    { $unwind: { path: "$responses", preserveNullAndEmptyArrays: true } },

    // Lookup user for each response
    {
      $lookup: {
        from: "users",
        localField: "responses.userId",
        foreignField: "_id",
        as: "responses.user",
      },
    },
    { $unwind: { path: "$responses.user", preserveNullAndEmptyArrays: true } },

    // Lookup coach for each response's user
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

    // Add formId and questionId for easier mapping
    {
      $addFields: {
        "questions.formId": "$forms._id",
        "responses.questionId": "$questions._id",
      },
    },

    // Group everything back into a single document
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
        participantsInfo: { $first: "$participantsInfo" },
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

    // Remove duplicates
    {
      $set: {
        forms: { $setUnion: ["$forms"] },
        questions: { $setUnion: ["$questions"] },
      },
    },

    // Attach questions to forms
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
                          { $eq: ["$$question.formId", "$$form._id"] },
                          {
                            $ne: [{ $ifNull: ["$$question._id", null] }, null],
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

    // Attach responses to questions
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
                                    // Only include responses from users who are trainees in this cohort
                                    {
                                      $in: [
                                        "$$response.user._id",
                                        {
                                          $ifNull: [
                                            {
                                              $map: {
                                                input: "$participantsInfo",
                                                as: "trainee",
                                                in: "$$trainee.user._id",
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

    // Clean up
    {
      $project: {
        questions: 0,
        responses: 0,
      },
    },
  ])

  console.log(
    "Participants Info (from Trainee):",
    overview[0]?.participantsInfo,
  )
  return overview[0]
}
