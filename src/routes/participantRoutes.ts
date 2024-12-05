import { Router } from "express";
import { verifyJWT } from "../middlewares/authenticate";
import { updateParticipantController } from "../controllers/participantController";
import { isAdmin } from "../middlewares/authorization";

const router = Router();

router.patch("/:participantId", verifyJWT, isAdmin, updateParticipantController);

export default router;
