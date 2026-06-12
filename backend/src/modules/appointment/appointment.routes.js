import { Router } from "express";
import * as appointmentController from "./appointment.controller.js";
import { validate, validateQuery } from "../../middlewares/validateRequest.js";
import { appointmentSchema, appointmentSearchSchema, appointmentStatusSchema } from "./appointment.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/calendar", can("appointment:view"), appointmentController.getCalendar);
router.get("/", can("appointment:view"), validateQuery(appointmentSearchSchema), appointmentController.getAll);
router.get("/:id", can("appointment:view"), appointmentController.getById);
router.post("/", can("appointment:book"), validate(appointmentSchema), appointmentController.create);
router.put("/:id", can("appointment:edit"), validate(appointmentSchema), appointmentController.update);
router.patch("/:id/status", can("appointment:edit"), validate(appointmentStatusSchema), appointmentController.updateStatus);

export default router;
