import { IForm } from "../../models/Form"

export const getCompleteForm = async (form: IForm) => {
  const { _id, name, description, type, questionIds } = await form.populate({
    path: "questionIds",
    select: "title type options",
  })

  const questions = questionIds.map(
    ({ id, prompt, type, required, options }) => ({
      id,
      prompt,
      type,
      required,
      options,
    }),
  )

  return { _id, name, description, type, questions }
}
