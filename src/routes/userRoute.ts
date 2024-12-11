import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteUser,
  getUsersController,
} from "../controllers/userController";
import { verifyJWT } from "../middlewares/authenticate";
import { isAdmin } from "../middlewares/authorization";

const router = Router();

router.get("/", verifyJWT, isAdmin, getUsersController);
router.get("/my-profile", verifyJWT, getProfile);
router.patch("/my-profile", verifyJWT, updateProfile);
router.delete("/:userId", deleteUser);

export default router;
