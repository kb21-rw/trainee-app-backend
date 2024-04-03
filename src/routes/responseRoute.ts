import { Router } from "express";
import { verifyJWT } from "../middlewares/authenticate";
import { isAdminOrCoach } from "../middlewares/authorization";
import { createResponse } from "../controllers/responseController";

const router = Router();

router.put("/:questionId?", verifyJWT, isAdminOrCoach, createResponse);

export default router;
