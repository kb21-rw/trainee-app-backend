import { Document, Schema, model } from "mongoose"
import { IForm } from "./Form"
import { IUser } from "./User"
import { IStage } from "../utils/types"

export interface IParticipant {
  id: IUser["_id"]
  passedStages: string[]
  droppedStage: {
    id: string
    isConfirmed: boolean
  }
  feedbacks: { stageId: string; text: string }[]
}

export interface ICohort extends Document {
  id: string
  name: string
  description: string
  isActive: boolean
  applicants: IParticipant[]
  trainees: IParticipant[]
  coaches: IUser["_id"][]
  forms: IForm["_id"][]
  applicationForm: IForm["_id"] | null
  stages: IStage[]
  trainingStartDate: string
}

const CohortSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    stages: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, default: "" },
        participantsCount: { type: Number, default: 0 },
        _id: false,
      },
    ],
    trainingStartDate: {
      type: Date,
      require: true,
    },
    forms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Form",
      },
    ],
    applicants: [
      {
        id: { type: Schema.Types.ObjectId, ref: "User" },
        passedStages: [{ type: String }],
        droppedStage: {
          id: { type: String, default: null },
          isConfirmed: {
            type: Boolean,
            default: false,
          },
        },
        feedbacks: [
          {
            stageId: { type: String, required: true },
            text: { type: String },
          },
        ],
        _id: false,
      },
    ],
    trainees: [
      {
        id: { type: Schema.Types.ObjectId, ref: "User" },
        passedStages: [{ type: String }],
        droppedStage: {
          id: { type: String, default: null },
          isConfirmed: {
            type: Boolean,
            default: false,
          },
        },
        feedbacks: [
          {
            stageId: { type: String, required: true },
            text: { type: String },
          },
        ],
        _id: false,
      },
    ],
    coaches: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    applicationForm: {
      type: Schema.Types.ObjectId,
      ref: "Form",
      default: null,
    },
  },
  { timestamps: {} },
)

CohortSchema.index({ name: "text", description: "text" })

export default model<ICohort>("Cohort", CohortSchema)
