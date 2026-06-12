import * as investigationService from "./investigation.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getAll = asyncHandler(async (req, res) => {
  const data = await investigationService.getAll(req.query.patientId);
  res.status(200).json({ success: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await investigationService.getById(req.params.id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await investigationService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await investigationService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data });
});
