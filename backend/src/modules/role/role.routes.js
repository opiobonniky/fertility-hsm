import { Router } from "express";
import * as roleController from "./role.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { createRoleSchema, updateRoleSchema } from "./role.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(authenticate);

// All role management requires admin-level permission
router.get("/", can("admin:users"), roleController.getAll);
router.get("/:id", can("admin:users"), roleController.getById);
router.post("/", can("admin:users"), validate(createRoleSchema), roleController.create);
router.put("/:id", can("admin:users"), validate(updateRoleSchema), roleController.update);
router.delete("/:id", can("admin:users"), roleController.remove);

export default router;
