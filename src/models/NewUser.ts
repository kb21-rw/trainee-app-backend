import { Document, Schema, model } from "mongoose"
import { NewRole, UserStatus } from "../utils/types"

export interface INewUser extends Document {
  userNumber: string
  name: string
  email: string
  verified: boolean
  password: string
  googleId: string
  role: NewRole
  status: UserStatus
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const NewUserSchema = new Schema(
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
      enum: Object.values(NewRole),
      default: NewRole.Trainee,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.NOT_REGISTERED,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: {} },
)
NewUserSchema.index({ name: "text" })

export default model<INewUser>("NewUser", NewUserSchema)
