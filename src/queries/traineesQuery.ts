import Cohort from "../models/Cohort"
import mongoose, { Types } from "mongoose"
import User from "../models/User"
import { Role } from "../utils/types"

export const getTraineesWithDetailsQuery = async (
  cohortId: string,
  sortBy: string,
  traineesPerPage: number,
) => {
  const trainees = await Cohort.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(cohortId) },
    },
    {
      $unwind: "$trainees", // Flatten the trainees array
    },
    {
      $lookup: {
        from: "users", // Join with the User collection to get trainee details
        localField: "trainees.id",
        foreignField: "_id",
        as: "traineeDetails",
      },
    },
    {
      $lookup: {
        from: "users", // Join with the User collection to get coach details
        localField: "trainees.coach",
        foreignField: "_id",
        as: "coachDetails",
      },
    },
    {
      $addFields: {
        traineeDetails: { $arrayElemAt: ["$traineeDetails", 0] },
        coachDetails: {
          $cond: {
            if: { $eq: [{ $size: "$coachDetails" }, 0] },
            then: null, // Set coach to null if no matching coach details
            else: { $arrayElemAt: ["$coachDetails", 0] }, // Otherwise, extract the first element
          },
        },
        currentStage: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$stages", // Iterate over the cohort's stages
                    as: "stage",
                    cond: {
                      $eq: ["$$stage.id", "$trainees.droppedStage.id"], // the dropped stage is the current stage whether confirmed or not
                    },
                  },
                },
                0,
              ],
            },
            { name: "No current stage" }, // Default value if no stage is found
          ],
        },
        passedStages: {
          $map: {
            input: "$trainees.passedStages",
            as: "passedStageId",
            in: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$stages",
                    as: "stage",
                    cond: { $eq: ["$$stage.id", "$$passedStageId"] },
                  },
                },
                0,
              ],
            },
          },
        },
        isActive: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$trainees.droppedStage.id", null] },
                { $eq: ["$trainees.droppedStage.isConfirmed", true] },
              ],
            },
            then: false, // Not active if dropped stage is confirmed
            else: true, // Active otherwise
          },
        },
      },
    },

    {
      $project: {
        id: "$traineeDetails._id",
        name: "$traineeDetails.name",
        coach: "$coachDetails.name",
        stage: "$currentStage.name",
        passedStages: "$passedStages",
        isActive: { $ifNull: ["$isActive", true] },
      },
    },
    {
      $sort: { [sortBy]: 1 },
    },
    {
      $limit: traineesPerPage,
    },
  ])

  return trainees
}

export const getTraineesForCoachQuery = async (
  coachId: Types.ObjectId,
  searchString: string,
  sortBy: string,
  traineesPerPage: number,
) => {
  const trainees = await User.aggregate([
    {
      $match: {
        coach: coachId,
        role: Role.Trainee,
        $or: [{ name: { $regex: new RegExp(searchString, "i") } }],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "coach",
        foreignField: "_id",
        as: "coach",
      },
    },
    {
      $addFields: {
        coach: {
          $cond: {
            if: { $eq: [{ $size: "$coach" }, 0] },
            then: [{}],
            else: "$coach",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        coach: {
          $cond: {
            if: { $eq: [{ $size: "$coach" }, 0] },
            then: {},
            else: {
              $arrayElemAt: ["$coach", 0],
            },
          },
        },
      },
    },
    {
      $sort: { [sortBy]: 1 },
    },
    {
      $limit: traineesPerPage,
    },
  ])
  return trainees
}
