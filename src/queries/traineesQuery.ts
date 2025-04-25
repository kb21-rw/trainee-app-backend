import Cohort from "../models/Cohort"
import mongoose, { Types } from "mongoose"
import User from "../models/User"
import { Role } from "../utils/types"

export const getTraineesQuery = async (
  searchString: string,
  sortBy: string,
  traineesPerPage: number,
) => {
  const trainees = await User.aggregate([
    {
      $match: {
        $or: [{ name: { $regex: new RegExp(searchString, "i") } }],
        role: Role.Trainee,
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

export const getTraineesWithDetailsQuery = async (cohortId: string) => {
  const trainees = await Cohort.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(cohortId) },
    },
    {
      $unwind: "$trainees",
    },
    {
      $lookup: {
        from: "users",
        localField: "trainees.id",
        foreignField: "_id",
        as: "traineeDetails",
      },
    },
    {
      $lookup: {
        from: "users",
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
            then: null,
            else: { $arrayElemAt: ["$coachDetails", 0] },
          },
        },
        currentStage: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$trainees.droppedStage.id", null] },
                { $eq: ["$trainees.droppedStage.isConfirmed", true] },
              ],
            },
            then: "$trainees.droppedStage.id",
            else: { $arrayElemAt: ["$trainees.passedStages", -1] },
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
            then: false,
            else: true,
          },
        },
      },
    },
    {
      $project: {
        id: "$traineeDetails._id",
        name: "$traineeDetails.name",
        coach: "$coachDetails.name",
        stage: "$currentStage",
        isActive: { $ifNull: ["$isActive", 1] },
      },
    },
    {
      $group: {
        _id: "$_id",
        trainees: {
          $push: {
            id: "$id",
            name: "$name",
            coach: "$coach",
            stage: "$currentStage",
            isActive: "$isActive",
          },
        },
      },
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
