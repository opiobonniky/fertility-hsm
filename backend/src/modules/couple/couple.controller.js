import * as coupleService from "./couple.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getAll = asyncHandler(async (req, res) => {
  const result = await coupleService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getByPatient = asyncHandler(async (req, res) => {
  const couple = await coupleService.getCoupleByPatientId(req.params.patientId);
  res.status(200).json({ success: true, data: couple });
});

export const create = asyncHandler(async (req, res) => {
  const couple = await coupleService.createCouple(req.body, req.user.id);
  res.status(201).json({ success: true, message: "Couple created", data: couple });
});

export const update = asyncHandler(async (req, res) => {
  const couple = await coupleService.updateCouple(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Couple updated", data: couple });
});
