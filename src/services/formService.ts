import CustomError from "../middlewares/customError"
import Form, { IForm } from "../models/Form"
import Question from "../models/Question"
import Response from "../models/Response"
import { getFormsQuery } from "../queries/formQueries"
import {
  APPLICATION_FORM_ERROR,
  DUPLICATE_DOCUMENT,
  FORM_NOT_FOUND,
  INVALID_MONGODB_ID,
  NOT_ALLOWED,
} from "../utils/errorCodes"
import { getCurrentCohort } from "../utils/helpers/cohort"
import {
  CreateApplicantTraineeFormDto,
  CreateApplicationFormDto,
  FormType,
  GetCohortDto,
  UpdateFormDto,
} from "../utils/types"
import mongoose from "mongoose"
import { createStagesHandler } from "../utils/helpers"
const { Types } = mongoose
const { ObjectId } = Types

export const getFormsService = async (
  searchString: string,
  cohort: GetCohortDto,
) => {
  return await getFormsQuery(searchString, cohort)
}

export const updateFormService = async (
  formId: string,
  formData: UpdateFormDto,
) => {
  const { name, description } = formData
  if (!ObjectId.isValid(formId)) {
    throw new CustomError(INVALID_MONGODB_ID, "Invalid Document ID", 400)
  }

  const form = await Form.findById(formId)
  if (!form) {
    throw new CustomError(FORM_NOT_FOUND, "Form not found", 404)
  }

  if (name) {
    form.name = name
  }

  if (description) {
    form.description = description
  }

  await form.save()
  return form
}

export const createFormService = async (
  formData: CreateApplicationFormDto | CreateApplicantTraineeFormDto,
) => {
  const currentCohort = await getCurrentCohort()

  if (formData.type === FormType.Application && currentCohort.applicationForm) {
    throw new CustomError(
      APPLICATION_FORM_ERROR,
      "An application form already exists. Please edit the existing form.",
      409,
    )
  }

  if (formData.type !== FormType.Application) {
    const cohortWithPopulatedForms = await currentCohort.populate<{
      forms: IForm[]
    }>("forms")

    if (
      cohortWithPopulatedForms.forms.some((form) => form.name === formData.name)
    ) {
      throw new CustomError(
        DUPLICATE_DOCUMENT,
        "A form with the same name already exists",
        409,
      )
    }
  }

  const stages =
    formData.type === FormType.Application
      ? createStagesHandler(formData.stages)
      : undefined

  const form = await Form.create({ ...formData, stages })

  if (form.type === FormType.Application) {
    currentCohort.applicationForm = form.id
  } else {
    currentCohort.forms.push(form.id)
  }

  await currentCohort.save()
  return form
}

export const getFormService = async (query: object) => {
  const form = await Form.findOne<IForm>(query).populate("questionIds").exec()

  if (!form) {
    throw new CustomError(FORM_NOT_FOUND, "Form not found", 404)
  }

  return form
}

export const deleteFormService = async (formId: string) => {
  const currentCohort = await getCurrentCohort()

  const form = await Form.findById(formId)

  if (!form) {
    throw new CustomError(FORM_NOT_FOUND, "Form not found", 404)
  }

  if (form.type === FormType.Application) {
    throw new CustomError(
      NOT_ALLOWED,
      "Application form can not be deleted",
      403,
    )
  }

  if (!currentCohort.forms.includes(formId)) {
    throw new CustomError(
      FORM_NOT_FOUND,
      "Form was not found in the current cohort",
      404,
    )
  }

  await Form.deleteOne({ _id: formId })

  currentCohort.forms = currentCohort.forms.filter(
    (formIds) => formIds.toString() !== formId,
  )
  await currentCohort.save()

  // Remove questions in deleted form and their responses
  form.questionIds.forEach(async (questionId) => {
    const question = await Question.findByIdAndDelete(questionId)
    await Response.deleteMany({ _id: { $in: question?.responseIds } })
  })
  await Question.deleteMany({ _id: { $in: form.questionIds } })
}
