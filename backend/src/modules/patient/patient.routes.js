import { Router } from "express";
import * as patientController from "./patient.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { createPatientSchema, updatePatientSchema, searchPatientSchema, detectSpouseSchema, medicalHistorySchema } from "./patient.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/search", can("patient:view"), validate(searchPatientSchema, "query"), patientController.search);
router.get("/detect-spouse", can("spouse:auto-detect"), validate(detectSpouseSchema, "query"), patientController.detectSpouse);
router.get("/:id", can("patient:view"), patientController.getById);
router.post("/", can("patient:register"), validate(createPatientSchema), patientController.create);
router.put("/:id", can("patient:edit"), validate(updatePatientSchema), patientController.update);
router.put("/:id/medical-history", can("medical-history:edit"), validate(medicalHistorySchema), patientController.updateMedicalHistory);
router.delete("/:id", can("patient:delete"), patientController.remove);

export default router;
