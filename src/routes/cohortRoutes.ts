import { Router } from "express";
import { verifyJWT } from "../middlewares/authenticate";
import { isAdmin } from "../middlewares/authorization";
import { createCohortController, getApplicationFormController } from "../controllers/cohortControllers";

const router = Router();


router.get("/application", verifyJWT, getApplicationFormController);

router.post("/", verifyJWT, isAdmin, createCohortController);

export default router;
