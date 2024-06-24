import { ObjectId, Schema, model } from "mongoose";

export interface ResponseProperties {
  _id: string;
  userId: ObjectId;
  text: string | string[];
}

const ResponseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: Schema.Types.Mixed,
      default: null,
      validate: {
        validator: function (value: string | string[]) {
          return (
            typeof value === "string" ||
            (Array.isArray(value) &&
              value.every((item) => typeof item === "string"))
          );
        },
        message: (props: { value: any }) =>
          `${props.value} is not a string or an array of strings!`,
      },
    },
  },
  { timestamps: {} }
);

export default model("Response", ResponseSchema);
