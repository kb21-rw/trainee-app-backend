import { Document, model, Schema } from "mongoose"
import { IForm } from "./Form"
import { IUser } from "./User"
import { ICoach, INewStage, StageName } from "../utils/types"

export interface INewCohort extends Document {
  id: string
  name: string
  description: string
  isActive: boolean
  startDate: string
  endDate: string
  coaches: ICoach[] // refer to coach IDs
  trainees: IUser["_id"][] // refer to trainee IDs in trainees model
  stages: INewStage[]
  cohortNumber: string
  forms: IForm["_id"][]
}

const NewCohortSchema = new Schema(
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    coaches: [
      {
        id: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        applicants: [{ type: Schema.Types.ObjectId, ref: "User" }],
        trainees: [{ type: Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    trainees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    stages: [
      {
        name: {
          type: String,
          enum: Object.values(StageName),
          required: true,
          unique: true,
        },
        order: { type: Number, required: true, unique: true },
        participantsCount: { type: Number, default: 0 },
        isPreselection: { type: Boolean, default: false },
        isCurrent: { type: Boolean, default: false },
      },
    ],
    cohortNumber: {
      type: String,
      unique: true,
      required: true,
    },
    forms: [{ type: Schema.Types.ObjectId, ref: "Form" }],
  },
  { timestamps: true },
)

export const NewCohort = model<INewCohort>("NewCohort", NewCohortSchema)
// Exporting the model allows it to be used in other parts of the application
export default NewCohort
