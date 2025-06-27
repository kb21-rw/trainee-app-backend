import { Document, Schema, model } from "mongoose"
import { Role, TraineeStatus } from "../utils/types"

export interface IUser extends Document {
  name: string
  email: string
  verified: boolean
  password: string
  googleId: string | null
  role: Role
  status: TraineeStatus
  active: boolean
}

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.Trainee,
    },
    status: {
      type: String,
      enum: Object.values(TraineeStatus),
      default: TraineeStatus.NOT_REGISTERED,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: {} },
)
UserSchema.index({ name: "text" })

export default model<IUser>("user", UserSchema)
