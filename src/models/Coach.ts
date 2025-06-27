import { Document, Schema, Types, model } from "mongoose"

export interface ICoach extends Document {
  userId: Types.ObjectId
  cohortId: Types.ObjectId
  trainees: Types.ObjectId[]
  applicants: Types.ObjectId[]
}

const CoachSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  cohortId: {
    type: Types.ObjectId,
    ref: "Cohort",
    required: true,
  },
  trainees: {
    type: [Types.ObjectId],
    ref: "Trainee",
    default: [],
  },
  applicants: {
    type: [Types.ObjectId],
    ref: "Trainee",
    default: [],
  },
})

export default model<ICoach>("Coach", CoachSchema)
