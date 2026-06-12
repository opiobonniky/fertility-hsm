import { Router } from "express";
import * as reportController from "./report.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/kpi", can("report:kpi"), reportController.getKPI);
router.get("/kpi/fertilization", can("report:kpi"), reportController.getFertilizationRates);
router.get("/cycle-outcomes", can("report:cycle-outcomes"), reportController.getCycleOutcomes);
router.get("/financial", can("report:financial"), reportController.getFinancialReport);

export default router;
