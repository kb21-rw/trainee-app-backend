import { ObjectId } from "mongodb"
import Form from "../models/Form"

export const getUserFormResponsesQuery = async (
  formId: string,
  userId: string,
) => {
  const forms = await Form.aggregate([
    {
      $match: {
        _id: new ObjectId(formId),
      },
    },
    {
      $lookup: {
        from: "questions",
        localField: "questionIds",
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
        let: {
          responseIds: "$questions.responseIds",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: ["$_id", "$$responseIds"],
                  },
                  {
                    $eq: ["$userId", new ObjectId(userId)],
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              value: 1,
            },
          },
        ],
        as: "questions.response",
      },
    },
    {
      $addFields: {
        "questions.response": {
          $cond: {
            if: {
              $gt: [
                {
                  $size: "$questions.response",
                },
                0,
              ],
            },
            // If response array is not empty
            then: {
              $arrayElemAt: ["$questions.response.value", 0],
            },
            // Extract the value
            else: null, // Otherwise, set response to null
          },
        },
      },
    },
    {
      $addFields: {
        "questions.responses": {
          $map: {
            input: "$questions.responses",
            as: "response",
            in: "$$response.value",
          },
        },
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
        type: {
          $first: "$type",
        },
        startDate: {
          $first: "$startDate",
        },
        endDate: {
          $first: "$endDate",
        },
        stages: {
          $first: "$stages",
        },
        createdAt: {
          $first: "$createdAt",
        },
        updatedAt: {
          $first: "$updatedAt",
        },
        questions: {
          $push: "$questions",
        },
      },
    },
    {
      $project: {
        questionIds: 0,
        "questions.responseIds": 0,
      },
    },
  ])

  return forms[0]
}
