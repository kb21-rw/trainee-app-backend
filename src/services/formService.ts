/* eslint-disable no-useless-catch */
import Form from "../models/Form";
import Question from "../models/Question";

import { CreateFormType, FormType } from "../utils/types";

export const getForms = async (searchString: string) => {
  try {
    const forms: FormType[] = await Form.aggregate([
      {
        $match: { title: { $regex: new RegExp(searchString, "i") } },
      },
      {
        $lookup: {
          from: "questions",
          localField: "questionsId",
          foreignField: "_id",
          as: "questions",
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          questions: 1,
        },
      },
    ]);
    return forms;
  } catch (error) {
    throw error;
  }
};

export const updateForm = async (formId: string, formData: CreateFormType) => {
  try {
    const { title, description } = formData;
    const form = await Form.findById(formId);

    if (!form) {
      return null;
    }

    if (title) {
      form.title = title;
    }

    if (description) {
      form.description = description;
    }

    await form.save();
  } catch (error) {
    throw error;
  }
};

export const createForm = async (formData: CreateFormType) => {
  try {
    const { title, description } = formData;
    const createdForm = await Form.create({ title, description });
    return createdForm;
  } catch (error) {
    throw error;
  }
};

export const getSingleForm = async (formId: string) => {
  try {
    const form = await Form.findById(formId);

    if (!form) {
      return null;
    }

    return form;
  } catch (error) {
    throw error;
  }
};

export const deleteForm = async (formId: string) => {
  try {
    const form = await Form.findByIdAndDelete(formId);

    if (!form) {
      return false;
    }

    await Question.deleteMany({ _id: { $in: form.questionsId } });
    return true;
  } catch (error) {
    throw error;
  }
};
