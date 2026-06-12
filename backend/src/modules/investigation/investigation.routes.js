import { Router } from "express";
import * as investigationController from "./investigation.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { investigationSchema } from "./investigation.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", can("investigation:view"), investigationController.getAll);
router.get("/:id", can("investigation:view"), investigationController.getById);
router.post("/", can("investigation:order", "investigation:record-results"), validate(investigationSchema), investigationController.create);
router.put("/:id", can("investigation:record-results"), investigationController.update);

export default router;
