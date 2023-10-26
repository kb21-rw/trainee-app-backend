import { Response } from "express";
import {
  createFormValidation,
  editFormValidation,
} from "../validations/formValidation";
import Form from "../models/Form";

export const createForm = async (req: any, res: Response) => {
  try {
    const validationResult = createFormValidation.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({ message: validationResult.error.message });
    }

    const { title, description } = req.body;
    const createdForm = await Form.create({ title, description });
    return res.status(201).json(createdForm);
  } catch (error: any) {
    return res.status(400).json({ error });
  }
};

export const getForms = async (req: any, res: Response) => {
  try {
    const searchString = req.query.searchString || "";
    const forms = await Form.aggregate([
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
    return res.status(200).json(forms);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const updateForm = async (req: any, res: Response) => {
  try {
    const { formId } = req.params;
    const validationResult = editFormValidation.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({ message: validationResult.error.message });
    }

    const { title, description } = req.body;
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).send("form not found");
    }

    if (title) {
      form.title = title;
    }

    if (description) {
      form.description = description;
    }

    await form.save();

    return res.status(200).json(form);
  } catch (error) {
    return res.status(500).json({ error });
  }
};
