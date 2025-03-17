import { Router } from "express"
import { joinWaitListController } from "../controllers/joinWaitListController"

const router = Router()

// removed JWT verification because we'll be receiving responses from emails outside the application
router.post("/", joinWaitListController)

export default router
