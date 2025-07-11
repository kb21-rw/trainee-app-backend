import { Document, Schema, model } from "mongoose"
import { FormType, IStage } from "../utils/types"
import { IQuestion } from "./Question"

export interface IBaseForm extends Document {
  _id: string
  name: string
  description: string
  type: FormType
  questionIds: IQuestion["_id"][]
  stageId?: IStage["id"]
}

export interface IExtraApplicantFormFields {
  type: FormType.Application
  startDate: string
  endDate: string
}

export interface IApplicationForm
  extends Omit<IBaseForm, "type">,
    IExtraApplicantFormFields {}

export type IForm = IBaseForm | IApplicationForm

const FormSchema = new Schema<IForm>(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    questionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    type: {
      type: String,
      enum: FormType,
      required: true,
    },
    startDate: String,
    endDate: String,
    stageId: { type: String },
  },
  { timestamps: {} },
)
FormSchema.index({ name: "text", description: "text", type: "text" })

export default model("Form", FormSchema)
