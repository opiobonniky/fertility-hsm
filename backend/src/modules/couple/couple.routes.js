import { Router } from "express";
import * as coupleController from "./couple.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { createCoupleSchema, updateCoupleSchema } from "./couple.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", can("couple:manage"), coupleController.getAll);
router.get("/by-patient/:patientId", can("patient:view"), coupleController.getByPatient);
router.post("/", can("couple:manage"), validate(createCoupleSchema), coupleController.create);
router.put("/:id", can("couple:manage"), validate(updateCoupleSchema), coupleController.update);

export default router;
