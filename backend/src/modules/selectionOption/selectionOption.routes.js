import { Router } from "express";
import * as selectionOptionController from "./selectionOption.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { createOptionSchema, updateOptionSchema, reorderSchema } from "./selectionOption.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// Public endpoints (any authenticated user can read options)
router.get("/category/:category", selectionOptionController.getByCategory);
router.get("/grouped", can("admin:users"), selectionOptionController.getAllGrouped);

// Admin-only management
router.post("/", can("admin:users"), validate(createOptionSchema), selectionOptionController.create);
router.put("/reorder/batch", can("admin:users"), validate(reorderSchema), selectionOptionController.reorder);
router.put("/:id", can("admin:users"), validate(updateOptionSchema), selectionOptionController.update);
router.delete("/:id", can("admin:users"), selectionOptionController.remove);

export default router;
