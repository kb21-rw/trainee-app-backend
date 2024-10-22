import { Router } from "express";
import { verifyJWT } from "../middlewares/authenticate";
import { isAdmin } from "../middlewares/authorization";
import { getApplicants, updateApplicantController } from "../controllers/applicantControllers";

const router = Router();

router.get("/", verifyJWT, isAdmin, getApplicants)
router.patch("/:id", verifyJWT, isAdmin, updateApplicantController);

export default router;
