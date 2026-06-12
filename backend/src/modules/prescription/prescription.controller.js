import * as prescriptionService from "./prescription.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getAll = asyncHandler(async (req, res) => {
  const result = await prescriptionService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await prescriptionService.getById(req.params.id);
  res.status(200).json({ success: true, data });
});

export const getPatientPrescriptions = asyncHandler(async (req, res) => {
  const data = await prescriptionService.getPatientPrescriptions(req.params.patientId);
  res.status(200).json({ success: true, data });
});

export const getActivePrescriptions = asyncHandler(async (req, res) => {
  const data = await prescriptionService.getActivePrescriptions(req.params.patientId);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await prescriptionService.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: "Prescription created", data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await prescriptionService.update(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Prescription updated", data });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, discontinuedReason } = req.body;
  const data = await prescriptionService.updateStatus(req.params.id, status, discontinuedReason);
  res.status(200).json({ success: true, message: `Prescription ${status.toLowerCase()}`, data });
});

/**
 * Get the full clinical timeline for a patient — used for cross-role visibility.
 * Doctors can see lab results, nurses can see prescriptions, etc.
 */
export const getClinicalTimeline = asyncHandler(async (req, res) => {
  const data = await prescriptionService.getPatientClinicalTimeline(req.params.patientId);
  res.status(200).json({ success: true, data });
});
