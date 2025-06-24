import { Router } from "express"
import {
  deleteUser,
  getProfile,
  getUsersController,
  toggleUserActiveStatus,
  updateProfile,
  updateUser,
} from "../controllers/userController"
import { verifyJWT } from "../middlewares/authenticate"
import { isAdmin } from "../middlewares/authorization"

const router = Router()

router.get("/", verifyJWT, isAdmin, getUsersController)
router.get("/my-profile", verifyJWT, getProfile)
router.patch("/my-profile", verifyJWT, updateProfile)
router.patch("/:userId", verifyJWT, isAdmin, updateUser)
router.delete("/:userId", deleteUser)
router.patch("/:userId/status", verifyJWT, isAdmin, toggleUserActiveStatus)

export default router
