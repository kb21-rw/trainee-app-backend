import { Document, Schema, model } from "mongoose"
import { FormType, IStage } from "../utils/types"
import { IQuestion } from "./Question"

export interface IBaseForm extends Document {
  _id: string
  name: string
  description: string
  type: FormType
  questionIds: IQuestion["_id"][]
}

export interface IExtraApplicantFormFields {
  type: FormType.Application
  startDate: Date
  endDate: Date
  stages: IStage[]
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
    stages: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          description: { type: String, default: "" },
          _id: false,
        },
      ],
      required: function (this: IForm) {
        return this.type === FormType.Application
      },
    },
  },
  { timestamps: {} },
)
FormSchema.index({ name: "text", description: "text", type: "text" })

export default model("Form", FormSchema)
