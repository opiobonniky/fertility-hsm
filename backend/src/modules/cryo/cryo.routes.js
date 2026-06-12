import { Router } from "express";
import * as cryoController from "./cryo.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { cryoTankSchema, embryoCryoSchema, spermCryoSchema } from "./cryo.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// Tanks
router.get("/tanks", can("tank:view"), cryoController.getTanks);
router.post("/tanks", can("tank:manage"), validate(cryoTankSchema), cryoController.createTank);
router.put("/tanks/:id", can("tank:manage"), validate(cryoTankSchema), cryoController.updateTank);
router.get("/tanks/:id/contents", can("tank:view"), cryoController.getTankContents);

// Embryo
router.get("/embryos", can("cryo:view"), cryoController.getEmbryos);
router.post("/embryos", can("cryo:manage"), validate(embryoCryoSchema), cryoController.createEmbryoCryo);
router.patch("/embryos/:id/discard", can("cryo:discard"), cryoController.discardEmbryoCryo);

// Sperm
router.get("/sperm", can("cryo:view"), cryoController.getSperm);
router.post("/sperm", can("cryo:manage"), validate(spermCryoSchema), cryoController.createSpermCryo);

// Oocytes
router.get("/oocytes", can("cryo:view"), cryoController.getOocytes);
router.post("/oocytes", can("cryo:manage"), validate(spermCryoSchema), cryoController.createOocyteCryo);

// Expiring
router.get("/expiring", can("cryo:view"), cryoController.getExpiring);

export default router;
