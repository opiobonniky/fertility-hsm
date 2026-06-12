import { Router } from "express";
import * as billingController from "./billing.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { createInvoiceSchema, updateInvoiceSchema, addPaymentSchema } from "./billing.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { can } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", can("invoice:view"), billingController.getAll);
router.get("/:id", can("invoice:view"), billingController.getById);
router.post("/", can("invoice:create"), validate(createInvoiceSchema), billingController.create);
router.put("/:id", can("invoice:update"), validate(updateInvoiceSchema), billingController.update);
router.patch("/:id/send", can("invoice:update"), billingController.send);
router.patch("/:id/cancel", can("invoice:cancel"), billingController.cancel);

router.get("/:id/payments", can("payment:view"), billingController.getPayments);
router.post("/:id/payments", can("payment:process"), validate(addPaymentSchema), billingController.addPayment);

// Patient invoices (nested under patients)

export default router;
