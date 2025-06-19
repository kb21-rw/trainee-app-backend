import { Document, Schema, Types, model } from "mongoose"
import { TraineeStatus } from "../utils/types"

export interface ITrainee extends Document {
  userId: Types.ObjectId
  cohortId: Types.ObjectId
  coachId: Types.ObjectId | string
  stage: string
  traineeStatus: TraineeStatus
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
  traineeStatus: {
    type: TraineeStatus,
    required: true,
    default: TraineeStatus.NOT_REGISTERED,
  },
})

export default model<ITrainee>("Trainee", TraineeSchema)
