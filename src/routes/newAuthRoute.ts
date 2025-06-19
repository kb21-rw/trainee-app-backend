import { Router } from "express"
import {
  applicantRegister,
  googleAuthController,
  login,
  register,
  resetPassword,
  verifyApplicant,
} from "../controllers/newAuthController"
import { verifyJWT } from "../middlewares/newAuthenticate"
import { isAdmin } from "../middlewares/newAuthorization"

const router = Router()

router.post("/register", verifyJWT, isAdmin, register)
router.post("/login", login)
router.post("/reset-password", resetPassword)

// Applicant
router.post("/register/applicant", applicantRegister)
router.patch("/applicant/verify", verifyApplicant)

router.post("/google", googleAuthController)

export default router
