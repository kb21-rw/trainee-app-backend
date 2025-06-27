import { Document, model, Schema } from "mongoose"
import { ICoach, IStage, StageName } from "../utils/types"
import { IForm } from "./Form"
import { IUser } from "./User"

export interface ICohort extends Document {
  id: string
  name: string
  description: string
  isActive: boolean
  startDate: string
  endDate: string
  coaches: ICoach["_id"][] // refer to coach IDs
  trainees: IUser["_id"][] // refer to trainee IDs in trainees model
  stages: IStage[]
  applicationForm: IForm["_id"] | null
  cohortNumber: string
  forms: IForm["_id"][]
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    coaches: [{ type: Schema.Types.ObjectId, ref: "Coach" }],
    trainees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    stages: [
      {
        name: {
          type: String,
          enum: Object.values(StageName),
          required: true,
        },
        description: { type: String },
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
    applicationForm: {
      type: Schema.Types.ObjectId,
      ref: "Form",
      default: null,
    },
    forms: [{ type: Schema.Types.ObjectId, ref: "Form" }],
  },
  { timestamps: true },
)

export const Cohort = model<ICohort>("cohort", CohortSchema)

export default Cohort
