import { Router } from "express";
import * as clinicController from "./clinic.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// Anyone who can view appointments can see the clinic list
router.get("/", can("appointment:view"), clinicController.getAll);

export default router;
