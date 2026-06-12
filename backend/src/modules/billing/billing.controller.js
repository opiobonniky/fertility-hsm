import * as billingService from "./billing.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getAll = asyncHandler(async (req, res) => {
  const result = await billingService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await billingService.getById(req.params.id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await billingService.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: "Invoice created", data });
});

export const send = asyncHandler(async (req, res) => {
  const data = await billingService.sendInvoice(req.params.id);
  res.status(200).json({ success: true, message: "Invoice sent", data });
});

export const cancel = asyncHandler(async (req, res) => {
  const data = await billingService.cancelInvoice(req.params.id);
  res.status(200).json({ success: true, message: "Invoice cancelled", data });
});

export const getPayments = asyncHandler(async (req, res) => {
  const invoice = await billingService.getById(req.params.id);
  res.status(200).json({ success: true, data: invoice.payments || [] });
});

export const addPayment = asyncHandler(async (req, res) => {
  const data = await billingService.addPayment(req.params.id, req.body, req.user.id);
  res.status(201).json({ success: true, message: "Payment recorded", data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await billingService.updateInvoice(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Invoice updated", data });
});

export const getPatientInvoices = asyncHandler(async (req, res) => {
  const data = await billingService.getPatientInvoices(req.params.patientId);
  res.status(200).json({ success: true, data });
});
