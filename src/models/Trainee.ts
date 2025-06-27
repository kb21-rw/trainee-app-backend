import { Document, Schema, Types, model } from "mongoose"
import { IFeedback, TraineeStatus } from "../utils/types"

export interface ITrainee extends Document {
  userId: string
  cohortId: string
  coachId: string
  stage: string
  traineeStatus: TraineeStatus
  feedbacks: IFeedback[]
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
    required: false,
  },
  stage: {
    type: String,
    required: true,
  },
  traineeStatus: {
    type: String,
    enum: Object.values(TraineeStatus),
    default: TraineeStatus.ENROLLED,
  },
  feedbacks: {
    type: [
      {
        stageId: { type: Types.ObjectId, required: true },
        description: { type: String, required: true },
      },
    ],
    default: [],
  },
})

export default model<ITrainee>("Trainee", TraineeSchema)
