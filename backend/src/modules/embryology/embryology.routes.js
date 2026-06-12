import { Router } from "express";
import * as embryologyController from "./embryology.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { embryologyRecordSchema, biopsySchema, ngsResultSchema } from "./embryology.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// Embryology Records (Daily Grading D0-D7)
router.get("/cycles/:cycleId/records", can("embryology:view"), embryologyController.getEmbryologyRecords);
router.post("/cycles/:cycleId/records", can("embryology:manage"), validate(embryologyRecordSchema), embryologyController.createEmbryologyRecord);
router.put("/cycles/:cycleId/records/:id", can("embryology:manage"), validate(embryologyRecordSchema.partial()), embryologyController.updateEmbryologyRecord);

// Biopsy routes
router.get("/cycles/:cycleId/biopsies", can("biopsy:view"), embryologyController.getBiopsies);
router.post("/cycles/:cycleId/biopsies", can("biopsy:manage"), validate(biopsySchema), embryologyController.createBiopsy);

// NGS Results
router.get("/cycles/:cycleId/ngs-results", can("ngs:view"), embryologyController.getNGSResults);
router.post("/biopsies/:biopsyId/ngs-results", can("ngs:record"), validate(ngsResultSchema), embryologyController.createNGSResult);

export default router;
