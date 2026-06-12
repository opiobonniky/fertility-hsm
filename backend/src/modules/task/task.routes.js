import { Router } from "express";
import * as taskController from "./task.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { taskSchema, taskCompleteSchema } from "./task.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/my", can("task:view"), taskController.getMyTasks);
router.get("/:id", can("task:view"), taskController.getById);
router.get("/", can("task:view"), taskController.getAll);
router.post("/", can("task:create"), validate(taskSchema), taskController.create);
router.put("/:id", can("task:create"), validate(taskSchema), taskController.update);
router.patch("/:id/complete", can("task:complete"), validate(taskCompleteSchema), taskController.complete);

export default router;
