import { Router } from "express";
import * as cycleController from "./cycle.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import {
  createCycleSchema,
  updateCycleSchema,
  cycleStatusSchema,
  follicleTrackingSchema,
  opuRecordSchema,
  semenDataSchema,
  embryologyRecordSchema,
  embryoTransferSchema,
  pregnancyTestSchema,
  pregnancyOutcomeSchema,
} from "./cycle.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// ── Cycle CRUD ────────────────────────────────────────────────
router.get("/dashboard", can("cycle:view"), cycleController.getDashboard);
router.get("/", can("cycle:view"), cycleController.getAll);
router.get("/:id", can("cycle:view"), cycleController.getById);
router.post("/", can("cycle:create"), validate(createCycleSchema), cycleController.create);
router.put("/:id", can("cycle:edit"), validate(updateCycleSchema), cycleController.update);
router.patch("/:id/status", can("cycle:edit"), validate(cycleStatusSchema), cycleController.updateStatus);

// ── Follicle Tracking ─────────────────────────────────────────
router.get("/:id/follicles", can("follicle:view"), cycleController.getFollicles);
router.post("/:id/follicles", can("follicle:record"), validate(follicleTrackingSchema), cycleController.createFollicle);

// ── OPU ───────────────────────────────────────────────────────
router.get("/:id/opu", can("opu:view"), cycleController.getOpu);
router.post("/:id/opu", can("opu:record"), validate(opuRecordSchema), cycleController.createOpu);
router.put("/:id/opu", can("opu:record"), validate(opuRecordSchema), cycleController.updateOpu);

// ── Semen ─────────────────────────────────────────────────────
router.get("/:id/semen", can("semen:view"), cycleController.getSemen);
router.post("/:id/semen", can("semen:record"), validate(semenDataSchema), cycleController.createSemen);

// ── Embryology ────────────────────────────────────────────────
router.get("/:id/embryology", can("embryology:view"), cycleController.getEmbryology);
router.post("/:id/embryology", can("embryology:record"), validate(embryologyRecordSchema), cycleController.createEmbryology);

// ── Embryo Transfer ───────────────────────────────────────────
router.get("/:id/et", can("et:view"), cycleController.getET);
router.post("/:id/et", can("et:manage"), validate(embryoTransferSchema), cycleController.createET);

// ── Pregnancy ─────────────────────────────────────────────────
router.get("/:id/pregnancy-test", can("pregnancy-test:view"), cycleController.getPregnancyTest);
router.post("/:id/pregnancy-test", can("pregnancy-test:record"), validate(pregnancyTestSchema), cycleController.createPregnancyTest);
router.get("/:id/pregnancy-outcome", can("pregnancy-outcome:view"), cycleController.getPregnancyOutcome);
router.post("/:id/pregnancy-outcome", can("pregnancy-outcome:record"), validate(pregnancyOutcomeSchema), cycleController.createPregnancyOutcome);

export default router;
