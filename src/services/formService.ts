import CustomError from "../middlewares/customError"
import Form, { IApplicationForm, IForm } from "../models/Form"
import Question from "../models/Question"
import Response from "../models/Response"
import { getFormsQuery } from "../queries/formQueries"
import {
  APPLICATION_FORM_ERROR,
  DUPLICATE_DOCUMENT,
  FORM_NOT_FOUND,
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
import { createStagesHandler } from "../utils/helpers"
import dayjs from "dayjs"

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

  const form = await getFormService({ _id: formId })

  if (name) {
    form.name = name
  }

  if (description) {
    form.description = description
  }

  if (form.type === FormType.Application) {
    const applicationForm = form as IApplicationForm
    if (formData.startDate) {
      applicationForm.startDate = dayjs(formData.startDate).toISOString()
    }

    if (formData.endDate) {
      applicationForm.endDate = dayjs(formData.endDate).toISOString()
    }

    if (formData.stages) {
      // To be implemented
    }
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

  if (formData.type === FormType.Application) {
    formData.startDate = dayjs(formData.startDate).toISOString()
    formData.endDate = dayjs(formData.endDate).toISOString()
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
