import { Router } from "express";
import * as prescriptionController from "./prescription.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { createPrescriptionSchema, updatePrescriptionSchema, prescriptionStatusSchema } from "./prescription.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// Prescription CRUD — medical roles can view, doctors can prescribe
router.get("/", can("prescription:view"), prescriptionController.getAll);
router.get("/:id", can("prescription:view"), prescriptionController.getById);

// Patient-specific prescriptions
router.get("/patient/:patientId", can("prescription:view"), prescriptionController.getPatientPrescriptions);
router.get("/patient/:patientId/active", can("prescription:view"), prescriptionController.getActivePrescriptions);

// Clinical timeline — cross-role visibility
router.get("/patient/:patientId/timeline", can("prescription:view"), prescriptionController.getClinicalTimeline);

// Write operations — only doctors and admins can prescribe
router.post("/", can("prescription:prescribe"), validate(createPrescriptionSchema), prescriptionController.create);
router.put("/:id", can("prescription:prescribe"), validate(updatePrescriptionSchema), prescriptionController.update);
router.patch("/:id/status", can("prescription:prescribe"), validate(prescriptionStatusSchema), prescriptionController.updateStatus);

export default router;
