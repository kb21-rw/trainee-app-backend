import Cohort from "../models/Cohort"
import Form from "../models/Form"
import { GetCohortDto } from "../utils/types"

export const getFormsQuery = async (
  searchString: string,
  cohort: GetCohortDto,
) => {
  const cohortData = await Cohort.findOne(cohort).lean().exec()

  if (!cohortData) {
    return null
  }

  const searchCriteria = searchString
    ? { name: { $regex: searchString, $options: "i" } }
    : {}

  const formIds = cohortData.forms || []
  const formsQuery = {
    _id: { $in: formIds },
    ...searchCriteria,
  }

  const forms = await Form.find(formsQuery).lean().exec()

  let applicationForm = null
  if (cohortData.applicationForm) {
    const appFormQuery = {
      _id: cohortData.applicationForm,
      ...(searchString ? searchCriteria : {}),
    }

    applicationForm = await Form.findOne(appFormQuery).lean().exec()
  }

  const formattedForms = forms.map((form) => ({
    _id: form._id,
    name: form.name,
    description: form.description,
    type: form.type,
    isApplicationForm: false,
    questions: form.questionIds?.length || 0,
  }))

  if (applicationForm) {
    formattedForms.push({
      _id: applicationForm._id,
      name: applicationForm.name,
      description: applicationForm.description,
      type: applicationForm.type,
      isApplicationForm: true,
      questions: applicationForm.questionIds?.length || 0,
    })
  }

  return {
    _id: cohortData._id,
    name: cohortData.name,
    description: cohortData.description,
    forms: formattedForms,
  }
}
