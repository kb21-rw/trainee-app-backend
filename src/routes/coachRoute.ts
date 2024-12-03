import { Router } from "express";
import { addCoachToCohortController, getCoaches, updateCoachOrAdmin } from "../controllers/coachController";
import { verifyJWT } from "../middlewares/authenticate";
import { isAdmin } from "../middlewares/authorization";

const router = Router();

router.get("/all", verifyJWT, getCoaches);
router.patch("/edit-coach-or-admin/:id", verifyJWT, updateCoachOrAdmin);
router.post("/", verifyJWT, isAdmin, addCoachToCohortController);

export default router;
