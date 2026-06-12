import * as patientService from "./patient.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const search = asyncHandler(async (req, res) => {
  const result = await patientService.searchPatients(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getById = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById(req.params.id);
  res.status(200).json({ success: true, data: patient });
});

export const create = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatient(req.body, req.user.id);
  res.status(201).json({ success: true, message: "Patient registered", data: patient });
});

export const updateMedicalHistory = asyncHandler(async (req, res) => {
  const history = await patientService.upsertMedicalHistory(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, message: "Medical history updated", data: history });
});

export const remove = asyncHandler(async (req, res) => {
  await patientService.deletePatient(req.params.id);
  res.status(200).json({ success: true, message: "Patient deactivated" });
});

export const update = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatient(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Patient updated", data: patient });
});

export const detectSpouse = asyncHandler(async (req, res) => {
  const candidates = await patientService.detectSpouse(req.query);
  res.status(200).json({ success: true, data: candidates });
});
