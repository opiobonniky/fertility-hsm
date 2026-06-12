import { Router } from "express";
import * as userController from "./user.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { createUserSchema, updateUserSchema } from "./user.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { rbac, can } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", can("admin:users"), userController.getAll);
router.get("/roles", can("admin:users"), userController.getRoles);
router.get("/physicians", can("cycle:create"), userController.getPhysicians);
router.get("/:id", can("admin:users"), userController.getById);
router.post("/", can("admin:users"), validate(createUserSchema), userController.create);
router.put("/:id", can("admin:users"), validate(updateUserSchema), userController.update);
router.patch("/:id/deactivate", can("admin:users"), userController.deactivate);

export default router;
