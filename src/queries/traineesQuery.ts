import { Types } from "mongoose"
import { Role } from "../utils/types"
import Trainee from "../models/Trainee"

export const getTraineesQuery = async (
  searchString: string,
  sortBy: string,
  traineesPerPage: number,
) => {
  const trainees = await Trainee.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "trainee",
      },
    },
    { $unwind: "$trainee" },

    // Lookup coach document
    {
      $lookup: {
        from: "coaches",
        localField: "coachId",
        foreignField: "_id",
        as: "coachDoc",
      },
    },
    { $unwind: { path: "$coachDoc", preserveNullAndEmptyArrays: true } },

    // Lookup coach user details
    {
      $lookup: {
        from: "users",
        localField: "coachDoc.userId",
        foreignField: "_id",
        as: "coach",
      },
    },
    { $unwind: { path: "$coachUser", preserveNullAndEmptyArrays: true } },

    // Filter by search string and role
    {
      $match: {
        "trainee.name": { $regex: new RegExp(searchString, "i") },
        "trainee.role": Role.Trainee,
      },
    },
    {
      $project: {
        _id: 1,
        name: "$trainee.name",
        email: "$trainee.email",
        status: 1,
        role: "$trainee.role",
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

export const getTraineesForCoachQuery = async (
  coachId: Types.ObjectId,
  searchString: string,
  sortBy: string,
  traineesPerPage: number,
) => {
  const trainees = await Trainee.aggregate([
    {
      $match: {
        coachId: coachId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "trainee",
      },
    },
    { $unwind: "$trainee" },

    // Lookup coach document
    {
      $lookup: {
        from: "coaches",
        localField: "coachId",
        foreignField: "_id",
        as: "coachDoc",
      },
    },
    { $unwind: { path: "$coachDoc", preserveNullAndEmptyArrays: true } },

    // Lookup coach user details
    {
      $lookup: {
        from: "users",
        localField: "coachDoc.userId",
        foreignField: "_id",
        as: "coach",
      },
    },
    { $unwind: { path: "$coachUser", preserveNullAndEmptyArrays: true } },

    // Filter by search string and role
    {
      $match: {
        "trainee.name": { $regex: new RegExp(searchString, "i") },
        "trainee.role": Role.Trainee,
      },
    },
    {
      $project: {
        _id: 1,
        name: "$trainee.name",
        email: "$trainee.email",
        status: 1,
        role: "$trainee.role",
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
