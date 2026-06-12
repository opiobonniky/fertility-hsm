import { Router } from "express";
import * as permissionController from "./permission.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { assignPermissionSchema, removePermissionSchema } from "./permission.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", can("permissions:manage"), permissionController.getAll);
router.get("/grouped", can("permissions:manage"), permissionController.getGrouped);
router.get("/roles/:roleId", can("permissions:manage"), permissionController.getRolePermissions);
router.get("/roles/:roleId/available", can("permissions:manage"), permissionController.getAvailablePermissions);

router.post("/assign", can("permissions:manage"), validate(assignPermissionSchema), permissionController.assign);
router.post("/remove", can("permissions:manage"), validate(removePermissionSchema), permissionController.remove);

export default router;
