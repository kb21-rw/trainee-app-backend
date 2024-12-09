import { NextFunction, Response } from "express";
import { mongodbIdValidation } from "../validations/generalValidation";
import { updateParticipantService } from "../services/participantService";
import { updateParticipantSchema } from "../validations/participantValidation";

export const updateParticipantController = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { participantId } = req.params;
    await mongodbIdValidation.validateAsync(participantId);
    await updateParticipantSchema.validateAsync(req.body);
    const participant = await updateParticipantService(participantId, req.body);
    return res.status(200).send(participant);
  } catch (error) {
    next(error);
  }
};
