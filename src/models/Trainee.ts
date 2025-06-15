import { Document, Schema, Types, model } from "mongoose"

export interface ITrainee extends Document {
  userId: Types.ObjectId
  cohortId: Types.ObjectId
  coachId: Types.ObjectId | string
  stage: string
}

const TraineeSchema = new Schema({
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
  coachId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  stage: {
    type: String,
    required: true,
  },
})

export default model<ITrainee>("Trainee", TraineeSchema)
